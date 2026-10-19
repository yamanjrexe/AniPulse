﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Save anime list to cloud
router.post('/save', verifyToken, async (req, res) => {
  try {
    const { animeList } = req.body;
    if (!Array.isArray(animeList)) {
      return res.status(400).json({ error: 'animeList must be an array' });
    }

    // Save to Firestore under the user's ID
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).set({
      animeList,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error('Save anime error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Load anime list from cloud
router.get('/load', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).get();
    if (!doc.exists) {
      return res.json({ animeList: [] });
    }
    res.json({ animeList: doc.data().animeList || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save activity log to cloud
router.post('/save-activity', verifyToken, async (req, res) => {
  try {
    const { activities } = req.body;
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).set({
      activities,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load activity log from cloud
router.get('/load-activity', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).get();
    if (!doc.exists) {
      return res.json({ activities: [] });
    }
    res.json({ activities: doc.data().activities || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;