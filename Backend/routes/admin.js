const express = require('express');
const { auth, db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { createNotification } = require('./user');
const router = express.Router();

router.use(verifyToken, requireAdmin);

const logAdminAction = async (adminId, action, targetId, details) => {
    try {
        await db.collection('adminLogs').add({
            adminId,
            action,
            targetId,
            details,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Failed to log admin action:', err);
    }
};

router.get('/stats', async (req, res) => {
    try {
        const [usersSnap, discussionsSnap] = await Promise.all([
            db.collection(COLLECTIONS.USERS).get(),
            db.collection('discussions').count().get(),
        ]);

        let totalUsers = usersSnap.size;
        let bannedUsers = 0;
        let totalAnime = 0;
        let totalHours = 0;

        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.banned) bannedUsers++;
            totalAnime += (data.totalAnime || 0);
            totalHours += (data.totalHours || 0);
        });

        res.json({
            totalUsers,
            bannedUsers,
            totalDiscussions: discussionsSnap.data().count,
            totalAnime,
            totalHours,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const { search, limit = 100 } = req.query;
        let query = db.collection(COLLECTIONS.USERS);
        const snap = await query.limit(parseInt(limit, 10)).get();

        const uids = snap.docs.map(d => d.id);
        const authRecords = {};

        for (let i = 0; i < uids.length; i += 100) {
            const chunk = uids.slice(i, i + 100);
            try {
                const getUsersResult = await auth.getUsers(chunk.map(uid => ({ uid })));
                getUsersResult.users.forEach(u => { authRecords[u.uid] = u; });
            } catch (err) {
                console.warn('Batch auth fetch failed:', err.message);
            }
        }

        const users = snap.docs.map(doc => {
            const data = doc.data();
            const authRecord = authRecords[doc.id];
            const claims = authRecord?.customClaims || {};

            const finalRole = data.role || claims.role || (claims.admin ? 'admin' : 'member');

            return {
                uid: doc.id,
                name: data.name || data.username || 'User',
                email: data.email || '',
                avatar: data.avatar || null,
                level: data.level || 1,
                title: data.title || 'Newbie',
                totalXP: data.totalXP || 0,
                totalAnime: data.totalAnime || 0,
                totalHours: data.totalHours || 0,
                banned: !!data.banned,
                disabled: authRecord?.disabled || false,
                role: finalRole,
                isAdmin: finalRole === 'admin',
                createdAt: data.createdAt || null,
                lastLogin: data.lastLogin || null,
            };
        });

        const filtered = search
            ? users.filter(u =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
            )
            : users;

        res.json({ users: filtered, total: filtered.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { totalXP, level, title, role, adminOverrides } = req.body;

        if (userId === req.userId && role && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }

        const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'User not found' });

        const currentData = doc.data();
        const update = {};
        const logDetails = {};

        if (typeof totalXP === 'number' && totalXP !== currentData.totalXP) {
            update.totalXP = Math.max(0, totalXP);
            logDetails.totalXP = update.totalXP;
        }
        if (typeof level === 'number' && level !== currentData.level) {
            update.level = Math.min(50, Math.max(1, level));
            logDetails.level = update.level;
        }
        if (typeof title === 'string' && title !== currentData.title) {
            update.title = title.slice(0, 30);
            logDetails.title = update.title;
        }
        if (adminOverrides && typeof adminOverrides === 'object') {
            update.adminOverrides = adminOverrides;
        }

        let roleChanged = false;
        if (role) {
            const authRecord = await auth.getUser(userId).catch(() => null);
            const currentClaims = authRecord?.customClaims || {};
            const currentRole = currentData.role || currentClaims.role || (currentClaims.admin ? 'admin' : 'member');

            if (role !== currentRole) {
                await auth.setCustomUserClaims(userId, { role, admin: role === 'admin' });
                await auth.revokeRefreshTokens(userId);
                roleChanged = true;
                update.role = role;
                logDetails.role = role;
            }
        }

        if (Object.keys(update).length > 0) {
            update.adminModifiedAt = new Date().toISOString();
            update.adminModifiedBy = req.userId;
            await userRef.set(update, { merge: true });
            await logAdminAction(req.userId, 'UPDATE_USER', userId, logDetails);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [userDoc, animeDoc] = await Promise.all([
            db.collection(COLLECTIONS.USERS).doc(userId).get(),
            db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get()
        ]);

        const authRecord = await auth.getUser(userId).catch(() => null);
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const data = userDoc.data();
        const animeList = animeDoc.exists ? animeDoc.data().animeList || [] : [];
        const claims = authRecord?.customClaims || {};

        res.json({
            uid: userId,
            ...data,
            animeList,
            role: data.role || claims.role || (claims.admin ? 'admin' : 'member'),
            isAdmin: claims.admin === true || claims.role === 'admin',
            disabled: authRecord?.disabled || false,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/users/:userId/ban', async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === req.userId) return res.status(400).json({ error: 'Cannot ban yourself' });

        await auth.updateUser(userId, { disabled: true });
        await auth.revokeRefreshTokens(userId);

        await db.collection(COLLECTIONS.USERS).doc(userId).set({
            banned: true,
            bannedAt: new Date().toISOString(),
            bannedBy: req.userId,
        }, { merge: true });

        await logAdminAction(req.userId, 'BAN_USER', userId, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/users/:userId/unban', async (req, res) => {
    try {
        const { userId } = req.params;
        await auth.updateUser(userId, { disabled: false });

        await db.collection(COLLECTIONS.USERS).doc(userId).set({
            banned: false,
            unbannedAt: new Date().toISOString(),
            unbannedBy: req.userId,
        }, { merge: true });

        await logAdminAction(req.userId, 'UNBAN_USER', userId, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

        const collections = [
            COLLECTIONS.USERS, COLLECTIONS.USER_PROFILES, COLLECTIONS.ANIME_LISTS,
            COLLECTIONS.ACTIVITY_LOGS, COLLECTIONS.ACHIEVEMENTS, COLLECTIONS.XP_HISTORY,
            COLLECTIONS.CONTRIBUTIONS, COLLECTIONS.SETTINGS, COLLECTIONS.FRIENDS,
            'notifications', 'discussions', 'anilistTokens', 'anilistMappings',
        ];

        await Promise.all(collections.map(c =>
            db.collection(c).doc(userId).delete().catch(() => { })
        ));

        await auth.deleteUser(userId).catch(() => { });
        await logAdminAction(req.userId, 'DELETE_USER', userId, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/users/:userId/notify', async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

        await createNotification(req.params.userId, 'admin_message', title, message, { fromAdmin: true });
        await logAdminAction(req.userId, 'NOTIFY_USER', req.params.userId, { title, message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users/:userId/anime', async (req, res) => {
    try {
        const doc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.params.userId).get();
        if (!doc.exists) return res.json({ animeList: [] });
        res.json({ animeList: doc.data().animeList || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/announce', async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

        const usersSnap = await db.collection(COLLECTIONS.USERS).limit(500).get();
        const promises = [];

        usersSnap.forEach((doc) => {
            promises.push(createNotification(doc.id, 'announcement', title, message, { fromAdmin: true }));
        });

        await Promise.all(promises);
        await logAdminAction(req.userId, 'SEND_ANNOUNCEMENT', 'GLOBAL', { title, message });

        res.json({ success: true, count: usersSnap.size });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const snap = await db.collection('adminLogs').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/logs/:id', async (req, res) => {
    try {
        await db.collection('adminLogs').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/discussions', async (req, res) => {
    try {
        const snap = await db.collection('discussions').orderBy('createdAt', 'desc').limit(100).get();
        const discussions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json({ discussions, total: discussions.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/discussions/:id', async (req, res) => {
    try {
        const threadRef = db.collection('discussions').doc(req.params.id);
        const replies = await threadRef.collection('replies').get();
        const batch = db.batch();
        replies.forEach(r => batch.delete(r.ref));
        batch.delete(threadRef);
        await batch.commit();
        await logAdminAction(req.userId, 'DELETE_DISCUSSION', req.params.id, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;