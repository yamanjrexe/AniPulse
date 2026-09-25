import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../services/api.js";

const FILTERS = [
  { k: "level", i: "fa-chart-line", l: "Level" },
  { k: "xp", i: "fa-star", l: "XP" },
  { k: "anime", i: "fa-tv", l: "Anime" },
  { k: "hours", i: "fa-clock", l: "Hours" },
];

const CACHE_PREFIX = "leaderboardCache:";
const CACHE_TTL = 5 * 60 * 1000; // show cached instantly, refresh in bg

function cacheKey(stat) {
  return `${CACHE_PREFIX}${stat}`;
}

function readCache(stat) {
  try {
    const raw = localStorage.getItem(cacheKey(stat));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(stat, rows) {
  try {
    localStorage.setItem(
      cacheKey(stat),
      JSON.stringify({ rows, timestamp: Date.now() }),
    );
  } catch (_) {}
}

function compact(n) {
  if (n == null) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function Leaderboard() {
  const [stat, setStat] = useState(
    () => localStorage.getItem("leaderboardStat") || "level",
  );

  const initialCache = readCache(stat);
  const [rows, setRows] = useState(initialCache?.rows || []);
  const [loading, setLoading] = useState(!initialCache);
  const [errored, setErrored] = useState(false);
  const reqIdRef = useRef(0);

  const load = useCallback(async (targetStat, { silent = false } = {}) => {
    const myReqId = ++reqIdRef.current;
    if (!silent && !readCache(targetStat)) {
      setLoading(true);
      setErrored(false);
    }
    try {
      const r = await api
        .get(`/ranking/global-paginated?limit=50&page=1&type=${targetStat}`)
        .catch(() => null);

      if (myReqId !== reqIdRef.current) return; // stale

      const fresh = r?.rankings || [];
      if (fresh.length > 0) {
        setRows(fresh);
        writeCache(targetStat, fresh);
      } else {
        const cached = readCache(targetStat);
        setRows(cached?.rows || []);
      }
      setErrored(false);
    } catch (_) {
      if (myReqId !== reqIdRef.current) return;
      const cached = readCache(targetStat);
      setRows(cached?.rows || []);
      setErrored(true);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  // On mount and on stat change: paint cached instantly, fetch in bg
  useEffect(() => {
    const cached = readCache(stat);
    if (cached?.rows?.length) {
      setRows(cached.rows);
      setLoading(false);
      load(stat, { silent: true });
    } else {
      setRows([]);
      load(stat);
    }
    localStorage.setItem("leaderboardStat", stat);
  }, [stat, load]);

  // Warm the backend on mount so the next navigation is fast
  useEffect(() => {
    fetch(`${window.API_BASE_URL}/api/health`).catch(() => {});
  }, []);

  const displayValue = (u) => {
    switch (stat) {
      case "level":
        return `Lv.${u.level || 1}`;
      case "xp":
        return `${compact(u.totalXP || 0)} XP`;
      case "anime":
        return `${compact(u.totalAnime || 0)} anime`;
      case "hours":
        return `${compact(u.totalHours || 0)} hrs`;
      default:
        return `Lv.${u.level || 1}`;
    }
  };

  const openProfile = (uid) => {
    if (window.openUserProfile) window.openUserProfile(uid);
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const showSkeleton = loading && rows.length === 0;

  return (
    <div className="dashboard-section leaderboard-page">
      <h2 className="section-title">
        <i className="fas fa-trophy" aria-hidden="true" /> Leaderboard
      </h2>

      <div className="leaderboard-filters">
        {FILTERS.map((f) => (
          <button
            key={f.k}
            type="button"
            className={`leaderboard-filter-btn ${stat === f.k ? "active" : ""}`}
            onClick={() => setStat(f.k)}
          >
            <i className={`fas ${f.i}`} aria-hidden="true" /> {f.l}
          </button>
        ))}
      </div>

      {showSkeleton && (
        <div className="lb-skeleton">
          <div className="lb-skeleton-podium">
            <div className="lb-skeleton-avatar lb-skeleton-podium-mid" />
            <div className="lb-skeleton-avatar lb-skeleton-podium-tall" />
            <div className="lb-skeleton-avatar lb-skeleton-podium-mid" />
          </div>
          <div className="lb-skeleton-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="lb-skeleton-row">
                <div className="lb-skeleton-bar lb-skeleton-rank" />
                <div className="lb-skeleton-avatar-sm" />
                <div className="lb-skeleton-bar lb-skeleton-name" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!showSkeleton && rows.length === 0 && (
        <div className="leaderboard-empty">
          <i className="fas fa-users" aria-hidden="true" />
          <h4>{errored ? "Couldn't load leaderboard" : "No users yet"}</h4>
          <p>
            {errored
              ? "Check your connection and try again."
              : "Check back later"}
          </p>
          {errored && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => load(stat)}
              style={{ marginTop: 16 }}
            >
              <i className="fas fa-sync-alt" /> Retry
            </button>
          )}
        </div>
      )}

      {!showSkeleton && top3.length > 0 && (
        <div className="lb-podium">
          {[1, 0, 2].map((slotIdx) => {
            const u = top3[slotIdx];
            if (!u) return null;
            const rank = slotIdx + 1;
            return (
              <div
                key={u.uid || slotIdx}
                className={`lb-podium-slot lb-rank-${rank}`}
                onClick={() => openProfile(u.uid)}
              >
                <div className="lb-podium-rank">#{rank}</div>
                <img
                  src={
                    u.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=6366F1&color=fff&bold=true&size=200`
                  }
                  alt={u.name}
                  className="lb-podium-avatar"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=6366F1&color=fff&bold=true&size=200`;
                  }}
                />
                <div className="lb-podium-name">{u.name || "User"}</div>
                <div className="lb-podium-value">{displayValue(u)}</div>
              </div>
            );
          })}
        </div>
      )}

      {!showSkeleton && rest.length > 0 && (
        <div className="lb-grid">
          {rest.map((u, i) => (
            <div
              key={u.uid || i}
              className="lb-grid-item"
              onClick={() => openProfile(u.uid)}
            >
              <div className="lb-grid-rank">#{i + 4}</div>
              <img
                src={
                  u.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=6366F1&color=fff&bold=true&size=200`
                }
                alt={u.name}
                className="lb-grid-avatar"
                loading="lazy"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=6366F1&color=fff&bold=true&size=200`;
                }}
              />
              <div className="lb-grid-info">
                <div className="lb-grid-name">{u.name || "User"}</div>
                <div className="lb-grid-value">{displayValue(u)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
