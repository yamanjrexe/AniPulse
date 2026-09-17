import React, { useState, useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import CountUp from "../../../components/ui/CountUp.jsx";

const MONTHS = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
];
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export default function PeriodStats() {
    const { animeData } = useAnime();
    const now = new Date();
    const [month, setMonth] = useState(
        String(now.getMonth() + 1).padStart(2, "0"),
    );
    const [year, setYear] = useState(String(now.getFullYear()));

    const years = useMemo(() => {
        const s = new Set([now.getFullYear()]);
        animeData.forEach((a) => {
            if (a.userStatus !== "Completed") return;
            const d = a.finishDate || a.actualFinishDate;
            if (!d) return;
            const y = parseInt(d.split("-")[0]);
            if (!isNaN(y)) s.add(y);
        });
        return Array.from(s).sort((a, b) => b - a);
    }, [animeData, now]);

    const stats = useMemo(() => {
        let completed = 0,
            episodes = 0,
            mins = 0;
        animeData.forEach((a) => {
            if (a.userStatus !== "Completed") return;
            const dstr = a.actualFinishDate || a.finishDate;
            if (!dstr) return;
            const d = new Date(dstr);
            if (isNaN(d)) return;
            if (d.getFullYear() !== parseInt(year)) return;
            if (month !== "all" && d.getMonth() + 1 !== parseInt(month)) return;
            completed++;
            if (a.type === "Movie") {
                episodes += 1;
                mins += a.duration || 120;
            } else {
                episodes += a.episodes || 0;
                mins += (a.episodes || 0) * (a.duration || 20);
            }
        });
        return { completed, episodes, hours: Math.round(mins / 60) };
    }, [animeData, month, year]);

    const label = `Showing: ${month === "all" ? "All Months" : MONTH_NAMES[parseInt(month) - 1]} ${year}`;

    return (
        <div className="period-stats-section">
            <div className="period-stats-header">
                <h2 className="section-title">Period Stats</h2>
                <span className="period-stats-subtitle">
                    View completed stats for any month or year
                </span>
            </div>

            <div className="period-stats-filters">
                <div className="period-filters-left">
                    <div className="filter-group">
                        <label htmlFor="periodMonth">
                            <i className="fas fa-calendar-alt" /> Month
                        </label>
                        <select
                            id="periodMonth"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        >
                            <option value="all">All Months</option>
                            {MONTHS.map((m) => (
                                <option key={m} value={m}>
                                    {MONTH_NAMES[parseInt(m) - 1]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="periodYear">
                            <i className="fas fa-calendar" /> Year
                        </label>
                        <select
                            id="periodYear"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="period-display-badge">
                    <i className="fas fa-chart-simple" />
                    <span>{label}</span>
                </div>
            </div>

            <div className="period-stats-grid">
                <StatCard
                    icon="fa-check-circle"
                    cls="completed"
                    value={stats.completed}
                    label="Completed"
                />
                <StatCard
                    icon="fa-film"
                    cls="episodes"
                    value={stats.episodes}
                    label="Episodes"
                />
                <StatCard
                    icon="fa-clock"
                    cls="hours"
                    value={stats.hours}
                    suffix="h"
                    label="Watch Time"
                />
            </div>
        </div>
    );
}

function StatCard({ icon, cls, value, suffix = "", label }) {
    const timing =
        label === "Completed"
            ? { duration: 900, delay: 0 }
            : label === "Episodes"
              ? { duration: 1200, delay: 150 }
              : { duration: 800, delay: 320 };

    return (
        <div className="period-stat-card">
            <div className={`period-stat-icon ${cls}`}>
                <i className={`fas ${icon}`} />
            </div>
            <div className="period-stat-content">
                <span className="period-stat-value">
                    <CountUp
                        end={value}
                        suffix={suffix}
                        duration={timing.duration}
                        delay={timing.delay}
                        inView
                        threshold={0.4}
                    />
                </span>
                <span className="period-stat-label">{label}</span>
            </div>
        </div>
    );
}
