const express = require('express');
const { db, COLLECTIONS, admin } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, imageUrl, stats } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

        let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(req.userId).get();
        if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
        const userData = userDoc.data() || {};

        const thread = {
            title: title.slice(0, 150),
            content: content.slice(0, 5000),
            imageUrl: imageUrl || null,
            stats: stats || null,
            authorId: req.userId,
            authorName: userData.name || userData.username || 'User',
            authorAvatar: userData.avatar || `https://ui-avatars.com/api/?name=User&background=6366F1&color=fff`,
            createdAt: new Date().toISOString(),
            replyCount: 0
        };

        const ref = await db.collection('discussions').add(thread);
        res.json({ success: true, id: ref.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:threadId/reply', verifyToken, async (req, res) => {
    try {
        const { content, imageUrl } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(req.userId).get();
        if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
        const userData = userDoc.data() || {};

        const reply = {
            content: content.slice(0, 2000),
            imageUrl: imageUrl || null,
            authorId: req.userId,
            authorName: userData.name || userData.username || 'User',
            authorAvatar: userData.avatar || `https://ui-avatars.com/api/?name=User&background=6366F1&color=fff`,
            createdAt: new Date().toISOString()
        };

        const threadRef = db.collection('discussions').doc(req.params.threadId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(threadRef);
            if (!doc.exists) throw new Error('Thread not found');

            const replyRef = threadRef.collection('replies').doc();
            t.set(replyRef, reply);
            t.update(threadRef, { replyCount: admin.firestore.FieldValue.increment(1) });
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:threadId', verifyToken, async (req, res) => {
    try {
        const threadRef = db.collection('discussions').doc(req.params.threadId);
        const doc = await threadRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Thread not found' });
        if (doc.data().authorId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

        const repliesSnapshot = await threadRef.collection('replies').get();
        const batch = db.batch();

        repliesSnapshot.forEach((reply) => {
            batch.delete(reply.ref);
        });
        batch.delete(threadRef);

        await batch.commit();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:threadId/replies/:replyId', verifyToken, async (req, res) => {
    try {
        const threadRef = db.collection('discussions').doc(req.params.threadId);
        const replyRef = threadRef.collection('replies').doc(req.params.replyId);

        const [threadDoc, replyDoc] = await Promise.all([threadRef.get(), replyRef.get()]);

        if (!threadDoc.exists || !replyDoc.exists) {
            return res.status(404).json({ error: 'Not found' });
        }

        const isThreadAuthor = threadDoc.data().authorId === req.userId;
        const isReplyAuthor = replyDoc.data().authorId === req.userId;

        if (!isThreadAuthor && !isReplyAuthor) {
            return res.status(403).json({ error: 'Unauthorized to delete this reply' });
        }

        await db.runTransaction(async (t) => {
            t.delete(replyRef);
            t.update(threadRef, { replyCount: admin.firestore.FieldValue.increment(-1) });
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;