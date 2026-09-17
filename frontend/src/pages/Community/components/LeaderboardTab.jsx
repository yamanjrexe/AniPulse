import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import LeaderboardFilters from "./LeaderboardFilters.jsx";
import LeaderboardList from "./LeaderboardList.jsx";

export default function LeaderboardTab() {
    const { user } = useAuth();
    const [mode, setMode] = useState(
        () => localStorage.getItem("leaderboardMode") || "friends",
    );
    const [stat, setStat] = useState(
        () => localStorage.getItem("leaderboardStat") || "level",
    );
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let list = [];
            if (mode === "friends") {
                const friendsRes = await api
                    .get("/friends/list")
                    .catch(() => []);
                const self = {
                    uid: "current",
                    name: user?.name || "You",
                    avatar: user?.avatar,
                    level: user?.level || 1,
                    title: user?.title || "Newbie",
                    totalXP: user?.totalXP || 0,
                    totalAnime: 0,
                    totalEpisodes: 0,
                    totalHours: 0,
                    isCurrentUser: true,
                };
                list = [
                    self,
                    ...(friendsRes || []).map((f) => ({
                        ...f,
                        isCurrentUser: false,
                    })),
                ];
            } else {
                const r = await api
                    .get(
                        `/ranking/global-paginated?limit=50&page=1&type=${stat}`,
                    )
                    .catch(() => ({ rankings: [] }));
                list = r.rankings || [];
            }
            setRows(sortRows(list, stat));
        } catch (e) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [mode, stat, user]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        localStorage.setItem("leaderboardMode", mode);
    }, [mode]);
    useEffect(() => {
        localStorage.setItem("leaderboardStat", stat);
    }, [stat]);

    const sortRows = (arr, key) => {
        const field =
            {
                level: "level",
                xp: "totalXP",
                anime: "totalAnime",
                hours: "totalHours",
            }[key] || "level";
        return [...arr].sort((a, b) => (b[field] || 0) - (a[field] || 0));
    };

    const selfRow = useMemo(() => rows.find((r) => r.isCurrentUser), [rows]);

    return (
        <div className="community-tab-content active">
            <div className="friend-leaderboard">
                <h3>
                    <i className="fas fa-chart-line" aria-hidden="true" />{" "}
                    Leaderboard
                </h3>
                <p className="leaderboard-subtitle">
                    Compare your stats with friends and the world!
                </p>

                <div className="leaderboard-mode-tabs">
                    <button
                        className={`leaderboard-mode-tab ${mode === "friends" ? "active" : ""}`}
                        onClick={() => setMode("friends")}
                    >
                        <i className="fas fa-user-friends" aria-hidden="true" />{" "}
                        <span>Friends</span>
                    </button>
                    <button
                        className={`leaderboard-mode-tab ${mode === "global" ? "active" : ""}`}
                        onClick={() => setMode("global")}
                    >
                        <i className="fas fa-globe" aria-hidden="true" />{" "}
                        <span>Global</span>
                    </button>
                </div>

                <LeaderboardFilters stat={stat} onChange={setStat} />

                {selfRow && mode === "friends" && (
                    <div className="your-stats-card">
                        <div className="your-stats-header">
                            <img
                                src={
                                    selfRow.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selfRow.name)}&background=6366F1&color=fff`
                                }
                                alt={selfRow.name}
                                className="your-avatar"
                            />
                            <div>
                                <h4>{selfRow.name}</h4>
                                <span className="your-level">
                                    {selfRow.title || "Newbie"} • Lv.
                                    {selfRow.level || 1}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <i
                            className="fas fa-spinner fa-spin"
                            aria-hidden="true"
                        />{" "}
                        Loading leaderboard...
                    </div>
                ) : (
                    <LeaderboardList rows={rows} stat={stat} />
                )}
            </div>
        </div>
    );
}
