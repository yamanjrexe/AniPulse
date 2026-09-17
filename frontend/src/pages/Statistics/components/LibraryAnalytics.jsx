import React, { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "../../../../src/components/charts/ChartSetup.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useTheme } from "../../../context/ThemeContext.jsx";

const PALETTE = [
    "#ef4444",
    "#3b82f6",
    "#facc15",
    "#a855f7",
    "#10b981",
    "#ec4899",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#14b8a6",
];

export default function LibraryAnalytics() {
    const { animeData } = useAnime();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const text = isDark ? "#94a3b8" : "#64748b";
    const grid = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

    const total = animeData.length;

    const genreData = useMemo(() => {
        const g = {};
        animeData.forEach((a) =>
            (a.genres || []).forEach((x) => {
                g[x] = (g[x] || 0) + 1;
            }),
        );
        const sorted = Object.entries(g)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        return {
            labels: sorted.map((s) => s[0]),
            values: sorted.map((s) => s[1]),
            map: g,
        };
    }, [animeData]);

    const formatData = useMemo(() => {
        const t = {};
        animeData.forEach((a) => {
            const k = a.type || "TV";
            t[k] = (t[k] || 0) + 1;
        });
        return { labels: Object.keys(t), values: Object.values(t), map: t };
    }, [animeData]);

    const insights = useMemo(() => {
        const topGenre = genreData.labels[0];
        const topGenreCount = genreData.values[0] || 0;
        const secondGenre = genreData.labels[1];
        const secondGenreCount = genreData.values[1] || 0;

        const topFormat = formatData.labels[0];
        const topFormatCount = formatData.values[0] || 0;

        const uniq = genreData.labels.length;
        const completed = animeData.filter(
            (a) => a.userStatus === "Completed",
        ).length;
        const completionRate = total
            ? Math.round((completed / total) * 100)
            : 0;

        return {
            topGenre,
            topGenreCount,
            secondGenre,
            secondGenreCount,
            topFormat,
            topFormatCount,
            uniq,
            completed,
            completionRate,
        };
    }, [genreData, formatData, animeData, total]);

    return (
        <div className="library-analytics">
            <div className="analytics-header">
                <div className="analytics-header-left">
                    <h2 className="analytics-title">
                        <i className="fas fa-layer-group" /> Library Analytics
                    </h2>
                </div>
                <div className="analytics-header-right">
                    <span className="analytics-total">{total}</span>
                    <span className="analytics-total-label">Total Entries</span>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="analytics-card chart-card">
                    <div className="analytics-card-header">
                        <div className="analytics-card-title">
                            <i className="fas fa-tags" /> Genre Distribution
                        </div>
                        <span className="analytics-card-badge">Top 10</span>
                    </div>
                    <div
                        className="analytics-chart-container"
                        style={{ height: 320 }}
                    >
                        <Bar
                            data={{
                                labels: genreData.labels,
                                datasets: [
                                    {
                                        label: "Anime",
                                        data: genreData.values,
                                        backgroundColor: PALETTE,
                                        borderRadius: 8,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: "y",
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: {
                                        beginAtZero: true,
                                        grid: { color: grid },
                                        ticks: { color: text, stepSize: 1 },
                                    },
                                    y: {
                                        grid: { display: false },
                                        ticks: { color: text },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="analytics-card chart-card">
                    <div className="analytics-card-header">
                        <div className="analytics-card-title">
                            <i className="fas fa-film" /> Format Distribution
                        </div>
                        <span className="analytics-card-badge">Overview</span>
                    </div>
                    <div
                        className="analytics-chart-container"
                        style={{ height: 320 }}
                    >
                        <Doughnut
                            data={{
                                labels: formatData.labels,
                                datasets: [
                                    {
                                        data: formatData.values,
                                        backgroundColor: [
                                            "#6a5acd",
                                            "#70db70",
                                            "#20b2aa",
                                            "#ff7f50",
                                            "#48bb78",
                                            "#f59e0b",
                                        ],
                                        borderWidth: 3,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: "60%",
                                plugins: {
                                    legend: {
                                        position: "right",
                                        labels: {
                                            color: text,
                                            padding: 20,
                                            usePointStyle: true,
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="insights-panel">
                <div className="insights-header">
                    <h3 className="insights-title">
                        <i className="fas fa-lightbulb" /> Library Insights
                    </h3>
                    <span className="insights-subtitle">
                        Key takeaways from your collection
                    </span>
                </div>
                <div className="insights-grid">
                    <InsightCard
                        icon="fa-trophy"
                        cls="genre"
                        value={insights.topGenre || "—"}
                        label="Most Watched Genre"
                        detail={`${insights.topGenreCount} anime`}
                    />
                    <InsightCard
                        icon="fa-medal"
                        cls="second"
                        value={insights.secondGenre || "—"}
                        label="Second Favorite"
                        detail={`${insights.secondGenreCount} anime`}
                    />
                    <InsightCard
                        icon="fa-tv"
                        cls="format"
                        value={insights.topFormat || "—"}
                        label="Preferred Format"
                        detail={`${insights.topFormatCount} anime`}
                    />
                    <InsightCard
                        icon="fa-shield-alt"
                        cls="diversity"
                        value={
                            insights.uniq >= 12
                                ? "High"
                                : insights.uniq >= 5
                                  ? "Medium"
                                  : "Low"
                        }
                        label="Library Diversity"
                        detail={`${insights.uniq} genres`}
                    />
                    <InsightCard
                        icon="fa-check-circle"
                        cls="completion"
                        value={`${insights.completionRate}%`}
                        label="Completion Rate"
                        detail={`${insights.completed} completed`}
                    />
                    <InsightCard
                        icon="fa-palette"
                        cls="genres"
                        value={insights.uniq}
                        label="Unique Genres"
                        detail="in your library"
                    />
                </div>
            </div>
        </div>
    );
}

function InsightCard({ icon, cls, value, label, detail }) {
    return (
        <div className="insight-card">
            <div className={`insight-icon ${cls}`}>
                <i className={`fas ${icon}`} aria-hidden="true" />
            </div>
            <div className="insight-content">
                <span className="insight-value">{value}</span>
                <span className="insight-label">{label}</span>
                <span className="insight-detail">{detail}</span>
            </div>
        </div>
    );
}
