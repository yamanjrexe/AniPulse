import React, { useMemo } from "react";

export default function RatingBehavior({ rated, avg }) {
    const data = useMemo(() => {
        if (!rated.length) {
            return {
                mostCommon: 0,
                mostCommonCount: 0,
                highestGenre: null,
                lowestGenre: null,
            };
        }

        const dist = {};
        rated.forEach((a) => {
            const s = Math.round(a.score);
            dist[s] = (dist[s] || 0) + 1;
        });
        const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
        const mostCommon = parseInt(sorted[0][0]);
        const mostCommonCount = sorted[0][1];

        const genreScores = {};
        rated.forEach((a) => {
            (a.genres || []).forEach((g) => {
                if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
                genreScores[g].total += a.score;
                genreScores[g].count++;
            });
        });
        const filtered = Object.entries(genreScores)
            .filter(([, d]) => d.count >= 2)
            .map(([genre, d]) => ({
                genre,
                avg: d.total / d.count,
                count: d.count,
            }))
            .sort((a, b) => b.avg - a.avg);

        const highestGenre = filtered[0] || null;
        const lowestGenre =
            filtered.length > 1 ? filtered[filtered.length - 1] : null;

        return { mostCommon, mostCommonCount, highestGenre, lowestGenre };
    }, [rated]);

    const cards = [
        {
            value: `${avg.toFixed(1)}★`,
            label: "Average Rating",
            detail: `from ${rated.length} ratings`,
        },
        {
            value: `${data.mostCommon}★`,
            label: "Most Common Rating",
            detail: `${data.mostCommonCount} times`,
        },
        {
            value: data.highestGenre?.genre || "—",
            label: "Highest Rated Genre",
            detail: data.highestGenre
                ? `${data.highestGenre.avg.toFixed(1)}★ from ${data.highestGenre.count} anime`
                : "No data",
        },
        {
            value: data.lowestGenre?.genre || "—",
            label: "Lowest Rated Genre",
            detail: data.lowestGenre
                ? `${data.lowestGenre.avg.toFixed(1)}★ from ${data.lowestGenre.count} anime`
                : "No data",
        },
    ];

    return (
        <div className="rating-card insights-card">
            <div className="rating-card-header">
                <div className="rating-card-title">
                    <i className="fas fa-brain" /> Rating Behavior
                </div>
                <span className="rating-card-badge">Insights</span>
            </div>
            <div className="rating-behavior-grid">
                {cards.map((c, i) => (
                    <div key={i} className="behavior-card">
                        <span className="behavior-value">{c.value}</span>
                        <span className="behavior-label">{c.label}</span>
                        <span className="behavior-detail">{c.detail}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
