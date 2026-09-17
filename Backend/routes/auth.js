﻿const express = require('express');
const { auth, db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// ============================================
// REGISTER — accepts Firebase ID token
// ============================================
router.post('/register', async (req, res) => {
  const { token, email, username } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const finalEmail = email || decoded.email;
    const finalUsername = username || decoded.name || finalEmail.split('@')[0];

    const takenSnap = await db.collection(COLLECTIONS.USERS)
      .where('username', '==', finalUsername).limit(1).get();
    if (!takenSnap.empty && takenSnap.docs[0].id !== uid) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const userProfile = {
      uid,
      username: finalUsername,
      name: finalUsername,
      email: finalEmail,
      createdAt: new Date().toISOString(),
      totalXP: 0,
      level: 1,
      title: 'Newbie',
      totalAnime: 0,
      totalHours: 0,
      avatar: decoded.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(finalUsername)}&background=6a5acd&color=fff`
    };

    await db.collection(COLLECTIONS.USERS).doc(uid).set(userProfile, { merge: true });
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(uid)
      .set({ animeList: [], lastUpdated: new Date().toISOString() }, { merge: true });
    await db.collection(COLLECTIONS.FRIENDS).doc(uid)
      .set({ friends: [], lastUpdated: new Date().toISOString() }, { merge: true });

    res.status(201).json({
      success: true,
      user: {
        uid, username: finalUsername, name: finalUsername, email: finalEmail,
        level: 1, title: 'Newbie', avatar: userProfile.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LOGIN — accepts Firebase ID token
// ============================================
router.post('/login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

    if (!userDoc.exists) {
      const newUser = {
        uid,
        username: decoded.name || decoded.email.split('@')[0],
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        avatar: decoded.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || 'User')}&background=6a5acd&color=fff`,
        createdAt: new Date().toISOString(),
        totalXP: 0, level: 1, title: 'Newbie', totalAnime: 0, totalHours: 0
      };
      await db.collection(COLLECTIONS.USERS).doc(uid).set(newUser);
      await db.collection(COLLECTIONS.ANIME_LISTS).doc(uid)
        .set({ animeList: [], lastUpdated: new Date().toISOString() });
      await db.collection(COLLECTIONS.FRIENDS).doc(uid)
        .set({ friends: [], lastUpdated: new Date().toISOString() });

      return res.json({
        success: true,
        user: {
          uid: newUser.uid, username: newUser.name, name: newUser.name,
          email: newUser.email, level: 1, title: 'Newbie',
          avatar: newUser.avatar, totalXP: 0, totalAnime: 0, totalHours: 0
        }
      });
    }

    const userData = userDoc.data();
    await db.collection(COLLECTIONS.USERS).doc(uid)
      .update({ lastLogin: new Date().toISOString() });

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        username: userData.name || userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        avatar: userData.avatar,
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================
// GOOGLE SIGN-IN
// ============================================
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

    if (!userDoc.exists) {
      const newUser = {
        uid,
        username: decoded.name || decoded.email.split('@')[0],
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        avatar: decoded.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || 'User')}&background=6a5acd&color=fff`,
        createdAt: new Date().toISOString(),
        totalXP: 0, level: 1, title: 'Newbie', totalAnime: 0, totalHours: 0
      };
      await db.collection(COLLECTIONS.USERS).doc(uid).set(newUser);
      await db.collection(COLLECTIONS.ANIME_LISTS).doc(uid)
        .set({ animeList: [], lastUpdated: new Date().toISOString() });
      await db.collection(COLLECTIONS.FRIENDS).doc(uid)
        .set({ friends: [], lastUpdated: new Date().toISOString() });
      userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    }

    const userData = userDoc.data();
    await db.collection(COLLECTIONS.USERS).doc(uid)
      .update({ lastLogin: new Date().toISOString() });

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        username: userData.name || userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        avatar: userData.avatar,
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================
// GET PROFILE
// ============================================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(req.userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const u = userDoc.data();
    res.json({
      user: {
        uid: req.userId,
        username: u.name || u.username,
        name: u.name || u.username,
        email: u.email,
        avatar: u.avatar,
        level: u.level || 1,
        title: u.title || 'Newbie',
        totalXP: u.totalXP || 0,
        totalAnime: u.totalAnime || 0,
        totalHours: u.totalHours || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE PROFILE
// ============================================
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, username, bio, status, avatar, cover, favoriteAnime, social } = req.body;
    const update = {};
    if (name) update.name = name;
    if (username) update.username = username;
    if (bio !== undefined) update.bio = bio;
    if (status !== undefined) update.status = status;
    if (avatar !== undefined) update.avatar = avatar;
    if (cover !== undefined) update.cover = cover;
    if (favoriteAnime) update.favoriteAnime = favoriteAnime;
    if (social) update.social = social;
    update.lastUpdated = new Date().toISOString();

    await db.collection(COLLECTIONS.USER_PROFILES).doc(req.userId).set(update, { merge: true });
    await db.collection(COLLECTIONS.USERS).doc(req.userId).set(update, { merge: true });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VERIFY TOKEN
// ============================================
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const u = userDoc.data();
    res.json({
      user: {
        uid: req.userId,
        username: u.name || u.username,
        name: u.name || u.username,
        email: u.email,
        level: u.level || 1,
        title: u.title || 'Newbie',
        avatar: u.avatar,
        totalXP: u.totalXP || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;