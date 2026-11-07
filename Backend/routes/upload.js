const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

const MAX_AVATAR_SIZE_BYTES = 200 * 1024;

router.post('/avatar', verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'No avatar data provided' });
    }
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid avatar format. Must be a base64 image data URL.' });
    }
    const sizeInBytes = Buffer.byteLength(avatar, 'utf8');
    const sizeInKB = Math.round(sizeInBytes / 1024);

    if (sizeInBytes > MAX_AVATAR_SIZE_BYTES) {
      return res.status(400).json({
        error: `Avatar too large: ${sizeInKB}KB. Max ${MAX_AVATAR_SIZE_BYTES / 1024}KB. Please compress further.`
      });
    }

    const userId = req.userId;
    await db.collection(COLLECTIONS.USERS).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });

    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, avatarUrl: avatar, size: sizeInKB, message: 'Avatar saved successfully' });
  } catch (error) {
    console.error('Avatar save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    }
    const userData = userDoc.data();
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366F1&color=fff&bold=true&length=2&size=200`;
    res.json({ avatarUrl: userData?.avatar || defaultAvatar, hasCustom: !!userData?.avatar });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const username = userDoc.data()?.username || 'User';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&bold=true&length=2&size=200`;

    await db.collection(COLLECTIONS.USERS).doc(userId).update({ avatar: defaultAvatar, avatarUpdated: new Date().toISOString() });
    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({ avatar: defaultAvatar, avatarUpdated: new Date().toISOString() }, { merge: true });

    res.json({ success: true, avatarUrl: defaultAvatar });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/discussion-image', verifyToken, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });
    if (image.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image too large (max 5MB)' });

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ImgBB API key not configured' });

    const formData = new URLSearchParams();
    formData.append('image', image.split(',')[1]);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error('ImgBB upload failed');

    res.json({ url: data.data.url, thumb: data.data.thumb.url });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;