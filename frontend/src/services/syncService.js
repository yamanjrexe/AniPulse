import { api } from './api.js';

export const syncService = {
    _timer: null,
    _inflightLoad: null,
    _currentSync: null,

    buildPayload() {
        return {
            animeData: JSON.parse(localStorage.getItem('animeData') || '[]'),
            activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
            userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
            unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
            userXpHistory: JSON.parse(localStorage.getItem('userXpHistory') || '[]'),
            animeContributions: JSON.parse(localStorage.getItem('animeContributions') || '{}'),
            appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
            levelData: {
                totalXP: parseInt(localStorage.getItem('userXP') || '0', 10),
                level: parseInt(localStorage.getItem('userLevel') || '1', 10),
                title: localStorage.getItem('userLevelTitle') || 'Newbie',
            },
            dailyXP: {
                date: new Date().toDateString(),
                xp: parseInt(localStorage.getItem(`dailyXP_${new Date().toDateString()}`) || '0', 10),
            },
            xpPendingQueue: JSON.parse(localStorage.getItem('xpPendingQueue') || '[]'),
            lastResetDate: localStorage.getItem('lastResetDate'),
            streakData: {
                streak: parseInt(localStorage.getItem('streak') || '0', 10),
                lastActive: localStorage.getItem('lastActive'),
            },
            lastModified: new Date().toISOString(),
        };
    },

    async syncToCloud(payload) {
        if (!localStorage.getItem('authToken') || !navigator.onLine) {
            return false;
        }

        if (this._currentSync) {
            return this._currentSync;
        }

        const dataToSend = payload || this.buildPayload();

        this._currentSync = api.post('/sync/sync-all', dataToSend)
            .then(() => true)
            .catch((e) => {
                console.error('[Sync] Failed:', e);
                return false;
            })
            .finally(() => {
                this._currentSync = null;
            });

        return this._currentSync;
    },

    scheduleSync() {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.syncToCloud(), 2000);
    },

    async loadFromCloud() {
        if (this._inflightLoad) return this._inflightLoad;

        this._inflightLoad = (async () => {
            const res = await api.get(`/sync/load-all?_t=${Date.now()}`);
            if (!res.success) throw new Error(res.error || 'Load failed');

            const { data } = res;

            if (data.animeData != null) {
                localStorage.setItem('animeData', JSON.stringify(data.animeData));
            }
            if (data.activityLog != null) {
                localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
            }
            if (data.unlockedAchievements != null) {
                localStorage.setItem('unlockedAchievements', JSON.stringify(data.unlockedAchievements));
            }
            if (data.userXpHistory != null) {
                localStorage.setItem('userXpHistory', JSON.stringify(data.userXpHistory));
            }
            if (data.animeContributions != null) {
                localStorage.setItem('animeContributions', JSON.stringify(data.animeContributions));
            }
            if (data.appSettings != null) {
                localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
            }
            if (data.xpPendingQueue != null) {
                localStorage.setItem('xpPendingQueue', JSON.stringify(data.xpPendingQueue));
            }

            if (data.userProfile != null || data.levelData != null) {
                let existingProfile = {};
                try {
                    existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                } catch (e) {
                    existingProfile = {};
                }

                const cloudProfile = data.userProfile || {};
                const levelData = data.levelData || {};
                const mergedProfile = { ...existingProfile, ...cloudProfile };

                if (typeof levelData.totalXP === 'number') {
                    mergedProfile.totalExp = levelData.totalXP;
                } else if (typeof mergedProfile.totalExp !== 'number') {
                    const mirror = parseInt(localStorage.getItem('userXP') || '0', 10);
                    mergedProfile.totalExp = Number.isFinite(mirror) ? mirror : 0;
                }

                if (typeof levelData.level === 'number') {
                    mergedProfile.level = levelData.level;
                }
                if (typeof levelData.title === 'string' && levelData.title) {
                    mergedProfile.title = levelData.title;
                }

                localStorage.setItem('userProfile', JSON.stringify(mergedProfile));
            }

            if (data.levelData) {
                if (typeof data.levelData.totalXP === 'number') {
                    localStorage.setItem('userXP', String(data.levelData.totalXP));
                }
                if (typeof data.levelData.level === 'number') {
                    localStorage.setItem('userLevel', String(data.levelData.level));
                }
                if (data.levelData.title) {
                    localStorage.setItem('userLevelTitle', data.levelData.title);
                }
            }

            if (data.streakData) {
                localStorage.setItem('streak', String(data.streakData.streak || 0));
                if (data.streakData.lastActive) {
                    localStorage.setItem('lastActive', data.streakData.lastActive);
                }
            }
            if (data.lastResetDate) {
                localStorage.setItem('lastResetDate', data.lastResetDate);
            }

            if (data.userProfile) {
                const user = (() => {
                    try {
                        return JSON.parse(localStorage.getItem('user') || '{}');
                    } catch (e) {
                        return {};
                    }
                })();
                user.name = data.userProfile.name || data.userProfile.username || user.name;
                user.username = data.userProfile.username || data.userProfile.name || user.username;
                user.avatar = data.userProfile.avatar || user.avatar;
                localStorage.setItem('user', JSON.stringify(user));
            }

            window.dispatchEvent(new CustomEvent('cloudDataLoaded'));

            const animeCount = Array.isArray(data.animeData) ? data.animeData.length : 0;
            return { animeCount, userProfile: data.userProfile, data };
        })();

        try {
            return await this._inflightLoad;
        } finally {
            this._inflightLoad = null;
        }
    },
};