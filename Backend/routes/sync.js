const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const {
  getLevelFromXP,
  getTitleForLevel,
  calculateTotalXPFromAnimeList,
  calculateTotalHours
} = require('../utils/levelSystem');
const router = express.Router();

router.use(express.json({ limit: '50mb' }));

const MAX_ANIME_LIST = 10000;
const MAX_ACTIVITY_LOG = 500;
const MAX_ACHIEVEMENTS = 100;
const MAX_XP_HISTORY = 5000;

function sanitizeAnime(anime, existingIds) {
  let id = anime.id;
  if (id === undefined || id === null) {
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    id = maxId + 1;
    while (existingIds.includes(id)) id++;
  } else if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed) && parsed > 0) {
      id = parsed;
    } else {
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      id = maxId + 1;
      while (existingIds.includes(id)) id++;
    }
  } else if (typeof id !== 'number' || id < 1) {
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    id = maxId + 1;
    while (existingIds.includes(id)) id++;
  }
  existingIds.push(id);

  const title = (anime.title && typeof anime.title === 'string' && anime.title.trim().length > 0)
    ? anime.title.trim()
    : 'Unknown';

  const validTypes = ['TV', 'TV_SHORT', 'Movie', 'OVA', 'ONA', 'Special'];
  let type = (anime.type && typeof anime.type === 'string') ? anime.type : 'TV';
  if (!validTypes.includes(type)) type = 'TV';

  const episodes = typeof anime.episodes === 'number' ? Math.max(0, anime.episodes) : 0;
  const duration = typeof anime.duration === 'number' ? Math.max(1, anime.duration) : 20;
  let progress = typeof anime.progress === 'number' ? Math.max(0, anime.progress) : 0;
  if (episodes > 0 && progress > episodes) progress = episodes;

  const validStatuses = ['Completed', 'Watching', 'Plan to Watch', 'Dropped', 'On-Hold'];
  let userStatus = (anime.userStatus && typeof anime.userStatus === 'string') ? anime.userStatus : 'Plan to Watch';
  if (!validStatuses.includes(userStatus)) userStatus = 'Plan to Watch';

  let score = undefined;
  if (anime.score !== undefined && anime.score !== null) {
    const s = parseFloat(anime.score);
    if (!isNaN(s) && s >= 0 && s <= 10) score = Math.round(s * 10) / 10;
  }

  const cover = (anime.cover && typeof anime.cover === 'string') ? anime.cover : '';

  let genres = [];
  if (Array.isArray(anime.genres)) {
    genres = anime.genres.filter(g => typeof g === 'string').slice(0, 10);
  }

  const finishDate = (anime.finishDate && typeof anime.finishDate === 'string') ? anime.finishDate : null;
  const actualFinishDate = (anime.actualFinishDate && typeof anime.actualFinishDate === 'string') ? anime.actualFinishDate : null;
  const createdAt = (anime.createdAt && typeof anime.createdAt === 'string') ? anime.createdAt : new Date().toISOString();
  const updatedAt = (anime.updatedAt && typeof anime.updatedAt === 'string') ? anime.updatedAt : new Date().toISOString();

  return {
    id,
    title,
    type,
    episodes,
    duration,
    progress,
    userStatus,
    score,
    cover,
    genres,
    finishDate,
    actualFinishDate,
    createdAt,
    updatedAt,
    ...(anime.earnedEpisodesExp !== undefined && { earnedEpisodesExp: anime.earnedEpisodesExp })
  };
}

function sanitizeAnimeList(list) {
  if (!Array.isArray(list)) return [];
  if (list.length > MAX_ANIME_LIST) {
    list = list.slice(0, MAX_ANIME_LIST);
  }
  const existingIds = [];
  return list.map(anime => sanitizeAnime(anime, existingIds));
}

function validateActivityLog(log) {
  if (!Array.isArray(log)) return { valid: false, error: 'activityLog must be an array' };
  if (log.length > MAX_ACTIVITY_LOG) return { valid: false, error: `activityLog exceeds maximum size of ${MAX_ACTIVITY_LOG}` };
  for (let i = 0; i < log.length; i++) {
    const item = log[i];
    if (!item || typeof item !== 'object') return { valid: false, error: `Invalid activity at index ${i}` };
    if (!item.action || typeof item.action !== 'string') return { valid: false, error: `Missing action in activity at index ${i}` };
    if (!item.animeTitle || typeof item.animeTitle !== 'string') return { valid: false, error: `Missing animeTitle in activity at index ${i}` };
    if (!item.timestamp || typeof item.timestamp !== 'string') return { valid: false, error: `Missing timestamp in activity at index ${i}` };
  }
  return { valid: true };
}

function validateAchievements(list) {
  if (!Array.isArray(list)) return { valid: false, error: 'unlockedAchievements must be an array' };
  if (list.length > MAX_ACHIEVEMENTS) return { valid: false, error: `unlockedAchievements exceeds maximum size of ${MAX_ACHIEVEMENTS}` };
  for (let i = 0; i < list.length; i++) {
    if (typeof list[i] !== 'string') return { valid: false, error: `Invalid achievement at index ${i}` };
  }
  return { valid: true };
}

