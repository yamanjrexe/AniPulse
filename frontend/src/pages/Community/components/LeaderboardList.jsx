import React from "react";

const fmt = (n) => {
    if (n == null) return "0";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
};

export default function LeaderboardList({ rows, stat }) {
    if (!rows.length) {
        return (
            <div className="leaderboard-empty">
                <i className="fas fa-users" aria-hidden="true" />
                <h4>No users to show</h4>
                <p>Check back later</p>
            </div>
        );
    }

    const displayStat = (r) => {
        switch (stat) {
            case "level":
                return `Lv.${r.level || 1}`;
            case "xp":
                return `${fmt(r.totalXP || 0)} XP`;
            case "anime":
                return `${fmt(r.totalAnime || 0)} anime`;
            case "hours":
                return `${fmt(r.totalHours || 0)} hrs`;
            default:
                return `Lv.${r.level || 1}`;
        }
    };

    return (
        <div className="leaderboard-list">
            {rows.map((r, i) => {
                const rank = i + 1;
                const medal =
                    rank === 1
                        ? "🥇"
                        : rank === 2
                          ? "🥈"
                          : rank === 3
                            ? "🥉"
                            : `#${rank}`;
                const isCurrent = r.isCurrentUser || r.uid === "current";

                // ⚡ Use 'current' as the uid marker for self — UserProfileModal handles it
                const clickUid = isCurrent ? "current" : r.uid;

                return (
                    <div
                        key={r.uid || i}
                        className={`leaderboard-item ${isCurrent ? "current-user" : ""}`}
                        onClick={() => window.openUserProfile?.(clickUid)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className={`leaderboard-rank top-${rank}`}>
                            {medal}
                        </div>
                        <div className="leaderboard-user">
                            <img
                                src={
                                    r.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || "User")}&background=6366F1&color=fff`
                                }
                                alt={r.name}
                                className="leaderboard-avatar"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || "User")}&background=6366F1&color=fff`;
                                }}
                            />
                            <div className="leaderboard-info">
                                <div className="leaderboard-name">
                                    {r.name || "User"}
                                    {isCurrent && (
                                        <span className="leaderboard-you-badge">
                                            You
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="leaderboard-value">
                            {displayStat(r)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
