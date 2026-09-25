import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

  const [streakData, setStreakData] = useState(null);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const streakDataRef = useRef(null);

  const updateStreakData = useCallback((next) => {
    setStreakData(next);
    streakDataRef.current = next;
  }, []);

  const applyServerStreak = useCallback((result) => {
    const raw = result?.streakData ?? result?.data?.streakData ?? null;

    const next = raw
      ? {
          streak: raw.streak || 0,
          lastActive: raw.lastActive || null,
        }
      : { streak: 0, lastActive: null };

    setStreakData(next);
    streakDataRef.current = next;
  }, []);

  const syncToCloud = useCallback(async () => {
    if (!localStorage.getItem("authToken")) return false;
    setStatus("syncing");

    const payload = syncService.buildPayload();
    const ok = await syncService.syncToCloud({
      ...payload,
      streakData: streakDataRef.current || streakData || null,
    });

    setStatus(ok ? "synced" : "error");
    if (ok) {
      const t = new Date().toISOString();
      localStorage.setItem("lastCloudSyncTime", t);
      setLastSync(t);
    }
    return ok;
  }, [streakData]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    if (window.__syncBootstrapped) return;
    window.__syncBootstrapped = true;

    (async () => {
      setStatus("loading");
      const startedAt = performance.now();

      try {
        const result = await syncService.loadFromCloud();
        applyServerStreak(result);
        setHasLoadedFromServer(true);
        setStatus("synced");

        const t = new Date().toISOString();
        localStorage.setItem("lastCloudSyncTime", t);
        setLastSync(t);

        try {
          await refreshUser?.();
        } catch (_) {}

        if (!window.__cloudToastShown) {
          window.__cloudToastShown = true;
          const count = result?.animeCount ?? 0;
          const message =
            count === 0
              ? "Your cloud library is empty — add your first anime"
              : count === 1
                ? "Loaded 1 anime from cloud"
                : `Loaded ${count.toLocaleString()} anime from cloud`;

          showToast(message, "success", 5000);
          console.log(
            `[Cloud] Loaded in ${Math.round(performance.now() - startedAt)}ms`,
          );
        }
      } catch (err) {
        setStatus("error");
        setHasLoadedFromServer(true);
        console.warn("[Cloud] Load failed:", err.message);

        if (!window.__cloudToastShown) {
          window.__cloudToastShown = true;
          showToast("Using local data — cloud sync failed", "warning", 5000);
        }
      }
    })();
    // eslint-disable-next-line
  }, []);

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

  useEffect(() => {
    const onOnline = () => {
      if (localStorage.getItem("authToken")) syncToCloud();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncToCloud]);

  useEffect(() => {
    const onUnload = () => {
      if (!localStorage.getItem("authToken")) return;
      const data = syncService.buildPayload();
      data.streakData = streakDataRef.current || null;
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
      applyServerStreak(result);
      setHasLoadedFromServer(true);
      setStatus("synced");
      return result;
    } catch (e) {
      setStatus("error");
      setHasLoadedFromServer(true);
      return null;
    }
  }, [applyServerStreak]);

  return (
    <SyncContext.Provider
      value={{
        status,
        lastSync,
        syncToCloud,
        loadFromCloud,
        streakData,
        updateStreakData,
        hasLoadedFromServer,
      }}
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
