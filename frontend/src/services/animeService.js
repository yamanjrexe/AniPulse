
import { api } from './api.js';

export const animeService = {
    getNextAvailableId(list) {
        const ids = new Set(list.map(a => a.id));
        let id = 1;
        while (ids.has(id)) id++;
        return id;
    },
    loadCloud() { return api.get('/anime/load').then(d => d.animeList || []); },
    saveCloud(list) { return api.post('/anime/save', { animeList: list }); },
    loadActivity() { return api.get('/anime/load-activity').then(d => d.activities || []); },
    saveActivity(a) { return api.post('/anime/save-activity', { activities: a }); }
};
