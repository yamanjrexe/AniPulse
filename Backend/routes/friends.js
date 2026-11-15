const express = require('express');
const { db, COLLECTIONS, admin } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('./user');

const router = express.Router();

router.post('/request/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const fromUserId = req.userId;
  if (fromUserId === userId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }
  try {
    let senderDoc = await db.collection(COLLECTIONS.USERS).doc(fromUserId).get();
    if (!senderDoc.exists) senderDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(fromUserId).get();
    const senderData = senderDoc.data() || {};
    const senderName = senderData.name || senderData.username || 'Someone';

    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(fromUserId).get();
    const friends = friendsDoc.data()?.friends || [];
    if (friends.includes(userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    const existingRequest = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('from', '==', fromUserId)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();
    if (!existingRequest.empty) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    const request = {
      from: fromUserId,
      to: userId,
      fromName: senderName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const requestRef = await db.collection(COLLECTIONS.FRIEND_REQUESTS).add(request);
    await createNotification(
      userId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      { fromUserId, fromName: senderName, requestId: requestRef.id }
    );
    res.json({ success: true, message: 'Friend request sent', requestId: requestRef.id });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/accept/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;

  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data();
    if (request.to !== userId) return res.status(403).json({ error: 'Unauthorized' });

    let acceptorDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!acceptorDoc.exists) acceptorDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    const acceptorData = acceptorDoc.data() || {};
    const acceptorName = acceptorData.name || acceptorData.username || 'Someone';

    await db.runTransaction(async (transaction) => {
      const fromRef = db.collection(COLLECTIONS.FRIENDS).doc(request.from);
      const toRef = db.collection(COLLECTIONS.FRIENDS).doc(request.to);
      transaction.update(fromRef, { friends: admin.firestore.FieldValue.arrayUnion(request.to) });
      transaction.update(toRef, { friends: admin.firestore.FieldValue.arrayUnion(request.from) });
      transaction.delete(requestDoc.ref);
    });

    await createNotification(
      request.from,
      'friend_accepted',
      'Friend Request Accepted',
      `${acceptorName} accepted your friend request`,
      { userId, userName: acceptorName }
    );

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/decline/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;
  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data();
    if (request.to !== userId) return res.status(403).json({ error: 'Unauthorized' });
    await requestDoc.ref.delete();
    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/list', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(userId).get();
    const friendIds = friendsDoc.data()?.friends || [];

    if (friendIds.length === 0) {
      res.set('Cache-Control', 'private, max-age=30');
      return res.json([]);
    }

    const refs = friendIds.map((id) => db.collection(COLLECTIONS.USERS).doc(id));
    const snaps = await db.getAll(...refs);

    const friends = snaps
      .filter((s) => s.exists)
      .map((s) => {
        const u = s.data();
        const displayName = u.name || u.username || 'User';
        return {
          uid: s.id,
          name: displayName,
          username: displayName,
          title: u.title || 'Rookie',
          level: u.level || 1,
          totalXP: u.totalXP || 0,
          totalAnime: u.totalAnime || 0,
          totalHours: u.totalHours || 0,
          avatar:
            u.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`,
        };
      });

    res.set('Cache-Control', 'private, max-age=30');
    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/requests', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const snapshot = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (snapshot.empty) {
      res.set('Cache-Control', 'private, max-age=15');
      return res.json([]);
    }

    const refs = snapshot.docs.map((doc) =>
      db.collection(COLLECTIONS.USERS).doc(doc.data().from),
    );
    const userSnaps = await db.getAll(...refs);
    const userMap = {};
    userSnaps.forEach((s) => {
      if (s.exists) userMap[s.id] = s.data();
    });

    const requests = [];
    for (const doc of snapshot.docs) {
      const request = doc.data();
      const userData = userMap[request.from];
      if (userData) {
        const displayName = userData.name || userData.username || 'User';
        requests.push({
          id: doc.id,
          from: request.from,
          fromName: request.fromName || displayName,
          fromUsername: displayName,
          fromAvatar:
            userData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`,
          fromLevel: userData.level || 1,
          createdAt: request.createdAt,
        });
      }
    }

    res.set('Cache-Control', 'private, max-age=15');
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/remove/:friendId', verifyToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.userId;
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection(COLLECTIONS.FRIENDS).doc(userId);
      const friendRef = db.collection(COLLECTIONS.FRIENDS).doc(friendId);
      transaction.update(userRef, { friends: admin.firestore.FieldValue.arrayRemove(friendId) });
      transaction.update(friendRef, { friends: admin.firestore.FieldValue.arrayRemove(userId) });
    });
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;