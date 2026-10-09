import { api } from "./api.js";

let _statusCache = null;
let _statusCheckedAt = 0;
const STATUS_TTL = 30 * 1000;

async function getStatus(force = false) {
    if (!force && _statusCache && Date.now() - _statusCheckedAt < STATUS_TTL) {
        return _statusCache;
    }
    try {
        const res = await api.get("/anilist/status");
        _statusCache = res;
        _statusCheckedAt = Date.now();
        return res;
    } catch {
        _statusCache = { connected: false };
        _statusCheckedAt = Date.now();
        return _statusCache;
    }
}

function invalidateStatus() {
    _statusCache = null;
    _statusCheckedAt = 0;
}

const PENDING_KEY = "anilistPendingSync";
const MAX_PENDING = 200;

function readPending() {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function writePending(arr) {
    try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
    } catch (_) { }
}

function enqueuePending(job) {
    const arr = readPending();
    const filtered = arr.filter(
        (j) => !(j.anime.id === job.anime.id && j.action === job.action),
    );
    filtered.push(job);
    writePending(filtered.slice(-MAX_PENDING));
}

async function flushPending() {
    const arr = readPending();
    if (!arr.length) return;
    if (!navigator.onLine) return;

    const remaining = [];
    for (const job of arr) {
        try {
            const status = await getStatus(true);
            if (!status.connected) {
                remaining.push(job);
                continue;
            }
            await api.post("/anilist/sync", {
                anime: job.anime,
                action: job.action,
            });
        } catch (_) {
            remaining.push(job);
        }
    }
    writePending(remaining);
}

if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        flushPending().catch(() => { });
    });

    setInterval(() => {
        if (readPending().length > 0 && navigator.onLine) {
            flushPending().catch(() => { });
        }
    }, 60 * 1000);

    setTimeout(() => {
        flushPending().catch(() => { });
    }, 3000);
}

async function ensureConnected() {
    let status = await getStatus();
    if (!status.connected) {
        status = await getStatus(true);
    }
    return status.connected;
}

async function connect() {
    try {
        const { url } = await api.get("/anilist/connect");
        if (!url) return false;
        const popup = window.open(
            url,
            "anilist_oauth",
            "width=600,height=800,left=200,top=100",
        );
        return !!popup;
    } catch (err) {
        console.error("[AniList] connect failed:", err);
        return false;
    }
}

async function disconnect() {
    try {
        await api.post("/anilist/disconnect", {});
        invalidateStatus();
        writePending([]);
        return true;
    } catch {
        return false;
    }
}

async function syncAnime(anime, action = "upsert") {
    try {
        const connected = await ensureConnected();
        if (!connected) {
            return { queued: false, reason: "not_connected" };
        }
        return await api.post("/anilist/sync", { anime, action });
    } catch (err) {
        console.warn("[AniList] sync failed, queuing for retry:", err);
        enqueuePending({ anime, action, enqueuedAt: Date.now() });
        return { queued: false, error: err.message, retry: true };
    }
}

async function syncAll(animeList, { force = false } = {}) {
    const connected = await ensureConnected();
    if (!connected) return { queued: false, reason: "not_connected" };
    try {
        return await api.post("/anilist/sync-all", { animeList, force });
    } catch (err) {
        console.warn("[AniList] sync-all failed:", err);
        return { queued: false, error: err.message };
    }
}

async function getQueueStatus() {
    try {
        return await api.get("/anilist/queue");
    } catch {
        return { jobs: 0, total: 0, processing: null };
    }
}

async function getPendingCount() {
    return readPending().length;
}

async function getFailedMatches() {
    try {
        const res = await api.get("/anilist/failed");
        return res.items || [];
    } catch {
        return [];
    }
}

async function clearFailedMatches() {
    try {
        await api.post("/anilist/failed/clear", {});
        return true;
    } catch {
        return false;
    }
}

export const anilistSync = {
    getStatus,
    invalidateStatus,
    connect,
    disconnect,
    syncAnime,
    syncAll,
    getQueueStatus,
    getPendingCount,
    flushPending,
    getFailedMatches,
    clearFailedMatches,
};