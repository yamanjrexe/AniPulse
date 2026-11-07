const express = require("express");
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const BACKEND_CACHE_VERSION = "v7"; 
const posterCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const ERROR_TTL = 1000 * 60 * 5;

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

    if (A.includes(B) && B.length >= 5) return 1.8;
    if (B.includes(A) && A.length >= 5) return 1.8;

    return jaccard * 1.5;
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!r.ok) return null;
        return r.json();
    } catch (e) {
        clearTimeout(timeout);
        return null;
    }
}

async function findBestTmdb(anime) {
    const titles = [
        anime.title_english, anime.title, anime.title_romaji, anime.title_native
    ].filter(Boolean);

    const uniqueTitles = [...new Set(titles.map((t) => t.trim()).filter(Boolean))];
    if (!uniqueTitles.length) return null;

    let bestMatch = null;
    const year = anime.year || anime.seasonYear;
    const isAnimeMovie = anime.type === "Movie" || anime.type === "MOVIE";

    for (const t of uniqueTitles) {
        let results = [];

        if (isAnimeMovie) {
            const movieYearParam = year ? `&primary_release_year=${year}` : "";
            const data = await fetchJson(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(t)}${movieYearParam}`);
            if (data?.results) results = data.results.map((r) => ({ ...r, media_type: "movie" }));
        } else {
            const tvYearParam = year ? `&first_air_date_year=${year}` : "";
            const data = await fetchJson(`${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(t)}${tvYearParam}`);
            if (data?.results) results = data.results.map((r) => ({ ...r, media_type: "tv" }));
        }

        if (!results.length) continue;

        const validCandidates = results.filter(r => {
            const isAnimation = r.genre_ids && r.genre_ids.includes(16);
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
                for (const ut of uniqueTitles) {
                    const s = titleScore(ct, ut);
                    if (s > maxTitleScore) maxTitleScore = s;
                }
            }

            if (maxTitleScore < 1.8) continue;
            score += maxTitleScore;

            const relDate = r.first_air_date || r.release_date;
            const tmdbYear = relDate ? parseInt(String(relDate).substring(0, 4)) : null;

            // STRICT YEAR MATCHING
            if (year && tmdbYear) {
                if (Math.abs(year - tmdbYear) <= 1) {
                    score += 1.5; // Big bonus for right year
                } else {
                    score -= 2.0; // Massive penalty for wrong year
                }
            }

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { tmdb: r, score: score };
            }
        }

        if (bestMatch && bestMatch.score >= 3.0) break;
    }

    return bestMatch && bestMatch.score >= 2.0 ? bestMatch : null;
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

    const poster = match.tmdb.poster_path
        ? `${IMG_BASE}${match.tmdb.poster_path}`
        : await getBestPoster(match.tmdb.id, match.tmdb.media_type);

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