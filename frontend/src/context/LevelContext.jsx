import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as LS from "../services/levelSystem.js";
import { useAnime } from "./AnimeContext.jsx";

const LevelContext = createContext(null);

export function LevelProvider({ children }) {
  const { animeData } = useAnime();

  const [profile, setProfile] = useState(() => LS.getUserProfile());
  const [queue, setQueue] = useState(() => LS.getPendingXPQueue());
  const [todayXP, setTodayXP] = useState(() => LS.getTodayXP());

  const prevAnimeRef = useRef(null);
  const initialCheckRef = useRef(false);

  const refreshProfile = useCallback(() => {
    const p = LS.getUserProfile();
    setProfile({ ...p });
  }, []);

  const refreshQueue = useCallback(() => {
    setQueue(LS.getPendingXPQueue());
    setTodayXP(LS.getTodayXP());
  }, []);

  const runRecalc = useCallback(
    (source) => {
      try {
        const list = (() => {
          try {
            return JSON.parse(localStorage.getItem("animeData") || "[]");
          } catch {
            return [];
          }
        })();
        if (!Array.isArray(list) || list.length === 0) {
          console.log(`[LevelContext] Recalc (${source}): animeData empty`);
          return;
        }
        const storedProfile = LS.getUserProfile();
        const computed = LS.calculateTotalXPFromAnimeList(list);
        if (computed > 0 && computed !== storedProfile.totalExp) {
          storedProfile.totalExp = computed;
          LS.saveUserProfile(storedProfile);
          console.log(
            `[LevelContext] Recalc (${source}): updated totalExp → ${computed}`,
          );
        }
        refreshProfile();
        refreshQueue();
      } catch (err) {
        console.warn(`[LevelContext] Recalc (${source}) failed:`, err);
      }
    },
    [refreshProfile, refreshQueue],
  );

  useEffect(() => {
    const onUpdated = () => refreshProfile();
    const onQueue = () => refreshQueue();
    window.addEventListener(LS.LEVEL_EVENTS.UPDATED, onUpdated);
    window.addEventListener(LS.LEVEL_EVENTS.QUEUE_UPDATED, onQueue);
    return () => {
      window.removeEventListener(LS.LEVEL_EVENTS.UPDATED, onUpdated);
      window.removeEventListener(LS.LEVEL_EVENTS.QUEUE_UPDATED, onQueue);
    };
  }, [refreshProfile, refreshQueue]);

  useEffect(() => {
    const handler = () => {
      refreshProfile();
      refreshQueue();
    };
    window.addEventListener("uiRefresh", handler);
    return () => window.removeEventListener("uiRefresh", handler);
  }, [refreshProfile, refreshQueue]);

  useEffect(() => {
    const handler = () => runRecalc("cloudDataLoaded");
    window.addEventListener("cloudDataLoaded", handler);
    return () => window.removeEventListener("cloudDataLoaded", handler);
  }, [runRecalc]);

  useEffect(() => {
    const handler = () => runRecalc("xpRecalcRequested");
    window.addEventListener("xpRecalcRequested", handler);
    return () => window.removeEventListener("xpRecalcRequested", handler);
  }, [runRecalc]);

  useEffect(() => {
    if (window.__levelBootDone) return;
    window.__levelBootDone = true;

    LS.checkDailyReset();
    LS.recomputeDailyXP();
    LS.processPendingXPQueue();
    refreshProfile();
    refreshQueue();

    const id = setInterval(
      () => {
        LS.checkDailyReset();
        LS.recomputeDailyXP();
        refreshQueue();
      },
      60 * 60 * 1000,
    );

    return () => clearInterval(id);
  }, [refreshProfile, refreshQueue]);

  useEffect(() => {
    const curr = animeData || [];
    const prev = prevAnimeRef.current;

    if (prev === null) {
      prevAnimeRef.current = curr;
      if (!initialCheckRef.current) {
        initialCheckRef.current = true;
        setTimeout(() => runRecalc("initialMount"), 1500);
      }
      return;
    }

    const prevMap = new Map(prev.map((a) => [a.id, a]));
    const currMap = new Map(curr.map((a) => [a.id, a]));

    prevMap.forEach((oldA, id) => {
      if (!currMap.has(id)) {
        LS.removeAnimeFromQueue(id);
        LS.removeAnimeFromCompletedHistory(id);
      }
    });

    const newCompleted = [];
    currMap.forEach((newA, id) => {
      const oldA = prevMap.get(id);

      if (!oldA) {
        if (newA.userStatus === "Completed") newCompleted.push(newA);
        return;
      }

      const changed =
        oldA.userStatus !== newA.userStatus ||
        oldA.progress !== newA.progress ||
        oldA.episodes !== newA.episodes;

      if (changed) {
        LS.processAnimeDelta(oldA, newA);
      }
    });

    if (newCompleted.length > 0) {
      LS.checkForDirectlyCompletedAnime(newCompleted);
    }

    if (prev.length !== curr.length) {
      runRecalc("animeCountChanged");
    }

    prevAnimeRef.current = curr;
    refreshProfile();
    refreshQueue();
  }, [animeData, refreshProfile, refreshQueue, runRecalc]);

  const awardXP = useCallback((anime, { oldAnime } = {}) => {
    return LS.processAnimeDelta(oldAnime || null, anime);
  }, []);

  const recalc = useCallback(() => {
    const total = LS.recalculateTotalExp();
    refreshProfile();
    refreshQueue();
    return total;
  }, [refreshProfile, refreshQueue]);

  const processQueue = useCallback(() => {
    const r = LS.processPendingXPQueue();
    refreshProfile();
    refreshQueue();
    return r;
  }, [refreshProfile, refreshQueue]);

  const refreshAll = useCallback(() => {
    refreshProfile();
    refreshQueue();
  }, [refreshProfile, refreshQueue]);

  const value = {
    profile,
    level: profile.level,
    title: profile.title,
    totalExp: profile.totalExp,
    queue,
    queueCount: queue.length,
    queueXP: queue.reduce((s, i) => s + (i.xp || 0), 0),
    todayXP,
    dailyLimit: LS.MAX_DAILY_XP,
    awardXP,
    recalc,
    processQueue,
    refreshAll,
    MAX_DAILY_XP: LS.MAX_DAILY_XP,
  };

  return (
    <LevelContext.Provider value={value}>{children}</LevelContext.Provider>
  );
}

export function useLevel() {
  const ctx = useContext(LevelContext);
  if (!ctx) throw new Error("useLevel must be used within LevelProvider");
  return ctx;
}
