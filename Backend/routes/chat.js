const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const anilist = require('../services/anilist');

const router = express.Router();

const KNOWN_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
    'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

const MOOD_GENRES = {
    happy: ['Comedy', 'Slice of Life'],
    sad: ['Drama', 'Romance', 'Slice of Life'],
    scared: ['Horror', 'Thriller', 'Mystery'],
    hyped: ['Action', 'Sports'],
    excited: ['Action', 'Adventure'],
    thoughtful: ['Psychological', 'Mystery', 'Sci-Fi'],
    relaxed: ['Slice of Life', 'Comedy'],
    chill: ['Slice of Life', 'Comedy'],
    romantic: ['Romance'],
    love: ['Romance'],
    crying: ['Drama', 'Romance'],
    mindbending: ['Psychological', 'Sci-Fi', 'Mystery'],
    dark: ['Thriller', 'Psychological', 'Horror'],
    wholesome: ['Slice of Life', 'Comedy', 'Romance'],
};

const MEDIA_FIELDS = `
    id
    title { romaji english native }
    coverImage { extraLarge large }
    bannerImage
    averageScore
    meanScore
    popularity
    episodes
    duration
    format
    status
    genres
    seasonYear
    season
    description(asHtml: false)
    siteUrl
    nextAiringEpisode { episode airingAt }
`;

const CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function cacheGet(key) {
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
    return null;
}
function cacheSet(key, data) {
    CACHE.set(key, { data, at: Date.now() });
}

const SESSIONS = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function getSession(userId) {
    const now = Date.now();
    const s = SESSIONS.get(userId);
    if (!s || now - s.updatedAt > SESSION_TTL) {
        const fresh = { history: [], lastCards: [], lastTopic: null, updatedAt: now };
        SESSIONS.set(userId, fresh);
        return fresh;
    }
    s.updatedAt = now;
    return s;
}

function updateSession(userId, patch) {
    const s = getSession(userId);
    Object.assign(s, patch, { updatedAt: Date.now() });
    if (s.history.length > 20) s.history = s.history.slice(-20);
    return s;
}

function getLevelFromXP(xp) {
    const level = Math.min(50, Math.floor(xp / 1000) + 1);
    const titles = [
        'Newbie', 'Scout', 'Viewer', 'Otaku', 'Fanatic',
        'Binge', 'Senpai', 'Shonen', 'Elite', 'Legend',
        'Sage', 'Keeper', 'Traveler', 'Master', 'Grand',
        'Hokage', 'Transc', 'Veteran', 'Watcher', 'Myth',
        'Deity', 'Mythic', 'Ascend', 'Divine', 'Cosmic',
        'Eternal', 'Godly', 'Celest', 'Potent', 'Absol',
        'Supreme', 'VLord', 'StarE', 'Galaxy', 'Walker',
        'DimLord', 'Weaver', 'TimeM', 'SpaceG', 'Etern',
        'Infini', 'Omni', 'Creator', 'Prime', 'Alpha',
        'Omega', 'Genesis', 'Apoc', 'Nirvana', 'Max',
    ];
    return { level, title: titles[level - 1] || 'Max' };
}

function getDailyLimit() {
    return 1500;
}

async function queryMedia(args, limit = 10) {
    const params = Object.entries(args)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
        .join(', ');
    const data = await anilist.graphql(
        null,
        `query {
            Page(page: 1, perPage: ${limit}) {
                media(${params}) { ${MEDIA_FIELDS} }
            }
        }`
    );
    return data?.Page?.media || [];
}

async function fetchTopPopular(limit = 10) {
    const key = `top:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia({ type: 'ANIME', sort: 'POPULARITY_DESC' }, limit);
    cacheSet(key, media);
    return media;
}

async function fetchTrending(limit = 10) {
    const key = `trending:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia({ type: 'ANIME', sort: 'TRENDING_DESC' }, limit);
    cacheSet(key, media);
    return media;
}

