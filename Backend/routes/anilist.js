const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const anilist = require('../services/anilist');

const router = express.Router();

const IS_PROD = process.env.NODE_ENV === 'production';

const CLIENT_ID = IS_PROD
    ? process.env.ANILIST_CLIENT_ID_PROD
    : process.env.ANILIST_CLIENT_ID_DEV;

const CLIENT_SECRET = IS_PROD
    ? process.env.ANILIST_CLIENT_SECRET_PROD
    : process.env.ANILIST_CLIENT_SECRET_DEV;

const REDIRECT_URI = IS_PROD
    ? process.env.ANILIST_REDIRECT_URI_PROD ||
    'https://anipulse-63jv.onrender.com/api/anilist/callback'
    : process.env.ANILIST_REDIRECT_URI_DEV ||
    'http://localhost:5000/api/anilist/callback';

const FRONTEND_URL = IS_PROD
    ? process.env.FRONTEND_URL_PROD || 'https://ani-pulse.netlify.app'
    : process.env.FRONTEND_URL_DEV || 'http://localhost:3000';

console.log(
    `[AniList] mode=${IS_PROD ? 'PROD' : 'DEV'} clientId=${CLIENT_ID} redirect=${REDIRECT_URI}`
);

const TOKENS_COLLECTION = 'anilistTokens';
const MAPPINGS_COLLECTION = 'anilistMappings';
const QUEUE_COLLECTION = 'anilistSyncQueue';
const FAILED_COLLECTION = 'anilistFailedMatches';

const BATCH_SIZE = 15;
const BATCH_DELAY_MS = 800;
const SINGLE_DELAY_MS = 400;

const processing = new Map();

const anilistListCache = new Map();
const ANILIST_LIST_TTL = 5 * 60 * 1000;

function shortId(id) {
    if (!id || typeof id !== 'string') return id;
    return id.slice(0, 8) + '…';
}

async function getAnilistListEntries(accessToken, anilistUserId) {
    const cached = anilistListCache.get(anilistUserId);
    if (cached && Date.now() - cached.timestamp < ANILIST_LIST_TTL) {
        return cached.entries;
    }
    try {
        const entries = await anilist.fetchAllListEntries(
            accessToken,
            anilistUserId
        );
        anilistListCache.set(anilistUserId, {
            entries,
            timestamp: Date.now(),
        });
        console.log(
            `[AniList] Cached ${entries.size} list entries for AniList user ${anilistUserId}`
        );
        return entries;
    } catch (err) {
        console.warn('[AniList] Failed to fetch list cache:', err.message);
        const empty = new Map();
        anilistListCache.set(anilistUserId, {
            entries: empty,
            timestamp: Date.now(),
        });
        return empty;
    }
}

function rememberInCache(anilistUserId, entry) {
    const cache = anilistListCache.get(anilistUserId);
    if (cache && entry && entry.mediaId) {
        cache.entries.set(entry.mediaId, entry);
    }
}

function forgetFromCache(anilistUserId, mediaId) {
    const cache = anilistListCache.get(anilistUserId);
    if (cache) cache.entries.delete(mediaId);
}

async function recordFailedMatch(userId, anime) {
    try {
        await db.collection(FAILED_COLLECTION).doc(userId).set(
            {
                items: {
                    [String(anime.id)]: {
                        animeId: anime.id,
                        title: anime.title,
                        type: anime.type || 'TV',
                        failedAt: new Date().toISOString(),
                    },
                },
            },
            { merge: true }
        );
    } catch (err) {
        console.warn('[AniList] Failed to record no_match:', err.message);
    }
}

async function clearFailedMatchesBulk(userId, animeIds) {
    if (!animeIds || animeIds.length === 0) return;
    try {
        const doc = await db.collection(FAILED_COLLECTION).doc(userId).get();
        if (!doc.exists) return;
        const items = doc.data().items || {};
        let changed = false;
        for (const id of animeIds) {
            if (items[String(id)]) {
                delete items[String(id)];
                changed = true;
            }
        }
        if (!changed) return;
        await db
            .collection(FAILED_COLLECTION)
            .doc(userId)
            .set({ items }, { merge: true });
    } catch (err) {
        console.warn('[AniList] Bulk clear failed:', err.message);
    }
}

