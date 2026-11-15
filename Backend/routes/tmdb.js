const express = require("express");
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const BACKEND_CACHE_VERSION = "v9";
const posterCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const ERROR_TTL = 1000 * 10;

function normalize(s) {
    return (s || "").toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}

function titleScore(a, b) {
    const A = normalize(a);
    const B = normalize(b);
    if (!A || !B) return 0;
    if (A === B) return 2.0;

    const aWords = A.split(" ").filter(Boolean);
    const bWords = B.split(" ").filter(Boolean);

    const setA = new Set(aWords);
    const setB = new Set(bWords);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    const jaccard = intersection.size / union.size;

    if (A.includes(B) && B.length >= 4) return 1.8;
    if (B.includes(A) && A.length >= 4) return 1.8;

    return jaccard * 1.5;
}

async function fetchJson(url, retries = 3) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (r.status === 429 && retries > 0) {
            const retryAfter = parseInt(r.headers.get('retry-after') || '2', 10);
            console.warn(`[TMDB] Rate limited. Retrying in ${retryAfter}s...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            return fetchJson(url, retries - 1);
        }

        if (!r.ok) return null;
        return r.json();
    } catch (e) {
        clearTimeout(timeout);
        if (retries > 0) {
            await new Promise(res => setTimeout(res, 2000));
            return fetchJson(url, retries - 1);
        }
        return null;
    }
}

function getSearchVariants(title) {
    const variants = new Set();
    if (!title) return variants;

    const t = title.trim();
    variants.add(t);

    const baseTitle = t.split(/[:\-–—]/)[0].trim();
    if (baseTitle.length >= 3) variants.add(baseTitle);

    let cleanTitle = t.replace(/Season\s+\d+/gi, '')
        .replace(/\d+(st|nd|rd|th)\s+Season/gi, '')
        .replace(/Part\s+\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (cleanTitle.length >= 3) variants.add(cleanTitle);

    const baseClean = baseTitle.replace(/Season\s+\d+/gi, '')
        .replace(/\d+(st|nd|rd|th)\s+Season/gi, '')
        .replace(/Part\s+\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (baseClean.length >= 3) variants.add(baseClean);

    return Array.from(variants);
}

async function findBestTmdb(anime) {
    const rawTitles = [
        anime.title_english, anime.title, anime.title_romaji, anime.title_native, ...(anime.synonyms || [])
    ].filter(Boolean);

    const searchQueries = new Set();
    rawTitles.forEach(t => {
        getSearchVariants(t).forEach(v => searchQueries.add(v));
    });

    let bestMatch = null;
    const year = anime.year || anime.seasonYear;

    for (const query of searchQueries) {
        const tvYearParam = year ? `&first_air_date_year=${year}` : "";
        const movieYearParam = year ? `&primary_release_year=${year}` : "";

        let tvData = await fetchJson(`${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}${tvYearParam}`);
        let movieData = await fetchJson(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}${movieYearParam}`);

        if (!tvData?.results?.length && !movieData?.results?.length && year) {
            tvData = await fetchJson(`${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
            movieData = await fetchJson(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
        }

        const results = [];
        if (tvData?.results) results.push(...tvData.results.map((r) => ({ ...r, media_type: "tv" })));
        if (movieData?.results) results.push(...movieData.results.map((r) => ({ ...r, media_type: "movie" })));

        if (!results.length) continue;

        const validCandidates = results.filter(r => {
            const isAnimation = r.genre_ids ? r.genre_ids.includes(16) : true;
            const lang = r.original_language;
            const isAsian = ["ja", "zh", "ko", "cn", "tw"].includes(lang) ||
                (r.origin_country && r.origin_country.some(c => ["JP", "CN", "KR", "TW"].includes(c)));
            return isAnimation && isAsian;
        });

        for (let i = 0; i < Math.min(validCandidates.length, 5); i++) {
            const r = validCandidates[i];
            let score = 0;

            let maxTitleScore = 0;
            const cands = [r.name || r.title, r.original_name || r.original_title].filter(Boolean);
            for (const ct of cands) {
                for (const ut of rawTitles) {
                    const s = titleScore(ct, ut);
                    if (s > maxTitleScore) maxTitleScore = s;
                }
            }

            if (maxTitleScore < 0.8) continue;

            score += maxTitleScore;

            const relDate = r.first_air_date || r.release_date;
            const tmdbYear = relDate ? parseInt(String(relDate).substring(0, 4)) : null;

            if (year && tmdbYear && Math.abs(year - tmdbYear) <= 1) {
                score += 0.8;
            }

            const isAnimeMovie = anime.type === "Movie" || anime.type === "MOVIE";
            if (isAnimeMovie && r.media_type === "movie") score += 0.5;
            if (!isAnimeMovie && r.media_type === "tv") score += 0.5;

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { tmdb: r, score: score };
            }
        }

        if (bestMatch && bestMatch.score >= 2.0) break;
    }

    return bestMatch && bestMatch.score >= 1.0 ? bestMatch : null;
}

async function getBestPoster(tmdbId, mediaType) {
    const endpoint = mediaType === "movie" ? "movie" : "tv";
    const data = await fetchJson(`${TMDB_BASE}/${endpoint}/${tmdbId}/images?api_key=${TMDB_API_KEY}`);

    if (data?.posters?.length) {
        const english = data.posters.filter((p) => p.iso_639_1 === "en");
        const neutral = data.posters.filter((p) => !p.iso_639_1);
        const all = data.posters;
        const pick = (arr) => arr.slice().sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0];
        const chosen = (english.length && pick(english)) || (neutral.length && pick(neutral)) || (all.length && pick(all));
        if (chosen?.file_path) return `${IMG_BASE}${chosen.file_path}`;
    }
    return null;
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let i = 0;
    async function worker() {
        while (i < items.length) {
            const idx = i++;
            out[idx] = await fn(items[idx], idx);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return out;
}

async function lookupOne(anime) {
    const cacheKey = `${BACKEND_CACHE_VERSION}:anilist:${anime.anilistId || anime.title}`;
    const cached = posterCache.get(cacheKey);

    if (cached) {
        const ttl = cached.poster ? CACHE_TTL : ERROR_TTL;
        if (Date.now() - cached.ts < ttl) {
            return { anilistId: anime.anilistId, poster: cached.poster, tmdbId: cached.tmdbId, cached: true };
        }
    }

    const match = await findBestTmdb(anime);
    if (!match) {
        posterCache.set(cacheKey, { poster: null, tmdbId: null, ts: Date.now() });
        return { anilistId: anime.anilistId, poster: null, tmdbId: null };
    }

    const poster = await getBestPoster(match.tmdb.id, match.tmdb.media_type);
    posterCache.set(cacheKey, { poster, tmdbId: match.tmdb.id, ts: Date.now() });
    return { anilistId: anime.anilistId, poster, tmdbId: match.tmdb.id };
}

router.post("/poster", verifyToken, async (req, res) => {
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY not configured" });
    try {
        const result = await lookupOne(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "TMDB lookup failed" });
    }
});

router.post("/posters/batch", verifyToken, async (req, res) => {
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY not configured" });
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items)) return res.status(400).json({ error: "items array required" });

        const results = await mapLimit(items, 5, async (item) => {
            try { return await lookupOne(item); } catch { return { anilistId: item.anilistId, poster: null }; }
        });

        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: "TMDB batch lookup failed" });
    }
});

module.exports = router;