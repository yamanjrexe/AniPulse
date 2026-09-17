const DB_NAME = "AniPulseBackupDB";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "backupHandle";
const SAVE_DELAY = 800;

const LS_LAST_SAVED = "autoBackupLastSavedAt";
const LS_HANDLE_NAME = "autoBackupHandleName";

let backupHandle = null;
let saveTimer = null;
let lastSavedAt = readStoredNumber(LS_LAST_SAVED);
let lastError = null;
let initialized = false;
let listenersBound = false;
let writeInFlight = false;

const listeners = new Set();

function readStoredNumber(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
}

function writeStoredTimestamp(ts) {
    if (ts == null) {
        localStorage.removeItem(LS_LAST_SAVED);
    } else {
        localStorage.setItem(LS_LAST_SAVED, String(ts));
    }
}

function readStoredHandleName() {
    return localStorage.getItem(LS_HANDLE_NAME) || null;
}

function writeStoredHandleName(name) {
    if (name) {
        localStorage.setItem(LS_HANDLE_NAME, name);
    } else {
        localStorage.removeItem(LS_HANDLE_NAME);
    }
}

export function isSupported() {
    return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export function getStatus() {
    return {
        supported: isSupported(),
        enabled: !!backupHandle,
        handleName: backupHandle?.name || readStoredHandleName(),
        lastSavedAt,
        error: lastError,
    };
}

function emit() {
    const status = getStatus();
    listeners.forEach((cb) => {
        try {
            cb(status);
        } catch (_) { }
    });
}

export function subscribe(cb) {
    listeners.add(cb);
    cb(getStatus());
    return () => listeners.delete(cb);
}

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveHandleToDB(handle) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

async function loadHandleFromDB() {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
        tx.oncomplete = () => db.close();
    });
}

async function deleteHandleFromDB() {
    try {
        const db = await openDB();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                resolve();
            };
        });
    } catch (_) { }
}

async function ensurePermission(handle, { silent = false } = {}) {
    const opts = { mode: "readwrite" };
    try {
        const current = await handle.queryPermission(opts);
        if (current === "granted") return true;
        if (current === "denied") return false;
        if (silent) return false;
        const requested = await handle.requestPermission(opts);
        return requested === "granted";
    } catch (_) {
        return false;
    }
}

async function writeBackup({ silent = false } = {}) {
    if (!backupHandle) return false;
    if (writeInFlight) return false;

    writeInFlight = true;
    try {
        const ok = await ensurePermission(backupHandle, { silent });
        if (!ok) {
            if (!silent) {
                lastError =
                    "Backup permission not granted. Click Save now to re-authorize.";
            }
            emit();
            return false;
        }

        const data = localStorage.getItem("animeData") || "[]";
        const writable = await backupHandle.createWritable();
        await writable.write(data);
        await writable.close();

        lastSavedAt = Date.now();
        writeStoredTimestamp(lastSavedAt);
        lastError = null;
        emit();
        return true;
    } catch (err) {
        if (err.name === "NotFoundError" || err.name === "NotAllowedError") {
            backupHandle = null;
            writeStoredHandleName(null);
            lastError =
                "Backup file is no longer accessible. Re-enable auto backup.";
            await deleteHandleFromDB();
        } else {
            lastError = err.message || "Backup failed";
        }
        emit();
        return false;
    } finally {
        writeInFlight = false;
    }
}

export function triggerSave() {
    if (!backupHandle) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        writeBackup();
    }, SAVE_DELAY);
}

export async function enable() {
    if (!isSupported()) {
        throw new Error(
            "Auto backup is not supported in this browser. Use Chrome or Edge.",
        );
    }

    const handle = await window.showSaveFilePicker({
        suggestedName: "AniPulse_Backup.json",
        types: [
            {
                description: "AniPulse JSON Backup",
                accept: { "application/json": [".json"] },
            },
        ],
    });

    backupHandle = handle;
    lastError = null;
    writeStoredHandleName(handle.name);
    await saveHandleToDB(handle);
    emit();

    await writeBackup();
    return getStatus();
}

export async function disable() {
    clearTimeout(saveTimer);
    backupHandle = null;
    lastError = null;
    lastSavedAt = null;
    writeStoredTimestamp(null);
    writeStoredHandleName(null);
    await deleteHandleFromDB();
    emit();
}

export async function saveNow() {
    if (!backupHandle) return false;
    clearTimeout(saveTimer);
    return writeBackup();
}

export async function init() {
    if (initialized) return;
    initialized = true;

    if (!isSupported()) {
        emit();
        return;
    }

    try {
        const handle = await loadHandleFromDB();
        if (handle) {
            const perm = await handle.queryPermission({ mode: "readwrite" });
            if (perm === "denied") {
                await deleteHandleFromDB();
                backupHandle = null;
                writeStoredHandleName(null);
                lastError =
                    "Backup permission was revoked. Re-enable auto backup.";
            } else {
                backupHandle = handle;
                writeStoredHandleName(handle.name);
            }
        }
    } catch (err) {
        console.warn("[AutoBackup] Failed to restore handle:", err);
    }

    if (!listenersBound) {
        listenersBound = true;
        window.addEventListener("animeUpdate", triggerSave);
        window.addEventListener("storage", (e) => {
            if (e.key === "animeData") triggerSave();
        });
    }

    emit();

    if (backupHandle) {
        setTimeout(() => {
            writeBackup({ silent: true });
        }, 500);
    }
}

export const autoBackupService = {
    isSupported,
    getStatus,
    subscribe,
    init,
    enable,
    disable,
    saveNow,
    triggerSave,
};