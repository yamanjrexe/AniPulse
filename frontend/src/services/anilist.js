
const ANILIST_URL = 'https://graphql.anilist.co';
const CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export async function searchAniList(query, { signal, limit = 8 } = {}) {
    if (!query || query.trim().length < 2) return [];
    const key = query.toLowerCase().trim();
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.timestamp < CACHE_TTL) return hit.data;

    const gql = `
    query ($search: String) {
      Page(page: 1, perPage: ${limit}) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { english romaji native }
          coverImage { large }
          episodes
          format
          averageScore
          genres
          duration
        }
      }
    }
  `;

    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: gql, variables: { search: query } }),
        signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    const media = json.data?.Page?.media || [];

    const results = media.map(m => ({
        id: m.id,
        title: m.title.english || m.title.romaji || m.title.native || 'Unknown',
        title_english: m.title.english || '',
        title_romaji: m.title.romaji || '',
        type: m.format || 'TV',
        episodes: m.episodes || 0,
        score: m.averageScore ? m.averageScore / 10 : null,
        images: { jpg: { image_url: m.coverImage?.large || null } },
        genres: m.genres || [],
        duration: m.duration || 20
    }));

    CACHE.set(key, { data: results, timestamp: Date.now() });
    return results;
}
