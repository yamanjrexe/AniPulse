﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const {
  getLevelFromXP,
  getTitleForLevel,
  getXPToNextLevel,
  getXPProgress,
} = require('../utils/levelSystem');

const router = express.Router();

const rankCache = new Map();
const RANK_CACHE_TTL = 60 * 1000;

function cacheGet(key) {
  const entry = rankCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > RANK_CACHE_TTL) {
    rankCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  rankCache.set(key, { value, timestamp: Date.now() });
  if (rankCache.size > 100) {
    const oldest = [...rankCache.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    )[0];
    if (oldest) rankCache.delete(oldest[0]);
  }
}

// ─────────────────────────────────────────────────────────
// GET /global-paginated
// ─────────────────────────────────────────────────────────
router.get('/global-paginated', verifyToken, async (req, res) => {
  const t0 = Date.now();
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const type = req.query.type || 'xp';
    const offset = (page - 1) * limit;

    const sortField =
      type === 'level' ? 'level'
        : type === 'anime' ? 'totalAnime'
          : type === 'hours' ? 'totalHours'
            : 'totalXP';
    const cacheKey = `rank:${sortField}:${page}:${limit}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      const rankings = cached.rankings.map((u) => ({
        ...u,
        isCurrentUser: u.uid === req.userId,
      }));
      return res.json({
        ...cached,
        rankings,
        cached: true,
        ms: Date.now() - t0,
      });
    }

    const [snapshot, countSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS)
        .orderBy(sortField, 'desc')
        .offset(offset)
        .limit(limit)
        .get(),
      db.collection(COLLECTIONS.USERS).count().get().catch(() => null),
    ]);

    const totalUsers =
      countSnap?.data()?.count ?? snapshot.size;

    const rankings = [];
    for (const doc of snapshot.docs) {
      const u = doc.data();
      const uid = doc.id;
      const displayName = u.name || u.username;
      if (!displayName || displayName === 'User') continue;
      const level = u.level || 1;
      rankings.push({
        uid,
        username: displayName,
        name: displayName,
        avatar:
          u.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            displayName
          )}&background=6366F1&color=fff&bold=true&size=200`,
        level,
        title: u.title || getTitleForLevel(level),
        totalXP: u.totalXP || 0,
        totalAnime: u.totalAnime || 0,
        totalHours: u.totalHours || 0,
        totalEpisodes: u.totalEpisodes || 0,
        isCurrentUser: uid === req.userId,
        rank: offset + rankings.length + 1,
      });
    }

    let currentUserRank = null;
    const onPage = rankings.some((r) => r.isCurrentUser);
    if (onPage) {
      currentUserRank = rankings.find((r) => r.isCurrentUser).rank;
    } else if (page === 1) {
      try {
        const userDoc = await db
          .collection(COLLECTIONS.USERS)
          .doc(req.userId)
          .get();
        if (userDoc.exists) {
          const value = userDoc.data()[sortField] || 0;
          if (value > 0) {
            const higher = await db
              .collection(COLLECTIONS.USERS)
              .where(sortField, '>', value)
              .count()
              .get();
            currentUserRank = higher.data().count + 1;
          } else {
            currentUserRank = totalUsers;
          }
        }
      } catch (_) {
      }
    }

    const response = {
      rankings,
      totalUsers,
      currentUserRank,
      currentUserId: req.userId,
      page,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    };

    const cacheFriendly = {
      ...response,
      rankings: rankings.map((r) => ({ ...r, isCurrentUser: false })),
    };
    cacheSet(cacheKey, cacheFriendly);

    res.set('Cache-Control', 'private, max-age=30');
    res.json({ ...response, cached: false, ms: Date.now() - t0 });
  } catch (error) {
    console.error('Global ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /my-rank
// ─────────────────────────────────────────────────────────
router.get('/my-rank', verifyToken, async (req, res) => {
  try {
    const userDoc = await db
      .collection(COLLECTIONS.USERS)
      .doc(req.userId)
      .get();
    const userData = userDoc.data();
    if (!userData) {
      return res.json({
        rank: 0,
        totalUsers: 0,
        level: 1,
        title: 'Newbie',
        totalXP: 0,
      });
    }
    const currentXP = userData.totalXP || 0;
    const currentLevel = getLevelFromXP(currentXP);
    const currentTitle = getTitleForLevel(currentLevel);
    const nextLevelXP = getXPToNextLevel(currentLevel, currentXP);
    const progress = getXPProgress(currentLevel, currentXP);

    // Parallel fetch
    const [higher, countSnap] = await Promise.all([
      db
        .collection(COLLECTIONS.USERS)
        .where('totalXP', '>', currentXP)
        .count()
        .get()
        .catch(() => null),
      db
        .collection(COLLECTIONS.USERS)
        .count()
        .get()
        .catch(() => null),
    ]);

    const totalUsers = countSnap?.data()?.count ?? 1;
    const rank = (higher?.data()?.count ?? 0) + 1;

    res.json({
      rank,
      totalUsers,
      username: userData.username || userData.name || 'User',
      level: currentLevel,
      title: currentTitle,
      totalXP: currentXP,
      xpToNextLevel: Math.max(0, nextLevelXP),
      xpProgress: Math.min(100, Math.max(0, progress)),
      nextLevelTitle: getTitleForLevel(currentLevel + 1),
    });
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /xp-curve
// ─────────────────────────────────────────────────────────
router.get('/xp-curve', async (req, res) => {
  const {
    LEVEL_THRESHOLDS,
    getTitleForLevel: titleFor,
  } = require('../utils/levelSystem');
  const curve = [];
  for (let level = 1; level <= 100; level++) {
    curve.push({
      level,
      title: titleFor(level),
      xpRequired: LEVEL_THRESHOLDS[level],
      xpToNext: LEVEL_THRESHOLDS[level + 1]
        ? LEVEL_THRESHOLDS[level + 1] - LEVEL_THRESHOLDS[level]
        : 0,
    });
  }
  res.json(curve);
});

module.exports = router;