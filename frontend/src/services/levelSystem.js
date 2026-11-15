export const LEVELS = [
    // Tier 1: Casual & Community (1–10)
    { level: 1, title: 'Rookie', xpRequired: 0 },
    { level: 2, title: 'Scout', xpRequired: 100 },
    { level: 3, title: 'Watcher', xpRequired: 250 },
    { level: 4, title: 'Otaku', xpRequired: 500 },
    { level: 5, title: 'Binger', xpRequired: 800 },
    { level: 6, title: 'Enthusiast', xpRequired: 1200 },
    { level: 7, title: 'Senpai', xpRequired: 1700 },
    { level: 8, title: 'Shonen', xpRequired: 2300 },
    { level: 9, title: 'Protagonist', xpRequired: 3000 },
    { level: 10, title: 'Veteran', xpRequired: 4000 },

    // Tier 2: Combat & Rank (11–20)
    { level: 11, title: 'Ronin', xpRequired: 5200 },
    { level: 12, title: 'Shinobi', xpRequired: 6500 },
    { level: 13, title: 'Vanguard', xpRequired: 8000 },
    { level: 14, title: 'Captain', xpRequired: 10000 },
    { level: 15, title: 'Hashira', xpRequired: 12500 },
    { level: 16, title: 'Sensei', xpRequired: 15000 },
    { level: 17, title: 'Sage', xpRequired: 18000 },
    { level: 18, title: 'Kage', xpRequired: 22000 },
    { level: 19, title: 'Warlord', xpRequired: 27000 },
    { level: 20, title: 'Champion', xpRequired: 35000 },

    // Tier 3: Mastery & Legend (21–30)
    { level: 21, title: 'Hero', xpRequired: 45000 },
    { level: 22, title: 'Legend', xpRequired: 53000 },
    { level: 23, title: 'Mythic', xpRequired: 62000 },
    { level: 24, title: 'Paragon', xpRequired: 72000 },
    { level: 25, title: 'Phantom', xpRequired: 83000 },
    { level: 26, title: 'Sovereign', xpRequired: 95000 },
    { level: 27, title: 'Overlord', xpRequired: 108000 },
    { level: 28, title: 'Emperor', xpRequired: 122000 },
    { level: 29, title: 'Awakened', xpRequired: 137000 },
    { level: 30, title: 'Ascendant', xpRequired: 153000 },

    // Tier 4: Divine & Mythological (31–40)
    { level: 31, title: 'Demigod', xpRequired: 170000 },
    { level: 32, title: 'Valkyrie', xpRequired: 188000 },
    { level: 33, title: 'Titan', xpRequired: 207000 },
    { level: 34, title: 'Archon', xpRequired: 227000 },
    { level: 35, title: 'Deity', xpRequired: 248000 },
    { level: 36, title: 'Seraph', xpRequired: 270000 },
    { level: 37, title: 'Celestial', xpRequired: 293000 },
    { level: 38, title: 'Immortal', xpRequired: 317000 },
    { level: 39, title: 'Transcendent', xpRequired: 342000 },
    { level: 40, title: 'Divine', xpRequired: 368000 },

    // Tier 5: Cosmic & Endgame (41–50)
    { level: 41, title: 'Astral', xpRequired: 395000 },
    { level: 42, title: 'Nebula', xpRequired: 423000 },
    { level: 43, title: 'Supernova', xpRequired: 452000 },
    { level: 44, title: 'Chronos', xpRequired: 482000 },
    { level: 45, title: 'Voidwalker', xpRequired: 513000 },
    { level: 46, title: 'Genesis', xpRequired: 545000 },
    { level: 47, title: 'Apex', xpRequired: 578000 },
    { level: 48, title: 'Omega', xpRequired: 612000 },
    { level: 49, title: 'Infinite', xpRequired: 647000 },
    { level: 50, title: 'Omnipotent', xpRequired: 683000 }
];

export const MAX_DAILY_XP = 1500;