async function clearFailedMatch(userId, animeId) {
    return clearFailedMatchesBulk(userId, [animeId]);
}

router.get('/failed', verifyToken, async (req, res) => {
    try {
        const doc = await db
            .collection(FAILED_COLLECTION)
            .doc(req.userId)
            .get();
        const items = doc.exists ? doc.data().items || {} : {};
        const mappings = await getMappings(req.userId);

        const validItems = {};
        const staleIds = [];
        for (const [id, item] of Object.entries(items)) {
            const m = mappings[id];
            if (m && m.mediaId) staleIds.push(id);
            else validItems[id] = item;
        }
        if (staleIds.length > 0) {
            await clearFailedMatchesBulk(req.userId, staleIds);
        }

        const list = Object.values(validItems).sort(
            (a, b) => new Date(b.failedAt || 0) - new Date(a.failedAt || 0)
        );
        res.json({ items: list });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/failed/clear', verifyToken, async (req, res) => {
    try {
        await db.collection(FAILED_COLLECTION).doc(req.userId).delete();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/connect', verifyToken, (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'AniList not configured' });
    }
    const url = anilist.buildAuthUrl(CLIENT_ID, REDIRECT_URI, req.userId);
    res.json({ url });
});

router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const buildRedirect = (params) => {
        const qs = new URLSearchParams(params).toString();
        return `${FRONTEND_URL}/settings?tab=sync&${qs}`;
    };

    if (!code || !state) {
        return res.redirect(buildRedirect({ error: 'missing_params' }));
    }

    try {
        const tokens = await anilist.exchangeCodeForToken(
            code,
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );
        const viewer = await anilist.getViewer(tokens.access_token);

        anilistListCache.delete(viewer.id);

        await db.collection(TOKENS_COLLECTION).doc(state).set({
            accessToken: tokens.access_token,
            tokenType: tokens.token_type,
            anilistUserId: viewer.id,
            anilistUsername: viewer.name,
            scoreFormat: viewer.mediaListOptions?.scoreFormat || 'POINT_10',
            connectedAt: new Date().toISOString(),
        });

        return res.redirect(buildRedirect({ connected: '1' }));
    } catch (err) {
        console.error('[AniList] OAuth callback error:', err);
        return res.redirect(buildRedirect({ error: 'oauth_failed' }));
    }
});

