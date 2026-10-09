const fetch = global.fetch;

const GRAPHQL_URL = 'https://graphql.anilist.co';
const OAUTH_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';
const OAUTH_AUTHORIZE_URL = 'https://anilist.co/api/v2/oauth/authorize';

const STATUS_MAP = {
    Watching: 'CURRENT',
    'Plan to Watch': 'PLANNING',
    Completed: 'COMPLETED',
    Dropped: 'DROPPED',
    'On-Hold': 'PAUSED',
    Rewatching: 'REPEATING',
};

const FORMAT_MAP = {
    TV: 'TV',
    TV_SHORT: 'TV_SHORT',
    Movie: 'MOVIE',
    OVA: 'OVA',
    ONA: 'ONA',
    Special: 'SPECIAL',
};

const STOPWORDS = new Set([
    'the', 'a', 'an', 'of', 'and', 'to', 'in', 'my', 'is', 'by',
    'with', 'from', 'at', 'on', 'for', 'as', 'her', 'his', 'she', 'he',
    'it', 'that', 'this', 'be', 'are', 'was', 'were', 'i', 'me', 'you',
]);

function buildAuthUrl(clientId, redirectUri, state) {
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
    });
    if (state) params.set('state', state);
    return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    const res = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`AniList token exchange failed: ${res.status} ${err}`);
    }
    return res.json();
}

async function graphql(accessToken, query, variables = {}) {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
        throw Object.assign(new Error('Rate limited'), { retryAfter });
    }

    const json = await res.json();
    if (json.errors) {
        throw new Error(json.errors.map((e) => e.message).join('; '));
    }
    return json.data;
}

async function getViewer(accessToken) {
    const data = await graphql(
        accessToken,
        `query { Viewer { id name avatar { large } mediaListOptions { scoreFormat } } }`
    );
    return data.Viewer;
}