function validateXpHistory(list) {
  if (!Array.isArray(list)) return { valid: false, error: 'userXpHistory must be an array' };
  if (list.length > MAX_XP_HISTORY) return { valid: false, error: `userXpHistory exceeds maximum size of ${MAX_XP_HISTORY}` };
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') return { valid: false, error: `Invalid XP history at index ${i}` };
    if (item.xp !== undefined && typeof item.xp !== 'number') return { valid: false, error: `Invalid xp at index ${i}` };
    if (item.timestamp && typeof item.timestamp !== 'string') return { valid: false, error: `Invalid timestamp at index ${i}` };
  }
  return { valid: true };
}

function validateAppSettings(settings) {
  if (!settings || typeof settings !== 'object') return { valid: false, error: 'appSettings must be an object' };
  return { valid: true };
}

function validateContributions(contrib) {
  if (!contrib || typeof contrib !== 'object') return { valid: false, error: 'animeContributions must be an object' };
  return { valid: true };
}

function sanitizeProfile(userProfile) {
  if (!userProfile) return null;
  const clean = {
    name: (userProfile.name || '').slice(0, 50),
    username: (userProfile.username || '').slice(0, 50),
    bio: (userProfile.bio || '').slice(0, 200),
    status: (userProfile.status || '').slice(0, 50),
    favoriteAnime: Array.isArray(userProfile.favoriteAnime) ? userProfile.favoriteAnime.slice(0, 20) : [],
    social: {}
  };

  //  PRESERVE NEW FIELDS
  if (userProfile.profileVisibility) clean.profileVisibility = userProfile.profileVisibility;
  if (userProfile.publicUsername) clean.publicUsername = userProfile.publicUsername;
  if (userProfile.usernameLower) clean.usernameLower = userProfile.usernameLower;

  if (userProfile.social && typeof userProfile.social === 'object') {
    const allowed = ['anilist', 'myanimelist', 'twitter', 'instagram'];
    for (const key of allowed) {
      if (userProfile.social[key]) {
        clean.social[key] = userProfile.social[key].slice(0, 100);
      }
    }
  }
  if (userProfile.cover) clean.cover = userProfile.cover;
  if (userProfile.memberSince) clean.memberSince = userProfile.memberSince;
  if (userProfile.createdAt) clean.createdAt = userProfile.createdAt;
  return clean;
}

function sanitizeStreakData(streakData) {
  if (!streakData || typeof streakData !== 'object') return null;
  const streak = Number.isFinite(streakData.streak) ? Math.max(0, Math.floor(streakData.streak)) : 0;
  const lastActive = (typeof streakData.lastActive === 'string' && streakData.lastActive.length > 0)
    ? streakData.lastActive
    : null;
  return { streak, lastActive };
}