router.get('/status', verifyToken, async (req, res) => {
    try {
        const doc = await db.collection(TOKENS_COLLECTION).doc(req.userId).get();
        if (!doc.exists) return res.json({ connected: false });
        const data = doc.data();
        res.json({
            connected: true,
            anilistUserId: data.anilistUserId,
            anilistUsername: data.anilistUsername,
            connectedAt: data.connectedAt,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/disconnect', verifyToken, async (req, res) => {
    try {
        const doc = await db.collection(TOKENS_COLLECTION).doc(req.userId).get();
        if (doc.exists && doc.data().anilistUserId) {
            anilistListCache.delete(doc.data().anilistUserId);
        }
        await db.collection(TOKENS_COLLECTION).doc(req.userId).delete();
        await db.collection(QUEUE_COLLECTION).doc(req.userId).delete();
        await db.collection(FAILED_COLLECTION).doc(req.userId).delete();
        processing.delete(req.userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function getMappings(userId) {
    const doc = await db.collection(MAPPINGS_COLLECTION).doc(userId).get();
    return doc.exists ? doc.data().mappings || {} : {};
}

async function setMapping(userId, animeId, value) {
    await db.collection(MAPPINGS_COLLECTION).doc(userId).set(
        { mappings: { [String(animeId)]: value } },
        { merge: true }
    );
}

async function setMappingsBulk(userId, map) {
    if (!map || Object.keys(map).length === 0) return;
    await db.collection(MAPPINGS_COLLECTION).doc(userId).set(
        { mappings: map },
        { merge: true }
    );
}

async function deleteMapping(userId, animeId) {
    const doc = await db.collection(MAPPINGS_COLLECTION).doc(userId).get();
    if (!doc.exists) return;
    const mappings = doc.data().mappings || {};
    delete mappings[String(animeId)];
    await db.collection(MAPPINGS_COLLECTION).doc(userId).set(
        { mappings },
        { merge: true }
    );
}

async function enqueue(userId, jobs) {
    const ref = db.collection(QUEUE_COLLECTION).doc(userId);
    const doc = await ref.get();
    const existing = doc.exists ? doc.data().jobs || [] : [];

    const merged = [...existing];
    const seen = new Map();
    existing.forEach((j, i) => seen.set(`${j.animeId}:${j.action}`, i));

    for (const job of jobs) {
        const key = `${job.animeId}:${job.action}`;
        if (seen.has(key)) merged[seen.get(key)] = job;
        else merged.push(job);
    }

    await ref.set(
        {
            jobs: merged,
            total: merged.length,
            updatedAt: new Date().toISOString(),
        },
        { merge: true }
    );

    console.log(
        `[AniList] Queued ${jobs.length} job(s) for ${shortId(userId)} — queue now ${merged.length}`
    );
    kickWorker(userId);
}

router.get('/queue', verifyToken, async (req, res) => {
    try {
        const doc = await db.collection(QUEUE_COLLECTION).doc(req.userId).get();
        const data = doc.exists ? doc.data() : {};
        res.json({
            jobs: (data.jobs || []).length,
            total: data.total || 0,
            processing: processing.get(req.userId) || null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sync', verifyToken, async (req, res) => {
    try {
        const { anime, action } = req.body;
        if (!anime || !anime.id) {
            return res.status(400).json({ error: 'Missing anime data' });
        }

        const tokenDoc = await db
            .collection(TOKENS_COLLECTION)
            .doc(req.userId)
            .get();
        if (!tokenDoc.exists) {
            return res.json({ queued: false, reason: 'not_connected' });
        }

        await enqueue(req.userId, [
            {
                animeId: String(anime.id),
                action: action || 'upsert',
                anime,
                queuedAt: Date.now(),
                bulk: false,
            },
        ]);

        res.json({ queued: true });
    } catch (err) {
        console.error('[AniList] sync error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/sync-all', verifyToken, async (req, res) => {
    try {
        const { animeList, force } = req.body;
        if (!Array.isArray(animeList)) {
            return res.status(400).json({ error: 'Missing animeList' });
        }

        const tokenDoc = await db
            .collection(TOKENS_COLLECTION)
            .doc(req.userId)
            .get();
        if (!tokenDoc.exists) {
            return res.json({ queued: false, reason: 'not_connected' });
        }

        const { accessToken, anilistUserId } = tokenDoc.data();
        console.log(
            `[AniList] /sync-all user=${shortId(req.userId)} total=${animeList.length} force=${!!force}`
        );

        if (force) {
            await db.collection(MAPPINGS_COLLECTION).doc(req.userId).delete();
        }

        const listEntries = force
            ? new Map()
            : await getAnilistListEntries(accessToken, anilistUserId);
        const mappings = force ? {} : await getMappings(req.userId);

        const jobs = [];
        let skipped = 0;

        for (const anime of animeList) {
            if (!force) {
                const mapping = mappings[String(anime.id)];
                if (
                    mapping &&
                    mapping.mediaId &&
                    listEntries.has(mapping.mediaId)
                ) {
                    skipped++;
                    continue;
                }
            }
            jobs.push({
                animeId: String(anime.id),
                action: 'upsert',
                anime,
                queuedAt: Date.now(),
                bulk: true,
            });
        }

        console.log(
            `[AniList] /sync-all pre-filter: ${jobs.length} to sync, ${skipped} skipped`
        );

        if (jobs.length === 0) {
            return res.json({
                queued: true,
                count: 0,
                skipped,
                message: 'All anime already on AniList',
            });
        }

        await enqueue(req.userId, jobs);
        res.json({ queued: true, count: jobs.length, skipped });
    } catch (err) {
        console.error('[AniList] /sync-all error:', err);
        res.status(500).json({ error: err.message });
    }
});

function buildListEntry(anime, mapping) {
    const status = anime.userStatus || 'Plan to Watch';
    const anilistEpisodes = mapping.anilistEpisodes;

    const userProgress = Math.max(0, parseInt(anime.progress, 10) || 0);
    let progress =
        anilistEpisodes && anilistEpisodes > 0
            ? Math.min(userProgress, anilistEpisodes)
            : userProgress;

    if (status === 'Watching' && progress < 1) {
        progress = 1;
    }

    let completedAt = null;
    let startedAt = null;

    if (status !== 'Plan to Watch') {
        startedAt = anilist.buildDate(anime.createdAt);
    }

    if (status === 'Completed') {
        completedAt =
            anilist.buildDate(anime.actualFinishDate) ||
            anilist.buildDate(anime.finishDate);

        if (startedAt && completedAt) {
            const sVal =
                startedAt.year * 10000 +
                (startedAt.month || 0) * 100 +
                (startedAt.day || 0);
            const cVal =
                completedAt.year * 10000 +
                (completedAt.month || 0) * 100 +
                (completedAt.day || 0);
            if (sVal >= cVal) startedAt = null;
        }
    }

    return {
        mediaId: mapping.mediaId,
        status,
        score: anime.score,
        progress,
        startedAt,
        completedAt,
    };
}

function mappingNeedsResearch(mapping, desiredFormat) {
    if (!mapping || !mapping.mediaId) return true;
    if (!mapping.matchedFormat) return true;
    if (mapping.matchedFormat !== desiredFormat) return true;
    return false;
}

async function processSingleJob(userId, job, accessToken, anilistUserId) {
    const { anime, action } = job;

    if (action === 'delete') {
        const mappings = await getMappings(userId);
        const map = mappings[String(anime.id)];
        if (map && map.mediaId) {
            const entry = await anilist.findListEntry(accessToken, map.mediaId);
            if (entry && entry.id) {
                await anilist.deleteListEntry(accessToken, entry.id);
                forgetFromCache(anilistUserId, map.mediaId);
            }
        }
        await deleteMapping(userId, anime.id);
        await clearFailedMatch(userId, anime.id);
        return { deleted: true };
    }

    const desiredFormat = anilist.FORMAT_MAP[anime.type] || 'TV';

    const mappings = await getMappings(userId);
    let mapping = mappings[String(anime.id)];

    if (mappingNeedsResearch(mapping, desiredFormat)) {
        if (mapping) {
            console.log(
                `[AniList] Re-search: existing mapping format=${mapping.matchedFormat || 'unknown'} needs ${desiredFormat}`
            );
        }
        mapping = null;
    }

    if (!mapping) {
        const results = await anilist.searchAnime(
            anime.title,
            desiredFormat
        );
        const best = anilist.pickBestMatch(results, anime);
        if (!best) {
            console.warn(
                `[AniList] No match for "${anime.title}" — ${results.length} candidates`
            );
            await recordFailedMatch(userId, anime);
            return { error: 'no_match', title: anime.title };
        }

        mapping = {
            mediaId: best.id,
            matchedTitle:
                best.title?.english ||
                best.title?.romaji ||
                best.title?.native,
            matchedFormat: best.format,
            anilistEpisodes: best.episodes || null,
        };
        await setMapping(userId, anime.id, mapping);
    }

    const listEntry = buildListEntry(anime, mapping);
    const saved = await anilist.saveListEntry(accessToken, listEntry);

    if (anilistUserId && saved) {
        rememberInCache(anilistUserId, saved);
    }

    await clearFailedMatch(userId, anime.id);
    return { ok: true, mediaId: mapping.mediaId };
}

async function processBulkBatch(userId, jobs, accessToken, anilistUserId) {
    const mappings = await getMappings(userId);
    const listEntries = await getAnilistListEntries(
        accessToken,
        anilistUserId
    );

    const needSearch = [];
    const readyToSave = [];
    const matchedAnimeIds = [];
    let apiCalls = 0;

    for (const job of jobs) {
        const mapping = mappings[String(job.anime.id)];
        const desiredFormat = anilist.FORMAT_MAP[job.anime.type] || 'TV';

        if (mappingNeedsResearch(mapping, desiredFormat)) {
            needSearch.push(job);
            continue;
        }

        matchedAnimeIds.push(job.anime.id);

        if (listEntries.has(mapping.mediaId)) {
            continue;
        }
        readyToSave.push({ job, mapping });
    }

    if (needSearch.length > 0) {
        try {
            const results = await anilist.batchSearchAnime(
                needSearch.map((j) => {
                    const desiredFormat =
                        anilist.FORMAT_MAP[j.anime.type] || 'TV';
                    return {
                        key: String(j.anime.id),
                        title: j.anime.title,
                        format: desiredFormat,
                    };
                })
            );
            apiCalls++;

            const newMappings = {};
            const emptyOnFirstPass = [];

            for (const job of needSearch) {
                const candidates = results[String(job.anime.id)] || [];
                if (candidates.length === 0) {
                    emptyOnFirstPass.push(job);
                    continue;
                }

                const best = anilist.pickBestMatch(candidates, job.anime);
                if (!best) {
                    emptyOnFirstPass.push(job);
                    continue;
                }

                const mapping = {
                    mediaId: best.id,
                    matchedTitle:
                        best.title?.english ||
                        best.title?.romaji ||
                        best.title?.native,
                    matchedFormat: best.format,
                    anilistEpisodes: best.episodes || null,
                };
                newMappings[String(job.anime.id)] = mapping;
                matchedAnimeIds.push(job.anime.id);

                if (!listEntries.has(mapping.mediaId)) {
                    readyToSave.push({ job, mapping });
                }
            }

            await setMappingsBulk(userId, newMappings);

            if (emptyOnFirstPass.length > 0) {
                console.log(
                    `[AniList] Retrying ${emptyOnFirstPass.length} titles individually`
                );
                const retryMappings = {};
                for (const job of emptyOnFirstPass) {
                    try {
                        await new Promise((r) => setTimeout(r, 350));
                        const desiredFormat =
                            anilist.FORMAT_MAP[job.anime.type] || 'TV';
                        const retryResults = await anilist.searchAnime(
                            job.anime.title,
                            desiredFormat
                        );
                        apiCalls++;
                        const best = anilist.pickBestMatch(
                            retryResults,
                            job.anime
                        );
                        if (!best) {
                            await recordFailedMatch(userId, job.anime);
                            continue;
                        }
                        const mapping = {
                            mediaId: best.id,
                            matchedTitle:
                                best.title?.english ||
                                best.title?.romaji ||
                                best.title?.native,
                            matchedFormat: best.format,
                            anilistEpisodes: best.episodes || null,
                        };
                        retryMappings[String(job.anime.id)] = mapping;
                        matchedAnimeIds.push(job.anime.id);
                        if (!listEntries.has(mapping.mediaId)) {
                            readyToSave.push({ job, mapping });
                        }
                    } catch (err) {
                        console.warn(
                            `[AniList] Retry failed for "${job.anime.title}":`,
                            err.message
                        );
                    }
                }
                await setMappingsBulk(userId, retryMappings);
            }
        } catch (err) {
            console.error('[AniList] Batch search failed:', err.message);
        }
    }

    if (readyToSave.length > 0) {
        try {
            const entries = readyToSave.map(({ job, mapping }) =>
                buildListEntry(job.anime, mapping)
            );
            const saved = await anilist.batchSaveListEntries(
                accessToken,
                entries
            );
            apiCalls++;
            saved.forEach((s) => {
                if (s && s.mediaId) rememberInCache(anilistUserId, s);
            });
        } catch (err) {
            console.error('[AniList] Batch save failed:', err.message);
        }
    }

    if (matchedAnimeIds.length > 0) {
        await clearFailedMatchesBulk(userId, matchedAnimeIds);
    }

    return {
        processed: jobs.length,
        saved: readyToSave.length,
        apiCalls,
    };
}

async function kickWorker(userId) {
    if (processing.get(userId)?.running) return;
    processing.set(userId, { running: true, current: 0, total: 0 });

    (async () => {
        try {
            const ref = db.collection(QUEUE_COLLECTION).doc(userId);
            let doc = await ref.get();
            let jobs = doc.exists ? doc.data().jobs || [] : [];

            const tokenDoc = await db
                .collection(TOKENS_COLLECTION)
                .doc(userId)
                .get();
            if (!tokenDoc.exists) {
                processing.delete(userId);
                return;
            }
            const accessToken = tokenDoc.data().accessToken;
            const anilistUserId = tokenDoc.data().anilistUserId;

            const total = jobs.length;
            let done = 0;

            console.log(
                `[AniList] Worker starting ${total} job(s) for ${shortId(userId)}`
            );

            while (jobs.length > 0) {
                const head = jobs[0];

                if (head.bulk) {
                    const batch = [];
                    for (const j of jobs) {
                        if (j.bulk) batch.push(j);
                        if (batch.length >= BATCH_SIZE) break;
                    }

                    const result = await processBulkBatch(
                        userId,
                        batch,
                        accessToken,
                        anilistUserId
                    );

                    const batchKeys = new Set(
                        batch.map((j) => `${j.animeId}:${j.action}`)
                    );
                    jobs = jobs.filter(
                        (j) => !batchKeys.has(`${j.animeId}:${j.action}`)
                    );
                    done += batch.length;

                    processing.set(userId, {
                        running: true,
                        current: done,
                        total,
                    });
                    await ref.set(
                        { jobs, current: done, total },
                        { merge: true }
                    );

                    if (result.apiCalls > 0) {
                        await new Promise((r) =>
                            setTimeout(r, BATCH_DELAY_MS)
                        );
                    }
                } else {
                    try {
                        await processSingleJob(
                            userId,
                            head,
                            accessToken,
                            anilistUserId
                        );
                    } catch (err) {
                        console.error(
                            `[AniList] Single job failed:`,
                            err.message
                        );
                    }
                    jobs = jobs.slice(1);
                    done++;
                    processing.set(userId, {
                        running: true,
                        current: done,
                        total,
                    });
                    await ref.set(
                        { jobs, current: done, total },
                        { merge: true }
                    );
                    await new Promise((r) =>
                        setTimeout(r, SINGLE_DELAY_MS)
                    );
                }
            }

            processing.delete(userId);
            console.log(
                `[AniList] Worker finished for ${shortId(userId)} — ${done}/${total}`
            );
        } catch (err) {
            console.error('[AniList] Worker crashed:', err);
            processing.delete(userId);
        }
    })();
}

async function resumePendingWorkers() {
    try {
        const snapshot = await db.collection(QUEUE_COLLECTION).get();
        snapshot.forEach((doc) => {
            const jobs = doc.data().jobs || [];
            if (jobs.length > 0) {
                console.log(
                    `[AniList] Resuming queue for ${shortId(doc.id)}: ${jobs.length} jobs`
                );
                kickWorker(doc.id);
            }
        });
    } catch (err) {
        console.warn('[AniList] resume failed:', err.message);
    }
}

setTimeout(resumePendingWorkers, 5000);

module.exports = router;