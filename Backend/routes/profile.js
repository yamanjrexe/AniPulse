const express = require('express');
const rateLimit = require('express-rate-limit');
const { db, COLLECTIONS, auth } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { getLevelFromXP, getTitleForLevel, LEVEL_THRESHOLDS, getXPToNextLevel, getXPProgress } = require('../utils/levelSystem');

const router = express.Router();

const profileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: 'Too many requests, please try again later.' }
});

const RESERVED_WORDS = ['admin', 'api', 'u', 'settings', 'moderation', 'null', 'undefined', 'support', 'help', 'about'];

const resolveVisibility = (blockValue, viewerCtx) => {
    if (viewerCtx.isOwner) return true;
    const val = blockValue || 'public';
    if (val === 'public') return true;
    if (val === 'followers' && viewerCtx.isFollower) return true;
    return false;
};

router.get('/:username', profileLimiter, async (req, res, next) => {
    try {
        const { username } = req.params;
        const usernameLower = username.toLowerCase();
        const isPreview = req.query.preview === 'true';

        let viewerUid = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = await auth.verifyIdToken(token);
                viewerUid = decoded.uid;
            } catch (e) { }
        }

        const userSnap = await db.collection(COLLECTIONS.USERS).where('usernameLower', '==', usernameLower).limit(1).get();
        if (userSnap.empty) throw new AppError('Profile not found', 404);

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();
        const targetUid = userDoc.id;

        const isRealOwner = viewerUid === targetUid;
        const isOwner = isRealOwner && !isPreview;
        const isFollower = viewerUid && !isRealOwner && (userData.followers || []).includes(viewerUid);
        const viewerCtx = { isOwner, isFollower };

        const visibility = userData.profileVisibility || {};
        const hiddenAnime = userData.hiddenAnimeIds || [];

        const needsAnime = resolveVisibility(visibility.stats, viewerCtx) || resolveVisibility(visibility.top8, viewerCtx) || resolveVisibility(visibility.currentlyWatching, viewerCtx) || resolveVisibility(visibility.completedList, viewerCtx);

        const [profileDoc, animeSnap, achSnap, discSnap] = await Promise.all([
            db.collection(COLLECTIONS.USER_PROFILES).doc(targetUid).get(),
            needsAnime ? db.collection(COLLECTIONS.ANIME_LISTS).doc(targetUid).get() : Promise.resolve(null),
            db.collection(COLLECTIONS.ACHIEVEMENTS).doc(targetUid).get(),
            db.collection('discussions').where('authorId', '==', targetUid).limit(5).get()
        ]);

        const profileData = profileDoc.exists ? profileDoc.data() : {};
        let animeList = [];
        if (animeSnap && animeSnap.exists) {
            animeList = (animeSnap.data().animeList || []).filter(a => !hiddenAnime.includes(String(a.id)));
        }

        const unlockedAchievements = achSnap.exists ? achSnap.data().unlocked || [] : [];

        let recentDiscussions = [];
        if (discSnap) {
            recentDiscussions = discSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 3);
        }

        const xp = userData.totalXP || 0;
        const level = getLevelFromXP(xp);
        const nextLevelXP = LEVEL_THRESHOLDS[level + 1] || xp;

        const response = {
            uid: targetUid,
            username: userData.publicUsername || userData.username || 'user',
            usernameLower: userData.usernameLower || '',
            name: userData.name || userData.username,
            avatar: userData.avatar,
            banner: userData.banner,
            bio: userData.bio || profileData.bio || '',
            isOwner,
            isRealOwner,
            isFollower,
            socialLinks: userData.socialLinks || profileData.social || {},
            levelData: {
                level,
                title: getTitleForLevel(level),
                totalXP: xp,
                nextLevelXP,
                progress: getXPProgress(level, xp) || 0,
                xpToNext: getXPToNextLevel(level, xp) || 0,
                nextTitle: getTitleForLevel(level + 1)
            }
        };

        if (resolveVisibility(visibility.joinDate, viewerCtx)) {
            response.createdAt = userData.createdAt;
        }

        if (resolveVisibility(visibility.achievements, viewerCtx)) {
            response.unlockedAchievements = Array.isArray(unlockedAchievements) ? unlockedAchievements : [];
        }

        if (resolveVisibility(visibility.recentDiscussions, viewerCtx)) {
            response.recentDiscussions = recentDiscussions;
        }

        if (resolveVisibility(visibility.stats, viewerCtx)) {
            let totalEps = 0;
            let totalHours = 0;
            const breakdown = { watching: 0, completed: 0, onHold: 0, dropped: 0, planToWatch: 0 };

            (animeList || []).forEach(a => {
                const eps = a.episodes || 0;
                const prog = a.progress || 0;
                const dur = a.duration || 20;

                if (a.userStatus === 'Completed') {
                    breakdown.completed++;
                    totalEps += eps;
                    totalHours += (eps * dur) / 60;
                } else if (a.userStatus === 'Watching') {
                    breakdown.watching++;
                    totalEps += prog;
                    totalHours += (prog * dur) / 60;
                } else if (a.userStatus === 'On-Hold') breakdown.onHold++;
                else if (a.userStatus === 'Dropped') breakdown.dropped++;
                else if (a.userStatus === 'Plan to Watch') breakdown.planToWatch++;
            });

            response.stats = {
                totalAnime: animeList.length,
                episodes: totalEps,
                hours: Math.round(totalHours),
                daysWatched: (totalHours / 24).toFixed(1),
                streak: userData.streak || 0,
                breakdown
            };
        }

        if (resolveVisibility(visibility.top8, viewerCtx)) {
            const favIds = Array.isArray(profileData.favoriteAnime) ? profileData.favoriteAnime : [];
            response.favoriteAnime = favIds.map(id => (animeList || []).find(a => String(a.id) === String(id))).filter(Boolean).slice(0, 10);
        }

        if (resolveVisibility(visibility.currentlyWatching, viewerCtx)) {
            const shuffled = [...(animeList || [])].sort(() => 0.5 - Math.random());
            response.currentlyWatching = shuffled.slice(0, 5);
        }

        if (resolveVisibility(visibility.completedList, viewerCtx)) {
            response.recentCompletions = (animeList || [])
                .filter(a => a.userStatus === 'Completed')
                .sort((a, b) => {
                    const timeA = new Date(a.updatedAt || a.actualFinishDate || 0).getTime();
                    const timeB = new Date(b.updatedAt || b.actualFinishDate || 0).getTime();
                    return timeB - timeA;
                })
                .slice(0, 3)
                .map(a => ({
                    ...a,
                    completedAt: a.updatedAt || a.actualFinishDate || new Date().toISOString()
                }));
        }

        res.json(response);
    } catch (err) {
        next(err);
    }
});