async function fetchSeasonal(limit = 10) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
    const year = now.getFullYear();
    const key = `seasonal:${season}:${year}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(
        { type: 'ANIME', season, seasonYear: year, sort: 'POPULARITY_DESC' },
        limit
    );
    cacheSet(key, media);
    return media;
}

async function fetchUpcoming(limit = 10) {
    const key = `upcoming:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(
        { type: 'ANIME', status: 'NOT_YET_RELEASED', sort: 'POPULARITY_DESC' },
        limit
    );
    cacheSet(key, media);
    return media;
}

async function fetchByGenre(genre, limit = 10) {
    const key = `genre:${genre}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(
        { type: 'ANIME', genre: JSON.stringify(genre), sort: 'POPULARITY_DESC' },
        limit
    );
    cacheSet(key, media);
    return media;
}

async function fetchByYear(year, limit = 10) {
    const key = `year:${year}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(
        { type: 'ANIME', seasonYear: year, sort: 'SCORE_DESC' },
        limit
    );
    cacheSet(key, media);
    return media;
}

async function searchByTitle(title, limit = 6) {
    const key = `search:${title.toLowerCase()}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(
        { type: 'ANIME', search: JSON.stringify(title), sort: 'SEARCH_MATCH' },
        limit
    );
    cacheSet(key, media);
    return media;
}

async function getMediaById(id) {
    const key = `media:${id}`;
    const c = cacheGet(key);
    if (c) return c;
    const data = await anilist.graphql(
        null,
        `query ($id: Int) {
            Media(id: $id) {
                ${MEDIA_FIELDS}
                relations { edges { relationType node { id title { romaji english } format } } }
                externalLinks { site url }
            }
        }`,
        { id }
    );
    const m = data?.Media || null;
    if (m) cacheSet(key, m);
    return m;
}

async function fetchRecommendations(mediaId, limit = 6) {
    const key = `recs:${mediaId}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const data = await anilist.graphql(
        null,
        `query ($id: Int, $n: Int) {
            Media(id: $id) {
                recommendations(sort: RATING_DESC, perPage: $n) {
                    nodes { mediaRecommendation { ${MEDIA_FIELDS} } }
                }
            }
        }`,
        { id: mediaId, n: limit }
    );
    const media = (data?.Media?.recommendations?.nodes || [])
        .map((n) => n.mediaRecommendation)
        .filter(Boolean);
    cacheSet(key, media);
    return media;
}

async function searchFiltered({ genre, year, minScore, maxEps, minEps, sort, limit = 10 }) {
    const args = { type: 'ANIME', sort: sort || 'SCORE_DESC' };
    if (genre) args.genre = JSON.stringify(genre);
    if (year) args.seasonYear = year;
    if (maxEps) args.episodes_lesser = maxEps;
    if (minEps) args.episodes_greater = minEps;
    if (minScore) args.averageScore_greater = Math.round(minScore * 10);
    const key = `filtered:${JSON.stringify(args)}:${limit}`;
    const c = cacheGet(key);
    if (c) return c;
    const media = await queryMedia(args, limit);
    cacheSet(key, media);
    return media;
}

function titleOf(m) {
    return m.title?.english || m.title?.romaji || m.title?.native || 'Unknown';
}

function toCard(m) {
    return {
        id: m.id,
        title: titleOf(m),
        cover: m.coverImage?.extraLarge || m.coverImage?.large || null,
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
        episodes: m.episodes || null,
        format: m.format || null,
        year: m.seasonYear || null,
        genres: Array.isArray(m.genres) ? m.genres.slice(0, 3) : [],
        url: m.siteUrl || null,
    };
}

function localCard(a) {
    return {
        id: a.id,
        title: a.title,
        cover: a.cover || null,
        score: a.score != null ? String(a.score) : null,
        episodes: a.episodes || null,
        format: a.type || null,
        year: (a.finishDate || '').split('-')[0] || null,
        genres: Array.isArray(a.genres) ? a.genres.slice(0, 3) : [],
        url: null,
        inList: true,
    };
}