router.post('/sync-all', verifyToken, async (req, res) => {
  const {
    animeData, activityLog, userProfile, unlockedAchievements,
    userXpHistory, animeContributions, appSettings, levelData,
    dailyXP, xpPendingQueue, lastResetDate, streakData
  } = req.body;

  const userId = req.userId;
  try {
    const sanitizedAnime = sanitizeAnimeList(animeData || []);

    const validationResults = [
      validateActivityLog(activityLog),
      validateAchievements(unlockedAchievements),
      validateXpHistory(userXpHistory),
      validateAppSettings(appSettings),
      validateContributions(animeContributions)
    ];

    for (const result of validationResults) {
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
    }

    const cleanProfile = sanitizeProfile(userProfile);
    const cleanStreak = sanitizeStreakData(streakData);

    const promises = [];

    if (sanitizedAnime.length > 0) {
      promises.push(
        db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).set({
          animeList: sanitizedAnime,
          lastUpdated: new Date().toISOString(),
          count: sanitizedAnime.length
        })
      );
    }

    if (activityLog && Array.isArray(activityLog)) {
      const enrichedLog = activityLog.map(item => {
        if (!item.id) item.id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        return item;
      });
      promises.push(
        db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).set({
          activities: enrichedLog,
          lastUpdated: new Date().toISOString(),
          count: enrichedLog.length
        })
      );
    }

    if (cleanProfile) {
      delete cleanProfile.avatar;
      promises.push(
        db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
          ...cleanProfile,
          lastSynced: new Date().toISOString()
        }, { merge: true })
      );
    }

    if (unlockedAchievements && Array.isArray(unlockedAchievements)) {
      promises.push(
        db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).set({
          unlocked: unlockedAchievements,
          lastUpdated: new Date().toISOString(),
          count: unlockedAchievements.length
        })
      );
    }

    if (userXpHistory && Array.isArray(userXpHistory)) {
      promises.push(
        db.collection(COLLECTIONS.XP_HISTORY).doc(userId).set({
          history: userXpHistory,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    if (animeContributions && typeof animeContributions === 'object') {
      promises.push(
        db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).set({
          contributions: animeContributions,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    if (appSettings && typeof appSettings === 'object') {
      promises.push(
        db.collection(COLLECTIONS.SETTINGS).doc(userId).set({
          settings: appSettings,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    const recalculatedXP = calculateTotalXPFromAnimeList(sanitizedAnime);
    const recalculatedLevel = getLevelFromXP(recalculatedXP);
    const recalculatedTitle = getTitleForLevel(recalculatedLevel);
    const totalCompleted = sanitizedAnime.filter(a => a.userStatus === 'Completed').length;
    const totalHours = calculateTotalHours(sanitizedAnime);

    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const existingUser = await userRef.get();
    const existingData = existingUser.exists ? existingUser.data() : {};
    const overrides = existingData.adminOverrides || {};

    const finalXP = typeof overrides.totalXP === 'number' ? overrides.totalXP : recalculatedXP;
    const finalLevel = typeof overrides.level === 'number' ? overrides.level : recalculatedLevel;
    const finalTitle = overrides.title || recalculatedTitle;

    const userUpdate = {
      totalXP: finalXP,
      level: finalLevel,
      title: finalTitle,
      totalAnime: totalCompleted,
      totalHours: totalHours,
      username: cleanProfile?.username || 'User',
      name: cleanProfile?.name || cleanProfile?.username || 'User',
      lastUpdated: new Date().toISOString()
    };

    //  SAVE NEW FIELDS TO MAIN USER DOC
    if (cleanProfile?.profileVisibility) userUpdate.profileVisibility = cleanProfile.profileVisibility;
    if (cleanProfile?.publicUsername) userUpdate.publicUsername = cleanProfile.publicUsername;
    if (cleanProfile?.usernameLower) userUpdate.usernameLower = cleanProfile.usernameLower;

    if (dailyXP) userUpdate.dailyXP = dailyXP;
    if (xpPendingQueue) userUpdate.xpPendingQueue = xpPendingQueue;
    if (lastResetDate) userUpdate.lastResetDate = lastResetDate;

    if (cleanStreak) {
      const existingStreak = existingData.streak || 0;
      const existingLast = existingData.lastActive || null;
      const incomingStreak = cleanStreak.streak;
      const incomingLast = cleanStreak.lastActive;

      let useIncoming = true;
      if (existingStreak > incomingStreak && existingLast && incomingLast && existingLast === incomingLast) {
        useIncoming = false;
      }

      userUpdate.streak = useIncoming ? incomingStreak : existingStreak;
      userUpdate.lastActive = useIncoming ? incomingLast : existingLast;
    }

    promises.push(userRef.set(userUpdate, { merge: true }));

    await Promise.all(promises);
    res.json({ success: true, message: 'All data synced to cloud successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/load-all', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const data = {};
    let lastModified = null;

    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (animeDoc.exists) {
      data.animeData = animeDoc.data().animeList || [];
      lastModified = animeDoc.data().lastUpdated || null;
    } else {
      data.animeData = [];
    }

    const activityDoc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).get();
    data.activityLog = activityDoc.exists ? activityDoc.data().activities || [] : [];

    const profileDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    data.userProfile = profileDoc.exists ? profileDoc.data() : null;

    const achievementsDoc = await db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).get();
    data.unlockedAchievements = achievementsDoc.exists ? achievementsDoc.data().unlocked || [] : [];

    const xpDoc = await db.collection(COLLECTIONS.XP_HISTORY).doc(userId).get();
    data.userXpHistory = xpDoc.exists ? xpDoc.data().history || [] : [];

    const contributionsDoc = await db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).get();
    data.animeContributions = contributionsDoc.exists ? contributionsDoc.data().contributions || {} : {};

    const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc(userId).get();
    data.appSettings = settingsDoc.exists ? settingsDoc.data().settings || {} : {};

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      data.levelData = {
        totalXP: userData.totalXP || 0,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      };
      if (userData.dailyXP) data.dailyXP = userData.dailyXP;
      if (userData.xpPendingQueue) data.xpPendingQueue = userData.xpPendingQueue;
      if (userData.lastResetDate) data.lastResetDate = userData.lastResetDate;
      if (userData.profileVisibility) data.profileVisibility = userData.profileVisibility;
      if (userData.publicUsername) data.publicUsername = userData.publicUsername;
      if (userData.usernameLower) data.usernameLower = userData.usernameLower;

      data.streakData = {
        streak: userData.streak || 0,
        lastActive: userData.lastActive || null
      };
    } else {
      data.levelData = { totalXP: 0, level: 1, title: 'Newbie', totalAnime: 0, totalHours: 0 };
      data.streakData = { streak: 0, lastActive: null };
    }

    res.json({ success: true, data, lastModified });
  } catch (error) {
    console.error('❌ Load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/status', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data() || {};
    res.json({
      hasCloudData: animeDoc.exists,
      lastUpdated: animeDoc.exists ? animeDoc.data().lastUpdated : null,
      animeCount: animeDoc.exists ? (animeDoc.data().animeList?.length || 0) : 0,
      level: userData.level || 1,
      totalXP: userData.totalXP || 0,
      streak: userData.streak || 0,
      lastActive: userData.lastActive || null
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;