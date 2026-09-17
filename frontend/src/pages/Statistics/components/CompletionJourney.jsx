import React, { useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import "../../../../src/components/charts/ChartSetup.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useTheme } from "../../../context/ThemeContext.jsx";

const RANGES = [
    { k: "all", l: "All Time" },
    { k: "year", l: "Last Year" },
    { k: "90d", l: "90 Days" },
    { k: "30d", l: "30 Days" },
];

function inRange(date, range) {
    if (range === "all") return true;
    const now = new Date();
    const d = new Date(date);
    if (range === "year") {
        const ago = new Date(now);
        ago.setFullYear(now.getFullYear() - 1);
        return d >= ago;
    }
    if (range === "90d") {
        const ago = new Date(now);
        ago.setDate(now.getDate() - 90);
        return d >= ago;
    }
    if (range === "30d") {
        const ago = new Date(now);
        ago.setDate(now.getDate() - 30);
        return d >= ago;
    }
    return true;
}

export default function CompletionJourney() {
    const { animeData } = useAnime();
    const { theme } = useTheme();
    const [range, setRange] = useState("all");
    const isDark = theme === "dark";
    const text = isDark ? "#94a3b8" : "#64748b";
    const grid = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

    const data = useMemo(() => {
        const completed = animeData
            .filter((a) => a.userStatus === "Completed")
            .map((a) => {
                const dstr = a.actualFinishDate || a.finishDate;
                if (!dstr) return null;
                const d = new Date(dstr);
                return isNaN(d) ? null : { ...a, completionDate: d };
            })
            .filter(Boolean)
            .filter((a) => inRange(a.completionDate, range))
            .sort((a, b) => a.completionDate - b.completionDate);

        // Cumulative by month
        const months = {};
        let cum = 0;
        const labels = [];
        const cumulative = [];
        completed.forEach((a) => {
            const key = `${a.completionDate.getFullYear()}-${String(a.completionDate.getMonth() + 1).padStart(2, "0")}`;
            months[key] = (months[key] || 0) + 1;
        });
        Object.keys(months)
            .sort()
            .forEach((k) => {
                cum += months[k];
                labels.push(k);
                cumulative.push(cum);
            });

        const monthlyLabels = Object.keys(months).sort();
        const monthlyCounts = monthlyLabels.map((k) => months[k]);
        const avg = monthlyCounts.length
            ? Math.round(
                  monthlyCounts.reduce((a, b) => a + b, 0) /
                      monthlyCounts.length,
              )
            : 0;

        const fastestMonth =
            Object.entries(months).sort((a, b) => b[1] - a[1])[0] || null;

        const first = completed[0];
        const last = completed[completed.length - 1];
        const monthsDiff =
            first && last
                ? (last.completionDate.getFullYear() -
                      first.completionDate.getFullYear()) *
                      12 +
                  (last.completionDate.getMonth() -
                      first.completionDate.getMonth()) +
                  1
                : 0;
        const pace =
            monthsDiff > 0 ? (completed.length / monthsDiff).toFixed(1) : 0;

        return {
            total: completed.length,
            labels,
            cumulative,
            monthlyLabels,
            monthlyCounts,
            avg,
            fastestMonth,
            first,
            pace,
        };
    }, [animeData, range]);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: grid },
                ticks: { color: text },
            },
            x: {
                grid: { display: false },
                ticks: { color: text, maxTicksLimit: 20 },
            },
        },
    };

    return (
        <div className="completion-journey">
            <div className="journey-header">
                <div className="journey-header-left">
                    <h2 className="journey-title">
                        <i className="fas fa-road" /> Completion Journey
                    </h2>
                </div>
                <div className="journey-header-right">
                    <div className="journey-time-filters">
                        {RANGES.map((r) => (
                            <button
                                key={r.k}
                                className={`journey-filter-btn ${range === r.k ? "active" : ""}`}
                                onClick={() => setRange(r.k)}
                            >
                                {r.l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="journey-chart-card">
                <div className="journey-chart-header">
                    <div className="journey-chart-title">
                        <i className="fas fa-chart-line" /> Cumulative
                        Completions
                    </div>
                    <div className="journey-chart-stats">
                        <span className="journey-stat">{data.total}</span>
                        <span className="journey-stat-label">
                            Total Completed
                        </span>
                    </div>
                </div>
                <div
                    className="journey-chart-container"
                    style={{ height: 280 }}
                >
                    {data.cumulative.length === 0 ? (
                        <EmptyChart message="Complete your first anime to start your journey!" />
                    ) : (
                        <Line
                            data={{
                                labels: data.labels,
                                datasets: [
                                    {
                                        label: "Total",
                                        data: data.cumulative,
                                        borderColor: "#22D3EE",
                                        backgroundColor: "rgba(34,211,238,0.1)",
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 3,
                                    },
                                ],
                            }}
                            options={commonOptions}
                        />
                    )}
                </div>
            </div>

            <div className="journey-secondary-chart">
                <div className="journey-chart-header">
                    <div className="journey-chart-title">
                        <i className="fas fa-calendar-alt" /> Monthly
                        Completions
                    </div>
                    <div className="journey-chart-stats">
                        <span className="journey-stat">{data.avg}</span>
                        <span className="journey-stat-label">Avg / Month</span>
                    </div>
                </div>
                <div
                    className="journey-chart-container"
                    style={{ height: 260 }}
                >
                    {data.monthlyCounts.length === 0 ? (
                        <EmptyChart message="No data for selected period" />
                    ) : (
                        <Bar
                            data={{
                                labels: data.monthlyLabels.map(
                                    (l) =>
                                        l.split("-")[1] +
                                        "/" +
                                        l.split("-")[0].slice(-2),
                                ),
                                datasets: [
                                    {
                                        label: "Anime",
                                        data: data.monthlyCounts,
                                        backgroundColor: "rgba(139,92,246,0.7)",
                                        borderRadius: 6,
                                    },
                                ],
                            }}
                            options={commonOptions}
                        />
                    )}
                </div>
            </div>

            <div className="journey-insights">
                <div className="journey-insights-header">
                    <h3 className="journey-insights-title">
                        <i className="fas fa-lightbulb" /> Journey Insights
                    </h3>
                    <span className="journey-insights-subtitle">
                        Key milestones and statistics
                    </span>
                </div>

                <div className="journey-insights-grid">
                    <JourneyInsight
                        icon="fa-flag"
                        cls="first"
                        value={data.first?.title || "—"}
                        label="First Anime"
                        detail={
                            data.first
                                ? data.first.completionDate.toLocaleDateString(
                                      "en-US",
                                      { month: "short", year: "numeric" },
                                  )
                                : "—"
                        }
                    />
                    <JourneyInsight
                        icon="fa-rocket"
                        cls="fastest"
                        value={
                            data.fastestMonth
                                ? data.fastestMonth[0].split("-")[1] +
                                  "/" +
                                  data.fastestMonth[0].split("-")[0].slice(-2)
                                : "—"
                        }
                        label="Fastest Month"
                        detail={`${data.fastestMonth?.[1] || 0} anime`}
                    />
                    <JourneyInsight
                        icon="fa-calendar-check"
                        cls="active"
                        value="—"
                        label="Most Active Year"
                        detail="—"
                    />
                    <JourneyInsight
                        icon="fa-tachometer-alt"
                        cls="pace"
                        value={data.pace}
                        label="Completion Pace"
                        detail="per month"
                    />
                </div>
            </div>
        </div>
    );
}

function JourneyInsight({ icon, cls, value, label, detail }) {
    return (
        <div className="journey-insight-card">
            <div className={`journey-insight-icon ${cls}`}>
                <i className={`fas ${icon}`} />
            </div>
            <div className="journey-insight-content">
                <span className="journey-insight-value">{value}</span>
                <span className="journey-insight-label">{label}</span>
                <span className="journey-insight-detail">{detail}</span>
            </div>
        </div>
    );
}

function EmptyChart({ message }) {
    return (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <i
                className="fas fa-info-circle"
                style={{ fontSize: 24, display: "block", marginBottom: 12 }}
            />
            {message}
        </div>
    );
}