const USER_PROFILE_KEY = 'userProfile';
const ANIME_DATA_KEY = 'animeData';
const XP_QUEUE_KEY = 'xpPendingQueue';
const COMPLETED_ANIME_KEY = 'completedAnimeHistory';

export const LEVEL_EVENTS = {
    UPDATED: 'xpUpdated',
    AWARDED: 'xpAwarded',
    QUEUE_UPDATED: 'queueUpdated',
};

function safeGet(key, fallback = null) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch {
        return fallback;
    }
}

function safeSet(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
        console.warn('safeSet error', key, err);
    }
}

function dispatchEvent(name, detail) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
}

function todayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function getUserProfile() {
    let profile = safeGet(USER_PROFILE_KEY);

    if (!profile || typeof profile !== 'object') {
        profile = { totalExp: 0, level: 1, title: LEVELS[0].title, lastExpGainTime: 0 };
        safeSet(USER_PROFILE_KEY, profile);
        localStorage.setItem('userXP', '0');
        localStorage.setItem('userLevel', '1');
        localStorage.setItem('userLevelTitle', LEVELS[0].title);
        return profile;
    }

    let changed = false;

    if (typeof profile.totalExp !== 'number' || isNaN(profile.totalExp)) {
        const mirror = parseInt(localStorage.getItem('userXP') || '0', 10);
        profile.totalExp = Number.isFinite(mirror) && mirror > 0 ? mirror : 0;
        changed = true;
    }

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (profile.totalExp >= LEVELS[i].xpRequired) {
            if (profile.level !== LEVELS[i].level || profile.title !== LEVELS[i].title) {
                profile.level = LEVELS[i].level;
                profile.title = LEVELS[i].title;
                changed = true;
            }
            break;
        }
    }

    if (changed) {
        safeSet(USER_PROFILE_KEY, profile);
        localStorage.setItem('userXP', String(profile.totalExp));
        localStorage.setItem('userLevel', String(profile.level));
        localStorage.setItem('userLevelTitle', profile.title);
    }

    return profile;
}

export function saveUserProfile(profile) {
    profile.totalExp = Math.max(0, Math.floor(Number(profile.totalExp) || 0));

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (profile.totalExp >= LEVELS[i].xpRequired) {
            profile.level = LEVELS[i].level;
            profile.title = LEVELS[i].title;
            break;
        }
    }

    safeSet(USER_PROFILE_KEY, profile);

    localStorage.setItem('userXP', String(profile.totalExp));
    localStorage.setItem('userLevel', String(profile.level));
    localStorage.setItem('userLevelTitle', profile.title);

    dispatchEvent(LEVEL_EVENTS.UPDATED);
    dispatchEvent('syncSchedule');
}

export function getLevelFromXP(totalExp) {
    const xp = Math.max(0, totalExp || 0);
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
    }
    return LEVELS[0];
}

export function getNextLevel(currentLevelNumber) {
    return LEVELS.find((l) => l.level === currentLevelNumber + 1) || null;
}

export function getXPProgress(totalExp) {
    const xp = Math.max(0, totalExp || 0);
    const current = getLevelFromXP(xp);
    const next = getNextLevel(current.level);
    if (!next) return 100;
    const inLevel = xp - current.xpRequired;
    const need = next.xpRequired - current.xpRequired;
    return need > 0 ? Math.min(100, Math.floor((inLevel / need) * 100)) : 100;
}

export function getLevelStats(totalExp) {
    const xp = Math.max(0, totalExp || 0);
    const current = getLevelFromXP(xp);
    const next = getNextLevel(current.level) || current;
    const inLevel = Math.max(0, xp - current.xpRequired);
    const need = Math.max(1, next.xpRequired - current.xpRequired);
    const percent = Math.min(100, Math.floor((inLevel / need) * 100));
    const remaining = Math.max(0, next.xpRequired - xp);
    return { current, next, inLevel, need, remaining, percent };
}

