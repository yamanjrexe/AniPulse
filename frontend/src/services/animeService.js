import { api } from './api.js';

export const animeService = {
    getNextAvailableId(list) {
        if (!list || list.length === 0) return 1;
        const maxId = Math.max(...list.map(a => Number(a.id) || 0));
        return maxId + 1;
    },

    reindexIds(list) {
        if (!Array.isArray(list)) return [];
        const sorted = [...list].sort((a, b) => {
            const ta = String(a.createdAt || "");
            const tb = String(b.createdAt || "");
            const cmp = ta.localeCompare(tb);
            if (cmp !== 0) return cmp;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        });
        return sorted.map((anime, index) => ({
            ...anime,
            id: index + 1
        }));
    },

    loadCloud() { return api.get('/anime/load').then(d => d.animeList || []); },
    saveCloud(list) { return api.post('/anime/save', { animeList: list }); },
    loadActivity() { return api.get('/anime/load-activity').then(d => d.activities || []); },
    saveActivity(a) { return api.post('/anime/save-activity', { activities: a }); }
};