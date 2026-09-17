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

    // ─── Refresh helpers ───
    const refreshProfile = useCallback(() => {
        const p = LS.getUserProfile();
        setProfile({ ...p });
    }, []);

    const refreshQueue = useCallback(() => {
        setQueue(LS.getPendingXPQueue());
        setTodayXP(LS.getTodayXP());
    }, []);

    // ─── Event listeners ───
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

    // ⚡ Global UI refresh — re-read profile + queue
    useEffect(() => {
        const handler = () => {
            try {
                refreshProfile();
                refreshQueue();
                console.log("[LevelContext] Refreshed profile + queue");
            } catch (err) {
                console.warn("[LevelContext] Refresh failed:", err);
            }
        };
        window.addEventListener("uiRefresh", handler);
        return () => window.removeEventListener("uiRefresh", handler);
    }, [refreshProfile, refreshQueue]);

    // ─── Boot: daily reset check + queue processing ───
    useEffect(() => {
        if (window.__levelBootDone) return;
        window.__levelBootDone = true;

        LS.checkDailyReset();
        LS.processPendingXPQueue();
        refreshProfile();
        refreshQueue();

        const id = setInterval(
            () => {
                LS.checkDailyReset();
                refreshQueue();
            },
            60 * 60 * 1000,
        );

        return () => clearInterval(id);
    }, [refreshProfile, refreshQueue]);

    // ─── Watch animeData for changes ───
    useEffect(() => {
        const curr = animeData || [];
        const prev = prevAnimeRef.current;

        // First snapshot — run once after cloud load settles
        if (prev === null) {
            prevAnimeRef.current = curr;
            if (!initialCheckRef.current) {
                initialCheckRef.current = true;
                setTimeout(() => {
                    try {
                        if (curr.length > 0) {
                            const currentProfile = LS.getUserProfile();
                            const computed =
                                LS.calculateTotalExpFromAnimeList(curr);

                            if (
                                computed > 0 &&
                                computed !== currentProfile.totalExp
                            ) {
                                console.log(
                                    `[LevelContext] Recalc: stored=${currentProfile.totalExp}, computed=${computed}`,
                                );
                                currentProfile.totalExp = computed;
                                LS.saveUserProfile(currentProfile);
                            }
                        }

                        LS.checkForDirectlyCompletedAnime(curr);
                        refreshProfile();
                    } catch (err) {
                        console.warn(
                            "[LevelContext] Initial check failed:",
                            err,
                        );
                    }
                }, 1500);
            }
            return;
        }

        // ─── Diff map ───
        const prevMap = new Map(prev.map((a) => [a.id, a]));
        const currMap = new Map(curr.map((a) => [a.id, a]));

        // Deletions
        prevMap.forEach((oldA, id) => {
            if (!currMap.has(id)) {
                LS.removeAnimeFromQueue(id);
                LS.removeAnimeFromCompletedHistory(id);
            }
        });

        // Additions & updates
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

        // First-data-load safety: recalc once from anime list
        if (prev.length === 0 && curr.length > 0) {
            LS.recalculateTotalExp();
        }

        prevAnimeRef.current = curr;
        refreshProfile();
        refreshQueue();
    }, [animeData, refreshProfile, refreshQueue]);

    // ─── Public API ───
    const awardXP = useCallback((anime, { oldAnime } = {}) => {
        return LS.processAnimeDelta(oldAnime || null, anime);
    }, []);

    const recalc = useCallback(() => {
        const total = LS.recalculateTotalExp();
        refreshProfile();
        return total;
    }, [refreshProfile]);

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