export function calculateExpFromParts(
    { episodes = 0, progress = 0, duration = 20, type = 'TV', score = 0, hasScore = false } = {},
    { useProgress = false } = {}
) {
    const safeEpisodes = Math.min(episodes, 2000);
    const safeProgress = Math.min(progress, safeEpisodes);
    const safeDuration = Math.min(duration, 180);
    const safeScore = Math.min(Math.max(score, 0), 10);

    const eps = useProgress ? Math.max(0, safeProgress) : Math.max(0, safeEpisodes);
    const episodeBonus = Math.floor(eps / 2);

    let scoreBonus = 0;
    if (safeScore >= 9) scoreBonus = 8;
    else if (safeScore >= 8) scoreBonus = 5;
    else if (safeScore >= 7) scoreBonus = 3;

    const movieBonus = type && type.toLowerCase() === 'movie' ? 15 : 0;
    const progressBonus = Math.floor(safeProgress / 5);
    const ratingBonus = hasScore ? 2 : 0;
    const totalMinutes = safeProgress * safeDuration;
    const timeBonus = Math.floor((totalMinutes / 60) * 2);

    return Math.max(
        0,
        Math.floor(episodeBonus + scoreBonus + movieBonus + progressBonus + ratingBonus + timeBonus)
    );
}

export function calculateTotalXPFromAnimeList(animeList) {
    let total = 0;
    (animeList || []).forEach((a) => {
        if (a.userStatus === 'Completed') {
            const effectiveProgress =
                a.progress > 0 ? a.progress : (a.episodes || 0);
            total +=
                calculateExpFromParts(
                    {
                        episodes: a.episodes || 0,
                        progress: effectiveProgress,
                        duration: a.duration || 20,
                        type: a.type,
                        score: a.score || 0,
                        hasScore: !!a.score,
                    },
                    { useProgress: true }
                ) + 10;
        }
    });
    return Math.max(0, Math.floor(total));
}

export function recalculateTotalExp() {
    const list = safeGet(ANIME_DATA_KEY, []) || [];
    const profile = getUserProfile();
    const next = calculateTotalXPFromAnimeList(list);
    console.log(
        `[levelSystem] recalc: animeCount=${list.length}, stored=${profile.totalExp}, computed=${next}`
    );
    if (profile.totalExp !== next) {
        profile.totalExp = next;
        saveUserProfile(profile);
    }
    return next;
}

export function getPendingXPQueue() {
    return safeGet(XP_QUEUE_KEY, []) || [];
}

export function savePendingXPQueue(q) {
    safeSet(XP_QUEUE_KEY, q);
    dispatchEvent(LEVEL_EVENTS.QUEUE_UPDATED);
}

export function addToPendingQueue(anime, xp) {
    const queue = getPendingXPQueue();
    queue.push({
        animeId: anime.id,
        animeTitle: anime.title,
        xp,
        cover: anime.cover,
        timestamp: Date.now(),
        retryCount: 0,
    });
    savePendingXPQueue(queue);
}

export function processPendingXPQueue() {
    const queue = getPendingXPQueue();
    if (!queue.length) return { processed: 0, remaining: 0 };

    const today = new Date().toDateString();
    const key = `dailyXP_${today}`;
    let todayXP = parseInt(localStorage.getItem(key) || '0', 10);
    const profile = getUserProfile();
    let remaining = MAX_DAILY_XP - todayXP;
    const stillPending = [];
    let processed = 0;

    for (const p of queue) {
        if (p.xp <= remaining) {
            todayXP += p.xp;
            remaining -= p.xp;
            profile.totalExp += p.xp;
            processed++;
        } else if (remaining > 0) {
            todayXP += remaining;
            profile.totalExp += remaining;
            p.xp -= remaining;
            p.retryCount++;
            stillPending.push(p);
            remaining = 0;
            processed++;
        } else {
            stillPending.push(p);
        }
        if (remaining <= 0) break;
    }

    localStorage.setItem(key, String(todayXP));
    saveUserProfile(profile);
    savePendingXPQueue(stillPending);

    return { processed, remaining: stillPending.length };
}

