import { api } from './api.js';

const CACHE_KEY = 'anipulse_profile_cache_';
const CACHE_TTL = 5 * 60 * 1000;

export const profileService = {
    getPublicProfile: async (username, preview = false) => {
        const key = CACHE_KEY + username.toLowerCase() + (preview ? '_preview' : '');
        const cached = sessionStorage.getItem(key);

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    api.get(`/profile/${username}?_t=${Date.now()}${preview ? '&preview=true' : ''}`).then(fresh => {
                        sessionStorage.setItem(key, JSON.stringify({ data: fresh, timestamp: Date.now() }));
                    }).catch(() => { });

                    return parsed.data;
                }
            } catch (e) { }
        }

        const data = await api.get(`/profile/${username}?_t=${Date.now()}${preview ? '&preview=true' : ''}`);
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    },
    claimUsername: (username) => api.post('/profile/claim-username', { username }),
    reportProfile: (uid, reason, details) => api.post(`/profile/${uid}/report`, { reason, details }),
};