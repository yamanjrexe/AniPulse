// src/services/tmdbService.js
import { api } from "./api.js";

const MEMORY_CACHE = new Map();
const INFLIGHT = new Map();
const TTL = 1000 * 60 * 60 * 24 * 7;
const ERROR_TTL = 1000 * 60 * 5;
const CACHE_VERSION = "v11"; // Bumped to v11 for strict matching
const LS_PREFIX = `tmdb_poster_${CACHE_VERSION}:`;
const CHUNK = 10;

function cacheKey(anime) {
    // Use a random identifier if both ID and title are missing to prevent cache collision
    const id = anime?.id || anime?.anilistId || anime?.title || Math.random().toString(36).substring(7);
    return `anilist:${id}`;
}

function readLocal(key) {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const ttl = parsed.poster ? TTL : ERROR_TTL;
        if (Date.now() - parsed.ts > ttl) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeLocal(key, data) {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify({ ...data, ts: Date.now() }));
    } catch { }
}

function payloadFor(anime) {
    return {
        anilistId: anime.id || anime.anilistId,
        title: anime.title,
        title_english: anime.title_english,
        title_romaji: anime.title_romaji,
        title_native: anime.title_native,
        synonyms: anime.synonyms,
        year: anime.year || anime.seasonYear || null,
        seasonYear: anime.seasonYear,
        type: anime.type || anime.format,
    };
}

// --- BATCHING QUEUE ---
let queue = [];
let queueResolvers = [];
let queueTimer = null;

function processQueue() {
    const items = [...queue];
    const resolvers = [...queueResolvers];
    queue = [];
    queueResolvers = [];
    queueTimer = null;

    if (!items.length) return;

    const processChunk = async (chunkItems, chunkResolvers) => {
        try {
            const data = await api.post("/tmdb/posters/batch", {
                items: chunkItems.map(payloadFor),
            });
            const results = data?.results || [];
            const resultMap = {};
            results.forEach(r => resultMap[r.anilistId] = r);

            chunkItems.forEach((item, index) => {
                const r = resultMap[item.id] || { poster: null, tmdbId: null };
                const key = cacheKey(item);
                const entry = { poster: r.poster || null, tmdbId: r.tmdbId || null, ts: Date.now() };
                MEMORY_CACHE.set(key, entry);
                writeLocal(key, entry);
                chunkResolvers[index](entry.poster);
            });
        } catch (err) {
            chunkItems.forEach((item, index) => {
                chunkResolvers[index](null);
            });
        }
    };

    for (let i = 0; i < items.length; i += CHUNK) {
        processChunk(items.slice(i, i + CHUNK), resolvers.slice(i, i + CHUNK));
    }
}

function getPosterBatched(anime) {
    return new Promise((resolve) => {
        queue.push(anime);
        queueResolvers.push(resolve);
        if (!queueTimer) {
            queueTimer = setTimeout(processQueue, 150);
        }
    });
}
// ----------------------

export const tmdbService = {
    async getPoster(anime) {
        if (!anime) return null;
        const key = cacheKey(anime);

        const mem = MEMORY_CACHE.get(key);
        if (mem) {
            const ttl = mem.poster ? TTL : ERROR_TTL;
            if (Date.now() - mem.ts < ttl) return mem.poster;
        }

        const local = readLocal(key);
        if (local) {
            MEMORY_CACHE.set(key, local);
            return local.poster;
        }

        if (INFLIGHT.has(key)) return INFLIGHT.get(key);

        const promise = getPosterBatched(anime).then(poster => {
            INFLIGHT.delete(key);
            return poster;
        });

        INFLIGHT.set(key, promise);
        return promise;
    },

    async getPostersBatch(animes) {
        if (!Array.isArray(animes) || !animes.length) return {};

        const result = {};
        const missing = [];

        for (const a of animes) {
            const key = cacheKey(a);
            const mem = MEMORY_CACHE.get(key);
            if (mem) {
                const ttl = mem.poster ? TTL : ERROR_TTL;
                if (Date.now() - mem.ts < ttl) {
                    result[a.id] = mem.poster;
                    continue;
                }
            }
            const local = readLocal(key);
            if (local) {
                MEMORY_CACHE.set(key, local);
                result[a.id] = local.poster;
                continue;
            }
            missing.push(a);
        }

        if (!missing.length) return result;

        for (let i = 0; i < missing.length; i += CHUNK) {
            const chunk = missing.slice(i, i + CHUNK);
            try {
                const data = await api.post("/tmdb/posters/batch", {
                    items: chunk.map(payloadFor),
                });
                for (const r of data?.results || []) {
                    const key = `anilist:${r.anilistId}`;
                    const entry = { poster: r.poster || null, tmdbId: r.tmdbId || null, ts: Date.now() };
                    MEMORY_CACHE.set(key, entry);
                    writeLocal(key, entry);
                    result[r.anilistId] = r.poster || null;
                }
            } catch (err) {
                console.warn("[tmdbService] Batch fetch failed", err);
            }
            if (i + CHUNK < missing.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        return result;
    },
};