function normalizeTitle(str) {
    return (str || '')
        .toLowerCase()
        .replace(/[’‘`´]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/[^\w\s']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenOverlap(a, b) {
    const tokensA = normalizeTitle(a)
        .split(' ')
        .filter((t) => t && !STOPWORDS.has(t));
    const tokensB = normalizeTitle(b)
        .split(' ')
        .filter((t) => t && !STOPWORDS.has(t));

    if (!tokensA.length || !tokensB.length) return 0;

    const setB = new Set(tokensB);
    let hits = 0;
    for (const t of tokensA) {
        if (setB.has(t)) hits++;
    }
    return (2 * hits) / (tokensA.length + tokensB.length);
}

function allTitleVariants(candidate) {
    const variants = [
        candidate.title?.english,
        candidate.title?.romaji,
        candidate.title?.native,
    ].filter(Boolean);

    if (Array.isArray(candidate.synonyms)) {
        for (const s of candidate.synonyms) {
            if (typeof s === 'string' && s.trim()) variants.push(s);
        }
    }
    return variants;
}

function bestTitleSimilarity(candidate, targetTitle) {
    const target = targetTitle || '';
    const variants = allTitleVariants(candidate);

    const nt = normalizeTitle(target);
    if (!nt) return 0;

    let best = 0;
    for (const v of variants) {
        const nv = normalizeTitle(v);
        if (!nv) continue;

        if (nv === nt) {
            best = Math.max(best, 1);
            continue;
        }

        if (nv.includes(nt) || nt.includes(nv)) {
            best = Math.max(best, 0.85);
            continue;
        }

        best = Math.max(best, tokenOverlap(nv, nt));
    }
    return best;
}

function scoreMatch(candidate, target) {
    let score = 0;

    const sim = bestTitleSimilarity(candidate, target.title);
    score += Math.round(sim * 100);

    const desiredFormat = FORMAT_MAP[target.type] || 'TV';
    if (candidate.format === desiredFormat) score += 40;

    if (candidate.episodes) {
        const userEps = target.episodes || 0;
        const diff = Math.abs(candidate.episodes - userEps);
        if (diff === 0) score += 30;
        else if (diff <= 2) score += 15;
        else if (diff <= 6) score += 5;
        else if (userEps > candidate.episodes) {
            score += 0;
        } else {
            score -= 10;
        }
    }

    return score;
}

function pickBestMatch(results, target) {
    if (!results.length) return null;

    const desiredFormat = FORMAT_MAP[target.type] || 'TV';

    const scored = results
        .map((r) => ({
            media: r,
            titleSim: bestTitleSimilarity(r, target.title),
            formatMatch: r.format === desiredFormat,
            score: scoreMatch(r, target),
        }))
        .sort((a, b) => b.score - a.score);

    const sameFormat = scored.filter((s) => s.formatMatch);

    const goodSame = sameFormat.filter((s) => s.titleSim >= 0.3);
    if (goodSame.length > 0) return goodSame[0].media;

    if (sameFormat.length > 0) return sameFormat[0].media;

    const strong = scored.find((s) => s.titleSim >= 0.85);
    return strong ? strong.media : null;
}

function searchVariants(title) {
    const t = (title || '').trim();
    if (!t) return [];

    const out = new Set();
    out.add(t);

    const stripped = t
        .replace(/[!?.,;:'"’“”]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (stripped.length >= 4 && stripped !== t) out.add(stripped);

    const beforeColon = t.split(/[:\-–—]/)[0].trim();
    if (beforeColon.length >= 4 && beforeColon !== t) out.add(beforeColon);

    const words = t.split(/\s+/).filter(Boolean);
    if (words.length > 4) out.add(words.slice(0, 4).join(' '));
    if (words.length > 2) out.add(words.slice(0, 2).join(' '));

    return Array.from(out);
}

const MEDIA_FIELDS = `
    id
    title { romaji english native }
    synonyms
    format
    episodes
    seasonYear
    status
`;

async function queryAniList(searchTerm, format = null) {
    const query = `
        query ($search: String, $format: MediaFormat) {
            Page(page: 1, perPage: 15) {
                media(search: $search, type: ANIME, format: $format, sort: SEARCH_MATCH) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;
    const data = await graphql(null, query, { search: searchTerm, format });
    return data?.Page?.media || [];
}

async function searchAnime(title, preferredFormat = null) {
    const variants = searchVariants(title);
    if (!variants.length) return [];

    if (preferredFormat) {
        try {
            const formatResults = await queryAniList(
                variants[0],
                preferredFormat
            );
            if (formatResults.length > 0) return formatResults;
        } catch (err) {
            console.warn(
                '[AniList] Format-filtered search failed:',
                err.message
            );
        }
    }

    let results = await queryAniList(variants[0]);
    if (results.length > 0) return results;

    for (let i = 1; i < variants.length; i++) {
        try {
            await new Promise((r) => setTimeout(r, 300));
            results = await queryAniList(variants[i]);
            if (results.length > 0) return results;
        } catch (err) {
            console.warn(
                `[AniList] Variant search failed for "${variants[i]}":`,
                err.message
            );
        }
    }

    return [];
}

async function batchSearchAnime(queries) {
    if (!queries.length) return {};

    const aliases = queries.map((q, i) => {
        const escaped = JSON.stringify(q.title || '');
        const fmt = q.format ? `, format: ${q.format}` : '';
        return `a${i}: Page(page: 1, perPage: 8) {
            media(search: ${escaped}, type: ANIME${fmt}, sort: SEARCH_MATCH) {
                ${MEDIA_FIELDS}
            }
        }`;
    });

    const query = `query { ${aliases.join('\n')} }`;
    const data = await graphql(null, query);

    const out = {};
    queries.forEach((q, i) => {
        out[q.key] = data?.[`a${i}`]?.media || [];
    });
    return out;
}

function buildDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleaned = dateStr.trim().split(' ')[0];
    const parts = cleaned.split('-').map((p) => parseInt(p, 10));
    const [year, month, day] = parts;
    if (!year) return null;
    const out = { year };
    if (month >= 1 && month <= 12) out.month = month;
    if (day >= 1 && day <= 31) out.day = day;
    return out;
}

function fuzzyDateToGraphQL(d) {
    const parts = [`year: ${d.year}`];
    if (d.month) parts.push(`month: ${d.month}`);
    if (d.day) parts.push(`day: ${d.day}`);
    return `{ ${parts.join(', ')} }`;
}

async function saveListEntry(accessToken, entry) {
    const { mediaId, status, score, progress, startedAt, completedAt } = entry;

    const vars = {
        mediaId,
        status: STATUS_MAP[status] || 'PLANNING',
    };
    if (score != null) vars.scoreRaw = Math.round(score * 10);
    if (progress != null) vars.progress = Math.max(0, Math.floor(progress));
    if (startedAt) vars.startedAt = startedAt;
    if (completedAt) vars.completedAt = completedAt;

    const mutation = `
        mutation (
            $mediaId: Int
            $status: MediaListStatus
            $scoreRaw: Int
            $progress: Int
            $startedAt: FuzzyDateInput
            $completedAt: FuzzyDateInput
        ) {
            SaveMediaListEntry(
                mediaId: $mediaId
                status: $status
                scoreRaw: $scoreRaw
                progress: $progress
                startedAt: $startedAt
                completedAt: $completedAt
            ) {
                id mediaId status progress score
            }
        }
    `;

    const data = await graphql(accessToken, mutation, vars);
    return data.SaveMediaListEntry;
}

async function batchSaveListEntries(accessToken, entries) {
    if (!entries.length) return [];

    const aliases = entries.map((e, i) => {
        const parts = [`mediaId: ${e.mediaId}`];
        parts.push(`status: ${STATUS_MAP[e.status] || 'PLANNING'}`);

        if (e.score != null) {
            parts.push(`scoreRaw: ${Math.round(e.score * 10)}`);
        }
        if (e.progress != null) {
            parts.push(`progress: ${Math.max(0, Math.floor(e.progress))}`);
        }
        if (e.startedAt) {
            parts.push(`startedAt: ${fuzzyDateToGraphQL(e.startedAt)}`);
        }
        if (e.completedAt) {
            parts.push(`completedAt: ${fuzzyDateToGraphQL(e.completedAt)}`);
        }

        return `m${i}: SaveMediaListEntry(${parts.join(', ')}) {
            id mediaId status progress score
        }`;
    });

    const mutation = `mutation { ${aliases.join('\n')} }`;
    const data = await graphql(accessToken, mutation);

    return entries.map((_, i) => data?.[`m${i}`] || null);
}

async function deleteListEntry(accessToken, entryId) {
    const mutation = `
        mutation ($id: Int) {
            DeleteMediaListEntry(id: $id) { deleted }
        }
    `;
    const data = await graphql(accessToken, mutation, { id: entryId });
    return data.DeleteMediaListEntry;
}

async function findListEntry(accessToken, mediaId) {
    const query = `
        query ($mediaId: Int) {
            Media(id: $mediaId) {
                mediaListEntry { id status progress score }
            }
        }
    `;
    const data = await graphql(accessToken, query, { mediaId });
    return data?.Media?.mediaListEntry || null;
}

async function fetchAllListEntries(accessToken, anilistUserId) {
    const query = `
        query ($userId: Int) {
            MediaListCollection(userId: $userId, type: ANIME) {
                lists {
                    entries {
                        id mediaId status progress score
                    }
                }
            }
        }
    `;
    const data = await graphql(accessToken, query, { userId: anilistUserId });
    const entries = new Map();
    const lists = data?.MediaListCollection?.lists || [];
    for (const list of lists) {
        for (const entry of list.entries || []) {
            if (entry && entry.mediaId) entries.set(entry.mediaId, entry);
        }
    }
    return entries;
}

module.exports = {
    buildAuthUrl,
    exchangeCodeForToken,
    graphql,
    getViewer,
    searchAnime,
    batchSearchAnime,
    pickBestMatch,
    buildDate,
    saveListEntry,
    batchSaveListEntries,
    deleteListEntry,
    findListEntry,
    fetchAllListEntries,
    normalizeTitle,
    bestTitleSimilarity,
    FORMAT_MAP,
    STATUS_MAP,
};