function animeToAddPayload(m) {
    return {
        title: titleOf(m),
        type:
            m.format === 'MOVIE' ? 'Movie'
                : m.format === 'TV_SHORT' ? 'TV_SHORT'
                    : m.format === 'OVA' ? 'OVA'
                        : m.format === 'ONA' ? 'ONA'
                            : m.format === 'SPECIAL' ? 'Special'
                                : 'TV',
        episodes: m.episodes || 1,
        duration: m.duration || 20,
        cover: m.coverImage?.extraLarge || m.coverImage?.large || '',
        genres: (m.genres || []).filter((g) => g !== 'Award Winning'),
        score: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : null,
        anilistId: m.id,
    };
}

function buildStats(animeList, userData, profile) {
    const total = animeList.length;
    const completed = animeList.filter((a) => a.userStatus === 'Completed').length;
    const watching = animeList.filter((a) => a.userStatus === 'Watching').length;
    const plan = animeList.filter((a) => a.userStatus === 'Plan to Watch').length;
    const dropped = animeList.filter((a) => a.userStatus === 'Dropped').length;

    const genreCount = {};
    animeList.forEach((a) => {
        if (Array.isArray(a.genres)) {
            a.genres.forEach((g) => {
                genreCount[g] = (genreCount[g] || 0) + 1;
            });
        }
    });
    const topGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g);

    const scored = animeList.filter((a) => a.score > 0);
    scored.sort((a, b) => b.score - a.score);

    const totalXP = userData.totalXP || 0;
    const levelInfo = getLevelFromXP(totalXP);
    const averageScore = scored.length
        ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(2)
        : null;

    return {
        total, completed, watching, plan, dropped,
        genreCount, topGenres,
        topAnime: scored.slice(0, 5),
        totalXP, level: levelInfo.level, title: levelInfo.title,
        username: profile.name || userData.username || 'Anime Fan',
        averageScore,
    };
}

function getByOrdinal(cards, ordinal) {
    const n = parseInt(ordinal, 10);
    if (!n || n < 1 || n > cards.length) return null;
    return cards[n - 1];
}