router.get('/:username/og', async (req, res, next) => {
    try {
        const usernameLower = req.params.username.toLowerCase();
        const userSnap = await db.collection(COLLECTIONS.USERS).where('usernameLower', '==', usernameLower).limit(1).get();

        if (userSnap.empty) return res.status(404).send('Not found');
        const userData = userSnap.docs[0].data();

        const baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://ani-pulse.netlify.app'
            : 'http://localhost:3001';

        const robots = userData.allowSearchIndexing ? 'index, follow' : 'noindex, nofollow';
        const title = `${userData.name || userData.username} - AniPulse`;
        const desc = userData.bio || `Check out ${userData.username}'s anime profile on AniPulse!`;
        const image = userData.banner || userData.avatar || 'https://ani-pulse.netlify.app/icon/Anipulse.png';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <meta name="description" content="${desc}">
                <meta name="robots" content="${robots}">
                <link rel="canonical" href="${baseUrl}/u/${userData.usernameLower}/profile">
                
                <meta property="og:title" content="${title}">
                <meta property="og:description" content="${desc}">
                <meta property="og:image" content="${image}">
                <meta property="og:url" content="${baseUrl}/u/${userData.usernameLower}/profile">
                <meta property="og:type" content="profile">

                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="${title}">
                <meta name="twitter:description" content="${desc}">
                <meta name="twitter:image" content="${image}">
            </head>
            <body>
                <h1>${title}</h1>
                <script>window.location.href = "${baseUrl}/u/${userData.usernameLower}/profile";</script>
            </body>
            </html>
        `;

        res.set('Cache-Control', 'public, max-age=600');
        res.send(html);
    } catch (err) {
        next(err);
    }
});

router.post('/claim-username', verifyToken, async (req, res, next) => {
    try {
        const { username } = req.body;
        if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
            throw new AppError('Username must be 3-20 characters, lowercase alphanumeric or underscores.', 400);
        }
        if (RESERVED_WORDS.includes(username)) {
            throw new AppError('This username is reserved.', 400);
        }

        const usernameRef = db.collection('usernames').doc(username);
        const userRef = db.collection(COLLECTIONS.USERS).doc(req.userId);
        const profileRef = db.collection(COLLECTIONS.USER_PROFILES).doc(req.userId);

        // Check if the username is already taken BEFORE running the transaction
        const existingUsername = await usernameRef.get();
        if (existingUsername.exists && existingUsername.data().uid !== req.userId) {
            return res.status(400).json({ error: 'Sorry, this username is already taken.' });
        }

        try {
            await db.runTransaction(async (t) => {
                t.set(usernameRef, { uid: req.userId, createdAt: new Date().toISOString() });
                t.set(userRef, {
                    publicUsername: username,
                    usernameLower: username,
                }, { merge: true });
                t.set(profileRef, {
                    publicUsername: username,
                    usernameLower: username,
                }, { merge: true });
            });
        } catch (e) {
            console.error("Transaction failed:", e);
            return res.status(500).json({ error: "Failed to claim username due to a server error. Please try again." });
        }

        res.json({ success: true, username });
    } catch (err) {
        next(err);
    }
});

router.post('/:uid/report', verifyToken, async (req, res, next) => {
    try {
        const { reason, details } = req.body;
        await db.collection('reports').add({
            reporterId: req.userId,
            targetUid: req.params.uid,
            targetType: 'profile',
            reason,
            details,
            status: 'open',
            createdAt: new Date().toISOString()
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;