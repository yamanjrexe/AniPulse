import React, { useMemo } from "react";
import { PolarArea } from "react-chartjs-2";
import "../../../../src/components/charts/ChartSetup.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useTheme } from "../../../context/ThemeContext.jsx";
import RatingBehavior from "./RatingBehavior.jsx";
import RatingPersonality from "./RatingPersonality.jsx";

export default function RatingAnalytics() {
    const { animeData } = useAnime();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const text = isDark ? "#94a3b8" : "#64748b";

    const analytics = useMemo(() => {
        const rated = animeData.filter((a) => a.score > 0);
        const total = rated.length;

        if (!total)
            return {
                total: 0,
                buckets: [0, 0, 0, 0, 0, 0],
                avg: 0,
                median: 0,
                spread: 0,
            };

        const buckets = [0, 0, 0, 0, 0, 0];
        rated.forEach((a) => {
            const s = a.score;
            if (s === 10) buckets[0]++;
            else if (s >= 9) buckets[1]++;
            else if (s >= 8) buckets[2]++;
            else if (s >= 7) buckets[3]++;
            else if (s >= 6) buckets[4]++;
            else buckets[5]++;
        });

        const avg = rated.reduce((s, a) => s + a.score, 0) / total;
        const scores = rated.map((a) => a.score).sort((a, b) => a - b);
        const median = scores[Math.floor(scores.length / 2)];
        const spread = scores[scores.length - 1] - scores[0];

        return { total, buckets, avg, median, spread, rated };
    }, [animeData]);

    return (
        <div className="rating-analytics">
            <div className="rating-header">
                <div className="rating-header-left">
                    <h2 className="rating-title">
                        <i className="fas fa-star" /> Rating Analytics
                    </h2>
                </div>
                <div className="rating-header-right">
                    <span className="rating-total">{analytics.total}</span>
                    <span className="rating-total-label">Total Ratings</span>
                </div>
            </div>

            <div className="rating-grid">
                <div className="rating-card chart-card">
                    <div className="rating-card-header">
                        <div className="rating-card-title">
                            <i className="fas fa-chart-bar" /> Score
                            Distribution
                        </div>
                        <span className="rating-card-badge">Histogram</span>
                    </div>
                    <div
                        className="rating-chart-container"
                        style={{ height: 320 }}
                    >
                        {analytics.total === 0 ? (
                            <NoData />
                        ) : (
                            <PolarArea
                                data={{
                                    labels: [
                                        "10",
                                        "9",
                                        "8",
                                        "7",
                                        "6",
                                        "5 or less",
                                    ],
                                    datasets: [
                                        {
                                            data: analytics.buckets,
                                            backgroundColor: [
                                                "rgba(139,92,246,0.8)",
                                                "rgba(16,185,129,0.8)",
                                                "rgba(245,158,11,0.8)",
                                                "rgba(239,68,68,0.8)",
                                                "rgba(59,130,246,0.8)",
                                                "rgba(156,163,175,0.8)",
                                            ],
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: "right",
                                            labels: { color: text },
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>

                <RatingBehavior
                    rated={analytics.rated || []}
                    avg={analytics.avg}
                />
            </div>

            <RatingPersonality
                avg={analytics.avg}
                median={analytics.median}
                spread={analytics.spread}
                buckets={analytics.buckets}
                total={analytics.total}
            />
        </div>
    );
}

function NoData() {
    return (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <i
                className="fas fa-star"
                style={{
                    fontSize: 32,
                    display: "block",
                    marginBottom: 12,
                    opacity: 0.3,
                }}
            />
            Start rating anime to see your analytics here.
        </div>
    );
}
