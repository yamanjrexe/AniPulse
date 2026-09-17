import React from "react";

const FILTERS = [
    { k: "level", i: "fa-chart-line", l: "Level" },
    { k: "xp", i: "fa-star", l: "Total XP" },
    { k: "anime", i: "fa-tv", l: "Anime" },
    { k: "hours", i: "fa-clock", l: "Hours" },
];

export default function LeaderboardFilters({ stat, onChange }) {
    return (
        <div className="leaderboard-filters">
            {FILTERS.map((f) => (
                <button
                    key={f.k}
                    className={`leaderboard-filter-btn ${stat === f.k ? "active" : ""}`}
                    onClick={() => onChange(f.k)}
                >
                    <i className={`fas ${f.i}`} aria-hidden="true" /> {f.l}
                </button>
            ))}
        </div>
    );
}
