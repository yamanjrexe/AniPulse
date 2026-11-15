import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useLevel } from "../../../context/LevelContext.jsx";
import LeaderboardFilters from "./LeaderboardFilters.jsx";
import LeaderboardList from "./LeaderboardList.jsx";

const CACHE_PREFIX = "leaderboardCache:v2:";
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(mode, stat) {
  return `${CACHE_PREFIX}${mode}:${stat}`;
}

function readCache(mode, stat) {
  try {
    const raw = localStorage.getItem(cacheKey(mode, stat));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(mode, stat, rows) {
  try {
    localStorage.setItem(
      cacheKey(mode, stat),
      JSON.stringify({ rows, timestamp: Date.now() }),
    );
  } catch (_) {}
}

function sortRows(arr, key) {
  const field =
    {
      level: "level",
      xp: "totalXP",
      anime: "totalAnime",
      hours: "totalHours",
    }[key] || "level";
  return [...arr].sort((a, b) => (b[field] || 0) - (a[field] || 0));
}

export default function LeaderboardTab() {
  const { user } = useAuth();
  const { animeData } = useAnime();
  const { level: myLevel, title: myTitle, totalExp: myTotalExp } = useLevel();

  const [mode, setMode] = useState(
    () => localStorage.getItem("leaderboardMode") || "friends",
  );
  const [stat, setStat] = useState(
    () => localStorage.getItem("leaderboardStat") || "level",
  );

  const initialCache = readCache(mode, stat);
  const [rows, setRows] = useState(initialCache?.rows || []);
  const [loading, setLoading] = useState(!initialCache);

  const selfStats = useMemo(() => {
    const completed = animeData.filter((a) => a.userStatus === "Completed");
    let totalEpisodes = 0;
    let totalMinutes = 0;
    completed.forEach((a) => {
      if (a.type === "Movie") {
        totalEpisodes += 1;
        totalMinutes += a.duration || 120;
      } else {
        const eps = a.episodes || 0;
        totalEpisodes += eps;
        totalMinutes += eps * (a.duration || 20);
      }
    });
    return {
      totalAnime: completed.length,
      totalEpisodes,
      totalHours: Math.round(totalMinutes / 60),
    };
  }, [animeData]);

  const self = useMemo(
    () => ({
      uid: "current",
      name: user?.name || "You",
      avatar: user?.avatar,
      level: myLevel || 1,
      title: myTitle || "Rookie",
      totalXP: myTotalExp || 0,
      totalAnime: selfStats.totalAnime,
      totalEpisodes: selfStats.totalEpisodes,
      totalHours: selfStats.totalHours,
      isCurrentUser: true,
    }),
    [user, myLevel, myTitle, myTotalExp, selfStats],
  );

  const load = useCallback(
    async (targetMode, targetStat) => {
      const cached = readCache(targetMode, targetStat);

      if (cached?.rows?.length) {
        const withoutSelf = cached.rows.filter((r) => !r.isCurrentUser);
        setRows(
          targetMode === "friends"
            ? sortRows([self, ...withoutSelf], targetStat)
            : withoutSelf,
        );
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        let list = [];
        if (targetMode === "friends") {
          const friendsRes = await api.get("/friends/list").catch(() => []);
          list = [
            self,
            ...(friendsRes || []).map((f) => ({ ...f, isCurrentUser: false })),
          ];
        } else {
          const r = await api
            .get(`/ranking/global-paginated?limit=50&page=1&type=${targetStat}`)
            .catch(() => ({ rankings: [] }));
          list = r.rankings || [];
        }

        const sorted = sortRows(list, targetStat);
        setRows(sorted);
        writeCache(
          targetMode,
          targetStat,
          sorted.filter((r) => !r.isCurrentUser),
        );
      } catch (_) {
        if (!cached) setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [self],
  );

  useEffect(() => {
    load(mode, stat);
  }, [mode, stat, load]);

  useEffect(() => {
    localStorage.setItem("leaderboardMode", mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem("leaderboardStat", stat);
  }, [stat]);

  const selfRow = useMemo(() => rows.find((r) => r.isCurrentUser), [rows]);

  return (
    <div className="community-tab-content active">
      <div className="friend-leaderboard">
        <h3>
          <i className="fas fa-chart-line" aria-hidden="true" /> Leaderboard
        </h3>
        <p className="leaderboard-subtitle">
          Compare your stats with friends and the world.
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
                  {selfRow.title || "Rookie"} • Lv.
                  {selfRow.level || 1}
                </span>
              </div>
            </div>
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Loading
            leaderboard...
          </div>
        ) : (
          <LeaderboardList rows={rows} stat={stat} />
        )}
      </div>
    </div>
  );
}
