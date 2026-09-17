import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { syncService } from "../services/syncService.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
    const { refreshUser } = useAuth();
    const { showToast } = useToast();
    const [status, setStatus] = useState("idle");
    const [lastSync, setLastSync] = useState(
        localStorage.getItem("lastCloudSyncTime"),
    );

    const syncToCloud = useCallback(async () => {
        if (!localStorage.getItem("authToken")) return false;
        setStatus("syncing");
        const ok = await syncService.syncToCloud();
        setStatus(ok ? "synced" : "error");
        if (ok) {
            const t = new Date().toISOString();
            localStorage.setItem("lastCloudSyncTime", t);
            setLastSync(t);
        }
        return ok;
    }, []);

    // ─── Bootstrap: one-shot per page load, ignoring StrictMode ───
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // window-level guards survive the mount/unmount/mount StrictMode cycle
        if (window.__syncBootstrapped) return;
        window.__syncBootstrapped = true;

        (async () => {
            setStatus("loading");
            const startedAt = performance.now();

            try {
                const result = await syncService.loadFromCloud();
                setStatus("synced");

                const t = new Date().toISOString();
                localStorage.setItem("lastCloudSyncTime", t);
                setLastSync(t);

                // Sync in-memory user (name/avatar) from what was written to localStorage
                try {
                    await refreshUser?.();
                } catch (_) {}

                // Toast — once per page load (window-scoped, not sessionStorage)
                if (!window.__cloudToastShown) {
                    window.__cloudToastShown = true;
                    const count = result?.animeCount ?? 0;
                    const message =
                        count === 0
                            ? "Your cloud library is empty — add your first anime"
                            : count === 1
                              ? "Loaded 1 anime from cloud"
                              : `Loaded ${count.toLocaleString()} anime from cloud`;

                    // longer duration so it's easy to spot
                    showToast(message, "success", 5000);
                    console.log(
                        `[Cloud] Loaded in ${Math.round(performance.now() - startedAt)}ms`,
                    );
                }
            } catch (err) {
                setStatus("error");
                console.warn("[Cloud] Load failed:", err.message);

                if (!window.__cloudToastShown) {
                    window.__cloudToastShown = true;
                    showToast(
                        "Using local data — cloud sync failed",
                        "warning",
                        5000,
                    );
                }
            }
        })();
        // eslint-disable-next-line
    }, []);

    // Debounced auto-sync
    useEffect(() => {
        const handler = () => {
            if (localStorage.getItem("authToken")) syncService.scheduleSync();
        };
        window.addEventListener("animeUpdate", handler);
        window.addEventListener("syncSchedule", handler);
        return () => {
            window.removeEventListener("animeUpdate", handler);
            window.removeEventListener("syncSchedule", handler);
        };
    }, []);

    // Online → push pending
    useEffect(() => {
        const onOnline = () => {
            if (localStorage.getItem("authToken")) syncToCloud();
        };
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
    }, [syncToCloud]);

    // beforeunload beacon
    useEffect(() => {
        const onUnload = () => {
            if (!localStorage.getItem("authToken")) return;
            const data = syncService.buildPayload();
            try {
                navigator.sendBeacon(
                    `${window.API_BASE_URL}/api/sync/sync-all`,
                    new Blob([JSON.stringify(data)], {
                        type: "application/json",
                    }),
                );
            } catch (_) {}
        };
        window.addEventListener("beforeunload", onUnload);
        return () => window.removeEventListener("beforeunload", onUnload);
    }, []);

    const loadFromCloud = useCallback(async () => {
        setStatus("loading");
        try {
            const result = await syncService.loadFromCloud();
            setStatus("synced");
            return result;
        } catch (e) {
            setStatus("error");
            return null;
        }
    }, []);

    return (
        <SyncContext.Provider
            value={{ status, lastSync, syncToCloud, loadFromCloud }}
        >
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const ctx = useContext(SyncContext);
    if (!ctx) throw new Error("useSync must be used within SyncProvider");
    return ctx;
}
