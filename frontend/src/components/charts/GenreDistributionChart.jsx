import React, { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "./ChartSetup.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

// 24 distinct colors — one per genre for typical libraries.
// If a user has more than 24 genres, extra ones get golden-angle HSL
// colors that are still unique and readable.
const PALETTE = [
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#ef4444", // red
    "#84cc16", // lime
    "#f97316", // orange
    "#a855f7", // purple
    "#14b8a6", // teal
    "#eab308", // yellow
    "#6366f1", // indigo
    "#f43f5e", // rose
    "#22c55e", // green
    "#0ea5e9", // sky
    "#d946ef", // fuchsia
    "#fb7185", // rose-light
    "#fbbf24", // amber-light
    "#34d399", // emerald-light
    "#38bdf8", // sky-light
    "#c084fc", // purple-light
    "#fb923c", // orange-light
    "#a3e635", // lime-light
];

function colorFor(index) {
    if (index < PALETTE.length) return PALETTE[index];
    // Golden-angle HSL for the rare 25th+ genre
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue}, 65%, 58%)`;
}

function getCompletionTime(anime) {
    const iso = (s) => {
        if (!s) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
        if (/^\d{4}-\d{2}$/.test(s)) {
            const [y, m] = s.split("-").map(Number);
            return new Date(y, m - 1, 15);
        }
        const d = new Date(s);
        return isNaN(d) ? null : d;
    };

    return (
        iso(anime.actualFinishDate) ||
        iso(anime.finishDate) ||
        (anime.completedTimestamp
            ? new Date(anime.completedTimestamp)
            : null) ||
        iso(anime.updatedAt)
    );
}

export default function GenreDistributionChart({ animeData }) {
    const { theme } = useTheme();
    const [filter, setFilter] = useState("month");
    const [hidden, setHidden] = useState(() => new Set());

    const { labels, values, colors, total } = useMemo(() => {
        const now = new Date();
        const cm = now.getMonth();
        const cy = now.getFullYear();
        const lm = cm === 0 ? 11 : cm - 1;
        const ly = cm === 0 ? cy - 1 : cy;

        const counts = {};

        (animeData || []).forEach((a) => {
            if (a.userStatus !== "Completed") return;
            const dt = getCompletionTime(a);
            if (!dt) return;

            let include = false;
            switch (filter) {
                case "month":
                    include = dt.getMonth() === cm && dt.getFullYear() === cy;
                    break;
                case "lastMonth":
                    include = dt.getMonth() === lm && dt.getFullYear() === ly;
                    break;
                case "year":
                    include = dt.getFullYear() === cy;
                    break;
                default:
                    include = true;
            }
            if (!include) return;

            (a.genres || []).forEach((g) => {
                if (!g) return;
                counts[g] = (counts[g] || 0) + 1;
            });
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const totalCount = sorted.reduce((s, [, c]) => s + c, 0);

        return {
            labels: sorted.map(([g]) => g),
            values: sorted.map(([, c]) => c),
            colors: sorted.map((_, i) => colorFor(i)),
            total: totalCount,
        };
    }, [animeData, filter]);

    // Reset hidden state whenever the filter changes
    React.useEffect(() => {
        setHidden(new Set());
    }, [filter]);

    const toggleSlice = (index) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const displayValues = values.map((v, i) => (hidden.has(i) ? 0 : v));
    const displayColors = colors.map((c, i) =>
        hidden.has(i) ? "transparent" : c,
    );

    const isDark = theme === "dark";
    const textColor = isDark ? "#F8FAFC" : "#0F172A";

    return (
        <>
            <div className="genre-filter-buttons">
                {[
                    { k: "month", l: "This Month" },
                    { k: "lastMonth", l: "Last Month" },
                    { k: "year", l: "This Year" },
                    { k: "all", l: "All Time" },
                ].map((o) => (
                    <button
                        key={o.k}
                        type="button"
                        className={`genre-filter-btn ${filter === o.k ? "active" : ""}`}
                        onClick={() => setFilter(o.k)}
                    >
                        {o.l}
                    </button>
                ))}
            </div>

            {labels.length === 0 ? (
                <div className="no-data-message" style={{ display: "flex" }}>
                    <i className="fas fa-chart-pie" />
                    <p>No completed anime found for this period.</p>
                </div>
            ) : (
                <div className="genre-chart-layout">
                    {/* Doughnut — Chart.js's own legend is disabled */}
                    <div className="genre-chart-canvas">
                        <Doughnut
                            data={{
                                labels,
                                datasets: [
                                    {
                                        data: displayValues,
                                        backgroundColor: displayColors,
                                        borderColor: isDark
                                            ? "rgba(15, 23, 42, 0.9)"
                                            : "rgba(255, 255, 255, 0.9)",
                                        borderWidth: 2,
                                        hoverOffset: 8,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: "58%",
                                layout: { padding: 6 },
                                plugins: {
                                    legend: { display: false }, // <- use our own
                                    tooltip: {
                                        backgroundColor: isDark
                                            ? "rgba(15, 23, 42, 0.95)"
                                            : "rgba(255, 255, 255, 0.95)",
                                        titleColor: isDark
                                            ? "#F8FAFC"
                                            : "#0F172A",
                                        bodyColor: isDark
                                            ? "#94A3B8"
                                            : "#475569",
                                        borderColor: "rgba(59, 130, 246, 0.3)",
                                        borderWidth: 1,
                                        padding: 10,
                                        cornerRadius: 10,
                                        callbacks: {
                                            label: (ctx) => {
                                                const sum =
                                                    ctx.dataset.data.reduce(
                                                        (a, b) => a + b,
                                                        0,
                                                    );
                                                const pct = sum
                                                    ? (
                                                          (ctx.raw / sum) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0;
                                                return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />

                        <div
                            className="genre-chart-center"
                            style={{ color: textColor }}
                        >
                            <span className="genre-chart-center-value">
                                {labels.length}
                            </span>
                            <span className="genre-chart-center-label">
                                {labels.length === 1 ? "genre" : "genres"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
