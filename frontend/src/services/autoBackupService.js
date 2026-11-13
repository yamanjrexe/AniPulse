const DB_NAME = "AniPulseBackupDB";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "backupHandle";
const SAVE_DELAY = 800;

const LS_LAST_SAVED = "autoBackupLastSavedAt";
const LS_HANDLE_NAME = "autoBackupHandleName";
const LS_LAST_ERROR = "autoBackupLastError";

let backupHandle = null;
let saveTimer = null;
let lastSavedAt = readStoredNumber(LS_LAST_SAVED);
let lastError = localStorage.getItem(LS_LAST_ERROR) || null;
let initialized = false;
let listenersBound = false;

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

function writeStoredError(msg) {
    if (msg) {
        localStorage.setItem(LS_LAST_ERROR, msg);
    } else {
        localStorage.removeItem(LS_LAST_ERROR);
    }
}

function buildPrettyJSON() {
    const raw = localStorage.getItem("animeData") || "[]";
    try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return raw;
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

async function writeBackup({ silent = false } = {}) {
    if (!backupHandle) return false;

    try {
        const data = buildPrettyJSON();
        const writable = await backupHandle.createWritable();
        await writable.write(data);
        await writable.close();

        lastSavedAt = Date.now();
        writeStoredTimestamp(lastSavedAt);
        lastError = null;
        writeStoredError(null);
        emit();
        return true;
    } catch (err) {
        console.warn("[AutoBackup] Write failed:", err);
        backupHandle = null;
        await deleteHandleFromDB();

        if (err.name === "NotFoundError" || err.name === "NotAllowedError" || err.name === "SecurityError") {
            lastError = "Your browser blocked access to this folder. Please select your 'Documents' or 'Downloads' folder.";
        } else if (err.name === "NoModificationAllowedError") {
            lastError = "File is locked by another program. Please close it and try again.";
        } else {
            lastError = err.message || "Backup failed.";
        }

        writeStoredError(lastError);
        emit();
        return false;
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
        throw new Error("Auto backup is not supported in this browser. Use Chrome or Edge.");
    }

    let handle;
    try {
        handle = await window.showSaveFilePicker({
            suggestedName: "AniPulse_Backup.json",
            types: [
                {
                    description: "AniPulse JSON Backup",
                    accept: { "application/json": [".json"] },
                },
            ],
        });
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("You canceled the file selection. Please try again.");
        }
        if (err.name === "SecurityError" || err.name === "NotAllowedError") {
            throw new Error("Your browser blocked writing to this folder. Please select a folder like 'Documents' or 'Downloads'.");
        }
        throw new Error(err.message || "Could not open file picker.");
    }

    backupHandle = handle;
    lastError = null;
    writeStoredError(null);
    writeStoredHandleName(handle.name);

    try {
        await saveHandleToDB(handle);
    } catch (dbErr) {
        console.warn("[AutoBackup] Could not save handle to DB:", dbErr);
    }

    emit();

    const ok = await writeBackup();
    if (!ok) {
        backupHandle = null;
        await deleteHandleFromDB();
        writeStoredHandleName(null);
        emit();
        throw new Error(lastError || "Failed to write initial backup. Please try a different folder.");
    }

    return getStatus();
}

export async function disable() {
    clearTimeout(saveTimer);
    backupHandle = null;
    lastError = null;
    writeStoredError(null);
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

function handleBeforeUnload() {
    if (!backupHandle) return;
    clearTimeout(saveTimer);
    writeBackup({ silent: true });
}

function handleVisibilityChange() {
    if (!backupHandle) return;
    if (document.visibilityState === "hidden") {
        clearTimeout(saveTimer);
        writeBackup({ silent: true });
    }
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
                lastError = "Backup permission was revoked by the browser. Please re-enable auto backup.";
                writeStoredError(lastError);
            } else {
                backupHandle = handle;
                writeStoredHandleName(handle.name);
                lastError = null;
                writeStoredError(null);
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
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    emit();

    if (backupHandle) {
        setTimeout(() => {
            writeBackup({ silent: true });
        }, 400);
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