function parseOrdinal(msg) {
    const hashMatch = msg.match(/#(\d+)/);
    if (hashMatch) return hashMatch[1];
    const words = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    for (let i = 0; i < words.length; i++) {
        if (msg.includes(words[i])) return String(i + 1);
    }
    const numWord = msg.match(/(\d+)(?:st|nd|rd|th)\b/);
    if (numWord) return numWord[1];
    return null;
}

async function handleRecommend(ctx) {
    const { stats, animeList, session } = ctx;

    if (!stats.total) {
        const list = await fetchTopPopular(10);
        return {
            text: "You don't have a list yet — here are great starter anime (top popular on AniList):",
            cards: list.map(toCard),
            quickReplies: ['Trending', 'Seasonal anime', 'Top 10 anime', 'Action anime'],
        };
    }

    const plan = animeList.filter((a) => a.userStatus === 'Plan to Watch');
    if (plan.length >= 3) {
        const picks = plan.slice(0, 5).map(localCard);
        return {
            text: 'Picks from your Plan to Watch list:',
            cards: picks,
            quickReplies: ['Recommend something else', 'Based on my top genre', 'Trending'],
        };
    }

    if (stats.topGenres.length) {
        const genre = stats.topGenres[0];
        const list = await fetchByGenre(genre, 20);
        const titles = new Set(animeList.map((a) => (a.title || '').toLowerCase()));
        const filtered = list
            .filter((m) => !titles.has(titleOf(m).toLowerCase()))
            .slice(0, 6);
        if (filtered.length) {
            return {
                text: `Based on your love for **${genre}**, here are some picks you're not tracking yet:`,
                cards: filtered.map(toCard),
                quickReplies: [`${stats.topGenres[1] || 'Action'} anime`, 'Trending', 'Something short'],
            };
        }
    }

    const list = await fetchTopPopular(6);
    return {
        text: 'Here are some highly popular anime you might enjoy:',
        cards: list.map(toCard),
        quickReplies: ['Trending', 'Seasonal anime', 'Top 10 anime'],
    };
}

async function handleSimilar(ctx, title) {
    const results = await searchByTitle(title, 3);
    if (!results.length) {
        return { text: `I couldn't find "${title}" on AniList.` };
    }
    const base = results[0];
    const recs = await fetchRecommendations(base.id, 6);
    if (!recs.length) {
        return {
            text: `I couldn't find recommendations for **${titleOf(base)}** yet.`,
            cards: [toCard(base)],
        };
    }
    return {
        text: `If you liked **${titleOf(base)}**, try these:`,
        cards: recs.map(toCard),
        quickReplies: ['Recommend me', 'Top 10 anime'],
    };
}

async function handleCompare(ctx, a, b) {
    const [r1, r2] = await Promise.all([searchByTitle(a, 1), searchByTitle(b, 1)]);
    const mA = r1[0];
    const mB = r2[0];
    if (!mA || !mB) {
        return { text: `I couldn't find one of those titles.` };
    }
    const scoreA = mA.averageScore ? (mA.averageScore / 10).toFixed(1) : '—';
    const scoreB = mB.averageScore ? (mB.averageScore / 10).toFixed(1) : '—';
    return {
        text:
            `**${titleOf(mA)}** vs **${titleOf(mB)}**\n\n` +
            `• Score: ${scoreA} vs ${scoreB}\n` +
            `• Episodes: ${mA.episodes || '—'} vs ${mB.episodes || '—'}\n` +
            `• Year: ${mA.seasonYear || '—'} vs ${mB.seasonYear || '—'}\n` +
            `• Genres: ${(mA.genres || []).slice(0, 3).join(', ')} vs ${(mB.genres || []).slice(0, 3).join(', ')}`,
        cards: [toCard(mA), toCard(mB)],
    };
}

async function handleMood(ctx, mood) {
    const genres = MOOD_GENRES[mood];
    if (!genres) return null;
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const list = await fetchByGenre(genre, 10);
    const tracked = new Set((ctx.animeList || []).map((a) => (a.title || '').toLowerCase()));
    const filtered = list.filter((m) => !tracked.has(titleOf(m).toLowerCase())).slice(0, 6);
    return {
        text: `Feeling ${mood}? Here are some **${genre}** picks:`,
        cards: (filtered.length ? filtered : list.slice(0, 6)).map(toCard),
        quickReplies: ['Recommend me', 'Trending', 'Something short'],
    };
}

async function handleFiltered(ctx, msg) {
    const genre = KNOWN_GENRES.find((g) => msg.includes(g.toLowerCase()));
    const yearMatch = msg.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
    const scoreMatch = msg.match(/(?:rated|score|above|over|at least)\s*(?:above|over|at least)?\s*(\d+(?:\.\d+)?)/);
    const minScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;
    const epsUnder = msg.match(/(?:under|less than|max|below|shorter than)\s*(\d+)\s*(?:eps|episodes|ep)/);
    const maxEps = epsUnder ? parseInt(epsUnder[1], 10) : null;
    const epsOver = msg.match(/(?:over|more than|min|above|longer than)\s*(\d+)\s*(?:eps|episodes|ep)/);
    const minEps = epsOver ? parseInt(epsOver[1], 10) : null;

    if (!genre && !year && !minScore && !maxEps && !minEps) return null;

    const list = await searchFiltered({ genre, year, minScore, maxEps, minEps, limit: 10 });
    if (!list.length) {
        return { text: `No matches for those filters. Try widening the criteria.` };
    }
    const parts = [];
    if (genre) parts.push(`**${genre}**`);
    if (year) parts.push(`from **${year}**`);
    if (minScore) parts.push(`rated **${minScore}+**`);
    if (maxEps) parts.push(`**${maxEps} eps or fewer**`);
    if (minEps) parts.push(`**${minEps}+ eps**`);
    return {
        text: `Anime matching ${parts.join(', ')}:`,
        cards: list.map(toCard),
        quickReplies: ['Recommend me', 'Trending', 'Top 10 anime'],
    };
}

async function handleAddToList(ctx, title) {
    if (!title) {
        const ord = parseOrdinal(ctx.msg);
        if (ord && ctx.session.lastCards.length) {
            const picked = getByOrdinal(ctx.session.lastCards, ord);
            if (picked) {
                return {
                    text: `Adding **${picked.title}** to your list...`,
                    actions: [{ type: 'addAnime', anime: picked }],
                    cards: [picked],
                };
            }
        }
        return { text: 'Which anime should I add? Try: "add Frieren to my list".' };
    }
    const results = await searchByTitle(title, 1);
    if (!results.length) {
        return { text: `I couldn't find "${title}" on AniList.` };
    }
    const m = results[0];
    return {
        text: `Adding **${titleOf(m)}** to your list...`,
        actions: [{ type: 'addAnime', anime: animeToAddPayload(m) }],
        cards: [toCard(m)],
    };
}

async function handleRemove(ctx, title) {
    const matched = ctx.animeList.find(
        (a) => (a.title || '').toLowerCase().includes(title.toLowerCase())
    );
    if (!matched) {
        return { text: `"${title}" isn't in your list.` };
    }
    return {
        text: `Removing **${matched.title}** from your list...`,
        actions: [{ type: 'removeAnime', animeId: matched.id }],
    };
}

async function handleUpdateStatus(ctx, title, status) {
    const matched = ctx.animeList.find(
        (a) => (a.title || '').toLowerCase().includes(title.toLowerCase())
    );
    if (!matched) {
        return { text: `"${title}" isn't in your list.` };
    }
    return {
        text: `Marking **${matched.title}** as **${status}**...`,
        actions: [{ type: 'updateAnime', animeId: matched.id, patch: { userStatus: status } }],
    };
}

async function handleDetail(ctx, target) {
    let mediaId = null;
    let fromCard = null;
    const ord = parseOrdinal(ctx.msg);
    if (ord && ctx.session.lastCards.length) {
        fromCard = getByOrdinal(ctx.session.lastCards, ord);
        if (fromCard) mediaId = fromCard.id;
    }
    if (!mediaId && target) {
        const results = await searchByTitle(target, 1);
        if (results.length) mediaId = results[0].id;
    }
    if (!mediaId) return null;

    const m = await getMediaById(mediaId);
    if (!m) return { text: `Couldn't fetch details.` };

    const desc = (m.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

    return {
        text:
            `**${titleOf(m)}** (${m.seasonYear || '—'})\n` +
            `${desc}${desc.length >= 300 ? '…' : ''}`,
        cards: [toCard(m)],
        quickReplies: ['Add to my list', `Similar to ${titleOf(m)}`, 'Recommend me'],
    };
}

async function respond(msg, original, stats, animeList, session) {
    const ctx = { msg, original, stats, animeList, session };
    const hasList = stats.total > 0;

    if (/^(hi|hello|hey|yo|sup|greetings|howdy)\b/i.test(msg)) {
        return {
            text: hasList
                ? `Hi ${stats.username}! 👋 You have ${stats.total} anime (${stats.completed} completed). What would you like to do?`
                : `Hi ${stats.username}! 👋 I can recommend anime, tell you what's trending, and more.`,
            quickReplies: hasList
                ? ['Recommend me', 'My stats', "What's trending?", 'Random anime']
                : ['Recommend me', 'Top 10 anime', "What's trending?", 'Seasonal anime'],
        };
    }

    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('commands')) {
        return {
            text:
                'I can help with:\n' +
                '• Stats (total, completed, average score)\n' +
                '• XP and level\n' +
                '• Recommendations (from your list or globally)\n' +
                '• Trending, seasonal, upcoming, top 10\n' +
                '• Genre search — "romance anime"\n' +
                '• Mood — "I\'m sad", "something funny"\n' +
                '• Filters — "action under 30 eps rated 8+"\n' +
                '• Similar — "anime like Frieren"\n' +
                '• Compare — "Naruto vs Bleach"\n' +
                '• Add to list — "add Frieren to my list"\n' +
                '• Details — "tell me about One Piece"',
            quickReplies: ['Recommend me', 'Trending', 'Top 10 anime', 'Random anime'],
        };
    }

    const addMatch = original.match(/(?:add)\s+(.+?)\s+(?:to\s+my\s+list|to\s+the\s+list|for\s+me)/i);
    if (addMatch) return handleAddToList(ctx, addMatch[1].trim());
    if (/^add\s+(?:that|this|it|#\d+)/i.test(msg) || /^add\s+(first|second|third|fourth|fifth)/i.test(msg)) {
        return handleAddToList(ctx, null);
    }

    const removeMatch = original.match(/(?:remove|delete)\s+(.+?)(?:\s+from\s+my\s+list)?$/i);
    if (removeMatch) return handleRemove(ctx, removeMatch[1].trim());

    const statusMatch = original.match(/(?:mark|set|change)\s+(.+?)\s+(?:as|to)\s+(completed|watching|plan to watch|dropped)/i);
    if (statusMatch) {
        const map = {
            completed: 'Completed', watching: 'Watching',
            'plan to watch': 'Plan to Watch', dropped: 'Dropped',
        };
        return handleUpdateStatus(ctx, statusMatch[1].trim(), map[statusMatch[2].toLowerCase()]);
    }

    const vsMatch = original.match(/(.+?)\s+(?:vs\.?|versus|or)\s+(.+)/i);
    if (vsMatch && vsMatch[1].length < 40 && vsMatch[2].length < 40) {
        return handleCompare(ctx, vsMatch[1].trim(), vsMatch[2].trim());
    }

    const similarMatch = original.match(/(?:similar to|anime like|like|more like)\s+(.+)/i);
    if (similarMatch) return handleSimilar(ctx, similarMatch[1].trim());

    if (/more like #?\d+|another one|another like that/i.test(msg)) {
        const ord = parseOrdinal(msg);
        const last = ord
            ? getByOrdinal(session.lastCards, ord)
            : session.lastCards[0];
        if (last) return handleSimilar(ctx, last.title);
        return { text: 'Ask me for some recommendations first, then I can find more like them.' };
    }

    const moodKeys = Object.keys(MOOD_GENRES);
    for (const mood of moodKeys) {
        if (msg.includes(mood)) {
            const r = await handleMood(ctx, mood);
            if (r) return r;
        }
    }
    if (msg.includes("i'm sad") || msg.includes('i am sad') || msg.includes('feeling down')) {
        return handleMood(ctx, 'sad');
    }
    if (msg.includes('something funny') || msg.includes('make me laugh')) {
        return handleMood(ctx, 'happy');
    }
    if (msg.includes('scary') || msg.includes('creepy')) {
        return handleMood(ctx, 'scared');
    }

    if (/tell me (more )?about|details|info about|what is|about\s+/i.test(msg)) {
        const target = original.replace(/.*(?:about|what is|details for|info on)\s*/i, '').trim();
        const r = await handleDetail(ctx, target || null);
        if (r) return r;
    }

    if (/add to (my )?list/i.test(msg) && session.lastCards.length) {
        const picked = session.lastCards[0];
        return {
            text: `Adding **${picked.title}** to your list...`,
            actions: [{ type: 'addAnime', anime: picked }],
            cards: [picked],
        };
    }

    if (msg.includes('random') || msg.includes('surprise me')) {
        const pool = hasList ? await fetchTrending(20) : await fetchTopPopular(20);
        if (pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            return {
                text: "Here's a random pick for you:",
                cards: [toCard(pick)],
                quickReplies: ['Another one', 'Recommend me', 'Add to my list'],
            };
        }
    }

    if (/top\s*10|top\s*anime|best\s*anime|most\s*popular\s*anime/i.test(msg)) {
        const list = await fetchTopPopular(10);
        return {
            text: '🏆 Top 10 most popular anime on AniList:',
            cards: list.map(toCard),
            quickReplies: ['Trending', 'Seasonal anime', 'Recommend me'],
        };
    }

    if (msg.includes('trending') || msg.includes('hot') || msg.includes("what's popular") || msg.includes('popular now')) {
        const list = await fetchTrending(10);
        return {
            text: '🔥 Trending right now on AniList:',
            cards: list.map(toCard),
            quickReplies: ['Top 10 anime', 'Seasonal anime', 'Random anime'],
        };
    }

    if (msg.includes('season') || msg.includes('airing') || msg.includes('this season') || msg.includes('currently airing')) {
        const list = await fetchSeasonal(10);
        return {
            text: '📺 Popular anime airing this season:',
            cards: list.map(toCard),
            quickReplies: ['Trending', 'Upcoming', 'Top 10 anime'],
        };
    }

    if (msg.includes('upcoming') || msg.includes('not yet released') || msg.includes('future anime')) {
        const list = await fetchUpcoming(10);
        return { text: '🗓️ Upcoming anime on AniList:', cards: list.map(toCard) };
    }

    if (msg.includes('total anime') || msg.includes('how many anime') || msg.includes('anime count') || msg === 'stats' || msg.includes('my stats')) {
        if (!hasList) {
            return {
                text: "You don't have any anime in your list yet. Ask me for recommendations or add some!",
                quickReplies: ['Recommend me', 'Top 10 anime', 'Trending'],
            };
        }
        return {
            text:
                `📊 Your stats:\n` +
                `• Total: ${stats.total}\n` +
                `• Completed: ${stats.completed}\n` +
                `• Watching: ${stats.watching}\n` +
                `• Plan to Watch: ${stats.plan}\n` +
                `• Dropped: ${stats.dropped}` +
                (stats.averageScore ? `\n• Average score: ${stats.averageScore}` : ''),
        };
    }

    if (msg.includes('completed') && /how many|count/i.test(msg)) {
        return { text: hasList ? `You've completed ${stats.completed} anime.` : "You haven't marked any anime as completed yet." };
    }
    if (msg.includes('watching') && /how many|count/i.test(msg)) {
        return { text: hasList ? `You're currently watching ${stats.watching} anime.` : "You're not watching anything right now." };
    }
    if (msg.includes('plan to watch') || msg.includes('planned')) {
        return { text: hasList ? `You have ${stats.plan} anime in Plan to Watch.` : 'Your Plan to Watch is empty.' };
    }
    if (msg.includes('daily limit') || msg.includes('daily xp')) {
        return { text: `The daily XP limit is ${getDailyLimit()} XP.` };
    }
    if (msg.includes('xp') || msg.includes('experience')) {
        return { text: `You have **${stats.totalXP} XP** — Level ${stats.level} (${stats.title}). Daily XP limit: ${getDailyLimit()}.` };
    }
    if (msg.includes('level') || msg.includes('rank') || msg.includes('my title')) {
        return { text: `You are Level ${stats.level} — ${stats.title}.` };
    }

    const filtered = await handleFiltered(ctx, msg);
    if (filtered) return filtered;

    if ((msg.includes('genre') || msg.includes('taste')) && (msg.includes('top') || msg.includes('favorite') || msg.includes('my'))) {
        if (!stats.topGenres.length) {
            return { text: 'I need some anime in your list to detect your taste. Try asking for recommendations!' };
        }
        return {
            text: `Your top genres: **${stats.topGenres.slice(0, 3).join(', ')}**.`,
            quickReplies: [`${stats.topGenres[0]} anime`, 'Recommend me'],
        };
    }

    if (msg.includes('top rated') || msg.includes('my best') || msg.includes('highest rated') || msg.includes('favorite anime')) {
        if (!stats.topAnime.length) {
            return { text: "You haven't rated any anime yet. Rate some to see your top picks!" };
        }
        return { text: '⭐ Your highest rated anime:', cards: stats.topAnime.map(localCard) };
    }

    if (msg.includes('short') || msg.includes('quick watch') || msg.includes('something short')) {
        const list = await searchFiltered({ maxEps: 13, minScore: 7.5, limit: 10 });
        return {
            text: 'Here are some highly-rated short anime (≤ 13 episodes):',
            cards: list.map(toCard),
            quickReplies: ['Something long', 'Recommend me'],
        };
    }
    if (msg.includes('long') || msg.includes('longer anime')) {
        const list = await searchFiltered({ minEps: 50, minScore: 7.5, limit: 10 });
        return {
            text: 'Here are some highly-rated long-running anime (50+ episodes):',
            cards: list.map(toCard),
            quickReplies: ['Something short', 'Recommend me'],
        };
    }

    if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what should i watch') || msg.includes('pick for me')) {
        return handleRecommend(ctx);
    }

    const detectedGenre = KNOWN_GENRES.find((g) => msg.includes(g.toLowerCase()));
    if (detectedGenre) {
        const list = await fetchByGenre(detectedGenre, 10);
        if (list.length) {
            return {
                text: `Here are some popular **${detectedGenre}** anime:`,
                cards: list.map(toCard),
                quickReplies: ['Recommend me', 'Trending'],
            };
        }
    }

    if (msg.length >= 3 && msg.length <= 60 &&
        !/^(how|what|why|when|where|who|can|do|is|are|will|should|would|could|may|might)\b/.test(msg)) {
        const list = await searchByTitle(original, 5);
        if (list.length) {
            return {
                text: `Here's what I found for "${original}":`,
                cards: list.map(toCard),
                quickReplies: ['Add to my list', 'Recommend me'],
            };
        }
    }

    return {
        text: hasList
            ? `I'm not sure about that, ${stats.username}. Try: "Recommend me", "Top 10 anime", "My stats", or "Tell me about One Piece".`
            : 'I\'m not sure about that. Try: "Recommend me", "Top 10 anime", "Trending", or "Tell me about Naruto".',
        quickReplies: hasList
            ? ['Recommend me', 'My stats', 'Trending', 'Top 10']
            : ['Recommend me', 'Top 10 anime', 'Trending', 'Seasonal anime'],
    };
}

router.post('/', verifyToken, async (req, res) => {
    const { message } = req.body;
    const userId = req.userId;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const [userDoc, animeDoc, profileDoc] = await Promise.all([
            db.collection(COLLECTIONS.USERS).doc(userId).get(),
            db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get(),
            db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get(),
        ]);
        const userData = userDoc.exists ? userDoc.data() : {};
        const animeList = animeDoc.exists ? animeDoc.data().animeList || [] : [];
        const profile = profileDoc.exists ? profileDoc.data() : {};

        const stats = buildStats(animeList, userData, profile);
        const session = getSession(userId);
        const msg = message.toLowerCase().trim();

        const reply = await respond(msg, message, stats, animeList, session);

        if (Array.isArray(reply.cards) && reply.cards.length) {
            updateSession(userId, { lastCards: reply.cards.slice(0, 8) });
        }
        session.history.push({ role: 'user', text: message });
        session.history.push({ role: 'bot', text: reply.text });

        res.json(reply);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.get('/anime/:id', verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ error: 'Bad id' });
        const m = await getMediaById(id);
        if (!m) return res.status(404).json({ error: 'Not found' });

        const desc = (m.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        res.json({
            id: m.id,
            title: titleOf(m),
            cover: m.coverImage?.extraLarge || m.coverImage?.large || null,
            banner: m.bannerImage || null,
            score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
            popularity: m.popularity || null,
            episodes: m.episodes || null,
            duration: m.duration || null,
            format: m.format || null,
            status: m.status || null,
            year: m.seasonYear || null,
            genres: m.genres || [],
            description: desc,
            siteUrl: m.siteUrl || null,
            nextAiring: m.nextAiringEpisode
                ? { episode: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt * 1000 }
                : null,
            relations: (m.relations?.edges || []).map((e) => ({
                type: e.relationType,
                id: e.node?.id,
                title: e.node?.title?.english || e.node?.title?.romaji,
                format: e.node?.format,
            })),
            links: (m.externalLinks || []).filter((l) => l.site && l.url),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/session', verifyToken, (req, res) => {
    SESSIONS.delete(req.userId);
    res.json({ success: true });
});

module.exports = router;