export function removeAnimeFromQueue(animeId) {
    const q = getPendingXPQueue().filter((i) => String(i.animeId) !== String(animeId));
    savePendingXPQueue(q);
}

export function getCompletedAnimeHistory() {
    return safeGet(COMPLETED_ANIME_KEY, {}) || {};
}

export function saveCompletedAnimeHistory(h) {
    safeSet(COMPLETED_ANIME_KEY, h);
}

export function markAnimeAsCompleted(animeId, animeTitle, xpEarned) {
    const h = getCompletedAnimeHistory();
    h[animeId] = {
        title: animeTitle,
        xpEarned,
        completedAt: Date.now(),
        earnedDate: new Date().toDateString(),
        episodeCount: 0,
    };
    saveCompletedAnimeHistory(h);
}

export function wasAnimeEverCompleted(animeId) {
    return !!getCompletedAnimeHistory()[animeId];
}

export function removeAnimeFromCompletedHistory(animeId) {
    const h = getCompletedAnimeHistory();
    if (!h[animeId]) return false;
    delete h[animeId];
    saveCompletedAnimeHistory(h);
    return true;
}

export function canGainNow() {
    const profile = getUserProfile();
    const now = Date.now();
    if (now - (profile.lastExpGainTime || 0) < 3000) return false;
    profile.lastExpGainTime = now;
    saveUserProfile(profile);
    return true;
}

function awardXPInternal(anime, earned) {
    const today = new Date().toDateString();
    const key = `dailyXP_${today}`;
    let todayXP = parseInt(localStorage.getItem(key) || '0', 10);
    const profile = getUserProfile();
    const prevLevel = profile.level;

    const basePopup = {
        animeId: anime.id || '',
        title: anime.title || 'Anime',
        cover: anime.cover || '',
        prevLevel,
    };

    if (todayXP >= MAX_DAILY_XP) {
        addToPendingQueue(anime, earned);

        const popupData = {
            ...basePopup,
            xp: 0,
            queued: earned,
            profile: { ...profile },
            newLevel: profile.level,
        };
        dispatchEvent(LEVEL_EVENTS.AWARDED, popupData);
        dispatchEvent(LEVEL_EVENTS.QUEUE_UPDATED);
        return { awarded: 0, queued: earned, popupData };
    }

    if (todayXP + earned > MAX_DAILY_XP) {
        const addNow = MAX_DAILY_XP - todayXP;
        const queueRest = earned - addNow;

        todayXP += addNow;
        localStorage.setItem(key, String(todayXP));
        profile.totalExp += addNow;
        saveUserProfile(profile);

        if (queueRest > 0) addToPendingQueue(anime, queueRest);

        const popupData = {
            ...basePopup,
            xp: addNow,
            queued: queueRest,
            profile: { ...profile },
            newLevel: profile.level,
        };
        dispatchEvent(LEVEL_EVENTS.AWARDED, popupData);
        dispatchEvent(LEVEL_EVENTS.QUEUE_UPDATED);
        return { awarded: addNow, queued: queueRest, popupData };
    }

    todayXP += earned;
    localStorage.setItem(key, String(todayXP));
    profile.totalExp += earned;
    saveUserProfile(profile);

    const popupData = {
        ...basePopup,
        xp: earned,
        queued: 0,
        profile: { ...profile },
        newLevel: profile.level,
    };
    dispatchEvent(LEVEL_EVENTS.AWARDED, popupData);
    return { awarded: earned, popupData };
}

function creditTodayOnly(anime, earned) {
    const today = new Date().toDateString();
    const key = `dailyXP_${today}`;
    let todayXP = parseInt(localStorage.getItem(key) || '0', 10);

    if (todayXP >= MAX_DAILY_XP) {
        addToPendingQueue(anime, earned);
        return;
    }

    if (todayXP + earned > MAX_DAILY_XP) {
        const addNow = MAX_DAILY_XP - todayXP;
        const queueRest = earned - addNow;
        todayXP += addNow;
        localStorage.setItem(key, String(todayXP));
        if (queueRest > 0) addToPendingQueue(anime, queueRest);
        return;
    }

    todayXP += earned;
    localStorage.setItem(key, String(todayXP));
}

