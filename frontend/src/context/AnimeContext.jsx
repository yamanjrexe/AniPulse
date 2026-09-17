import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";

const AnimeContext = createContext(null);

export function AnimeProvider({ children }) {
    const [animeData, setAnimeDataRaw] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("animeData") || "[]");
        } catch {
            return [];
        }
    });

    const [activityLog, setActivityLog] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("activityLog") || "[]");
        } catch {
            return [];
        }
    });

    const broadcastRef = useRef(null);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem("animeData", JSON.stringify(animeData));
    }, [animeData]);

    useEffect(() => {
        localStorage.setItem("activityLog", JSON.stringify(activityLog));
    }, [activityLog]);

    // Cross-tab sync
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "animeData" && e.newValue) {
                try {
                    setAnimeDataRaw(JSON.parse(e.newValue));
                } catch (_) {}
            }
            if (e.key === "activityLog" && e.newValue) {
                try {
                    setActivityLog(JSON.parse(e.newValue));
                } catch (_) {}
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Global UI refresh — re-read from localStorage
    useEffect(() => {
        const handler = () => {
            try {
                const freshAnime = JSON.parse(
                    localStorage.getItem("animeData") || "[]",
                );
                const freshActivity = JSON.parse(
                    localStorage.getItem("activityLog") || "[]",
                );
                setAnimeDataRaw(freshAnime);
                setActivityLog(freshActivity);
                console.log(
                    "[AnimeContext] Refreshed:",
                    freshAnime.length,
                    "anime",
                );
            } catch (err) {
                console.warn("[AnimeContext] Refresh failed:", err);
            }
        };
        window.addEventListener("uiRefresh", handler);
        return () => window.removeEventListener("uiRefresh", handler);
    }, []);

    const setAnimeData = useCallback((updater) => {
        setAnimeDataRaw((prev) => {
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            window.dispatchEvent(new CustomEvent("animeUpdate"));
            if (broadcastRef.current) clearTimeout(broadcastRef.current);
            broadcastRef.current = setTimeout(() => {
                window.dispatchEvent(new CustomEvent("syncSchedule"));
            }, 2000);
            return next;
        });
    }, []);

    const logActivity = useCallback((action, animeTitle) => {
        setActivityLog((prev) => {
            const entry = {
                id: Date.now(),
                action,
                animeTitle,
                timestamp: new Date().toISOString(),
            };
            return [entry, ...prev].slice(0, 50);
        });
    }, []);

    return (
        <AnimeContext.Provider
            value={{
                animeData,
                setAnimeData,
                activityLog,
                setActivityLog,
                logActivity,
            }}
        >
            {children}
        </AnimeContext.Provider>
    );
}

export function useAnime() {
    const ctx = useContext(AnimeContext);
    if (!ctx) throw new Error("useAnime must be used within AnimeProvider");
    return ctx;
}
