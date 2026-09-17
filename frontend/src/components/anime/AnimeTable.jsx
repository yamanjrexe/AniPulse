import React from "react";

const fmtDate = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function AnimeTable({ items, onEdit }) {
    if (!items.length) {
        return (
            <div className="table-container">
                <table className="anime-table">
                    <tbody>
                        <tr>
                            <td colSpan={6} className="no-anime">
                                No anime found matching your filters.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="anime-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((a) => {
                        const pct = a.episodes
                            ? Math.round(((a.progress || 0) / a.episodes) * 100)
                            : 0;
                        const statusClass =
                            {
                                Completed: "badge-completed",
                                Watching: "badge-watching",
                                "Plan to Watch": "badge-plan",
                                Dropped: "badge-dropped",
                            }[a.userStatus] || "badge-plan";
                        const dateStr =
                            a.userStatus === "Completed"
                                ? fmtDate(a.actualFinishDate || a.finishDate)
                                : "-";
                        return (
                            <tr
                                key={a.id}
                                onClick={() => onEdit?.(a)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>
                                    <div className="anime-title-cell">
                                        <img
                                            src={
                                                a.cover ||
                                                "https://placehold.co/50x70/6a5acd/white?text=No+Image"
                                            }
                                            alt={a.title}
                                            className="anime-cover"
                                            onError={(e) => {
                                                e.target.src =
                                                    "https://placehold.co/50x70/6a5acd/white?text=No+Image";
                                            }}
                                        />
                                        <div className="anime-info">
                                            <div className="anime-title">
                                                {a.title}
                                            </div>
                                            {a.genres?.length > 0 && (
                                                <div className="anime-genres">
                                                    {a.genres
                                                        .slice(0, 3)
                                                        .map((g) => (
                                                            <span key={g}>
                                                                {g}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>{a.type || "TV"}</td>
                                <td>
                                    <div className="progress-wrapper">
                                        <div className="progress-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <small>
                                            {a.progress || 0}/
                                            {a.episodes || "?"} ({pct}%)
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${statusClass}`}>
                                        {a.userStatus}
                                    </span>
                                </td>
                                <td>
                                    {a.score ? (
                                        <span className="anime-score">
                                            {parseFloat(a.score).toFixed(1)}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td>{dateStr}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