export function processAnimeDelta(oldA, newA) {
    if (!newA || typeof newA !== 'object') return { awarded: 0 };
    if (!oldA || typeof oldA !== 'object') return { awarded: 0 };

    const wasCompleted = wasAnimeEverCompleted(newA.id);
    const oldStatus = oldA.userStatus;
    const newStatus = newA.userStatus;

    if (wasCompleted && oldStatus !== 'Completed' && newStatus === 'Completed') {
        return { awarded: 0, blocked: true };
    }

    if (wasCompleted || oldStatus === 'Completed' || newStatus !== 'Completed') {
        return { awarded: 0 };
    }

    let earned =
        calculateExpFromParts({
            episodes: newA.episodes || 0,
            progress: newA.progress || 0,
            duration: newA.duration || 20,
            type: newA.type,
            score: newA.score || 0,
            hasScore: !!newA.score,
        }) + 10;

    earned = Math.max(0, Math.min(50000, Math.floor(earned)));
    markAnimeAsCompleted(newA.id, newA.title, earned);

    return awardXPInternal(newA, earned);
}

export function checkForDirectlyCompletedAnime(animeList) {
    if (!Array.isArray(animeList) || animeList.length === 0) {
        return { processed: 0 };
    }

    const history = getCompletedAnimeHistory();
    const tk = todayKey();
    let processed = 0;

    animeList.forEach((anime) => {
        if (anime.userStatus !== 'Completed') return;
        if (history[anime.id]) return;

        const effectiveProgress =
            anime.progress > 0 ? anime.progress : (anime.episodes || 0);

        const earned =
            calculateExpFromParts(
                {
                    episodes: anime.episodes || 0,
                    progress: effectiveProgress,
                    duration: anime.duration || 20,
                    type: anime.type,
                    score: anime.score || 0,
                    hasScore: !!anime.score,
                },
                { useProgress: true }
            ) + 10;

        markAnimeAsCompleted(anime.id, anime.title, earned);

        if (anime.actualFinishDate === tk) {
            creditTodayOnly(anime, earned);
        }

        processed++;
    });

    return { processed };
}

export function recomputeDailyXP() {
    const today = new Date().toDateString();
    const key = `dailyXP_${today}`;
    const tk = todayKey();
    const list = safeGet(ANIME_DATA_KEY, []) || [];

    let total = 0;
    list.forEach((a) => {
        if (a.userStatus !== 'Completed') return;
        if (a.actualFinishDate !== tk) return;

        const effectiveProgress =
            a.progress > 0 ? a.progress : (a.episodes || 0);

        total +=
            calculateExpFromParts(
                {
                    episodes: a.episodes || 0,
                    progress: effectiveProgress,
                    duration: a.duration || 20,
                    type: a.type,
                    score: a.score || 0,
                    hasScore: !!a.score,
                },
                { useProgress: true }
            ) + 10;
    });

    const capped = Math.min(total, MAX_DAILY_XP);
    localStorage.setItem(key, String(capped));
    return capped;
}

export function checkDailyReset() {
    const lastReset = localStorage.getItem('lastResetDate');
    const today = new Date().toDateString();
    if (lastReset === today) return false;

    Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('dailyXP_') && k !== `dailyXP_${today}`) {
            localStorage.removeItem(k);
        }
    });

    processPendingXPQueue();
    localStorage.setItem('lastResetDate', today);
    dispatchEvent(LEVEL_EVENTS.QUEUE_UPDATED);
    return true;
}

export function getTodayXP() {
    const today = new Date().toDateString();
    return parseInt(localStorage.getItem(`dailyXP_${today}`) || '0', 10);
}

export function clearAllCompletedHistory() {
    localStorage.removeItem(COMPLETED_ANIME_KEY);
    dispatchEvent(LEVEL_EVENTS.QUEUE_UPDATED);
}

export const calculateTotalExpFromAnimeList = calculateTotalXPFromAnimeList;