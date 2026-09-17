import React, { useMemo, useState, useEffect } from "react";
import { useAnime } from "../../context/AnimeContext.jsx";

function parseDateSafely(value) {
    if (!value) return null;

    if (typeof value === "number") {
        const d = new Date(value);
        return !isNaN(d.getTime()) && d.getFullYear() > 2000 ? d : null;
    }

    if (typeof value !== "string") return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
        const [y, m] = value.split("-").map(Number);
        const date = new Date(y, m - 1, 15);
        return isNaN(date.getTime()) ? null : date;
    }

    if (value.includes("T")) {
        const part = value.split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
            const [y, m, d] = part.split("-").map(Number);
            const date = new Date(y, m - 1, d);
            return isNaN(date.getTime()) ? null : date;
        }
    }

    if (value.includes(" ")) {
        const part = value.split(" ")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
            const [y, m, d] = part.split("-").map(Number);
            const date = new Date(y, m - 1, d);
            return isNaN(date.getTime()) ? null : date;
        }
    }

    if (/^\d{4}$/.test(value)) {
        const date = new Date(parseInt(value, 10), 0, 1);
        return isNaN(date.getTime()) ? null : date;
    }

    return null;
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCompletionDate(anime) {
    return (
        parseDateSafely(anime.actualFinishDate) ||
        parseDateSafely(anime.finishDate) ||
        parseDateSafely(anime.completedTimestamp) ||
        parseDateSafely(anime.updatedAt) ||
        parseDateSafely(anime.createdAt)
    );
}

function levelForCount(count) {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Heatmap() {
    const { animeData } = useAnime();

    const contributions = useMemo(() => {
        const map = {};
        const processed = new Set();

        (animeData || []).forEach((anime) => {
            if (anime.userStatus !== "Completed") return;

            const date = getCompletionDate(anime);
            if (!date || isNaN(date.getTime())) return;

            const key = formatDateKey(date);
            const unique = `${anime.id || anime.title}_${key}`;
            if (processed.has(unique)) return;

            processed.add(unique);
            map[key] = (map[key] || 0) + 1;
        });

        return map;
    }, [animeData]);

    useEffect(() => {
        try {
            localStorage.setItem(
                "animeContributions",
                JSON.stringify(contributions),
            );
        } catch (_) {
        }
    }, [contributions]);

    const availableYears = useMemo(() => {
        const set = new Set();

        (animeData || []).forEach((a) => {
            if (a.userStatus !== "Completed") return;

            const m1 = a.actualFinishDate?.match(/^\d{4}/);
            if (m1) set.add(parseInt(m1[0], 10));

            const m2 = a.finishDate?.match(/^\d{4}/);
            if (m2) set.add(parseInt(m2[0], 10));

            if (a.completedTimestamp) {
                const d = parseDateSafely(a.completedTimestamp);
                if (d) set.add(d.getFullYear());
            }
        });

        if (set.size === 0) set.add(new Date().getFullYear());
        return Array.from(set).sort((a, b) => b - a);
    }, [animeData]);

    const [year, setYear] = useState(() => availableYears[0]);

    useEffect(() => {
        if (!availableYears.includes(year)) {
            setYear(availableYears[0]);
        }
    }, [availableYears, year]);

    const weeks = useMemo(() => {
        const result = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        const maxDate = year === currentYear ? today : new Date(year, 11, 31);
        const firstDay = new Date(year, 0, 1);
        const firstSunday = new Date(firstDay);
        firstSunday.setDate(firstDay.getDate() - firstDay.getDay());

        for (let w = 0; w < 53; w++) {
            const weekStart = new Date(firstSunday);
            weekStart.setDate(firstSunday.getDate() + w * 7);
            if (weekStart > maxDate) break;

            const days = [];
            for (let d = 0; d < 7; d++) {
                const cur = new Date(weekStart);
                cur.setDate(weekStart.getDate() + d);

                const inYear = cur >= firstDay && cur <= maxDate;
                if (!inYear) {
                    days.push(null);
                    continue;
                }

                const key = formatDateKey(cur);
                const count = contributions[key] || 0;
                days.push({
                    date: cur,
                    dateStr: key,
                    count,
                    level: levelForCount(count),
                });
            }

            if (days.some(Boolean)) result.push(days);
        }
        return result;
    }, [year, contributions]);

    const totalForYear = useMemo(() => {
        const prefix = `${year}`;
        return Object.entries(contributions).reduce(
            (sum, [k, n]) => (k.startsWith(prefix) ? sum + n : sum),
            0,
        );
    }, [contributions, year]);

    return (
        <section className="chart-card fade-in">
            <div className="heatmap-header">
                <div className="heatmap-title">
                    <i className="fas fa-calendar-day" /> Activity Heatmap
                </div>
                <div className="total-contributions">
                    <i className="fas fa-fire" /> <span>{totalForYear}</span>{" "}
                    contributions in <span>{year}</span>
                </div>
            </div>

            <div className="heatmap-years">
                {availableYears.map((y) => (
                    <button
                        key={y}
                        className={`year-btn ${y === year ? "active" : ""}`}
                        onClick={() => setYear(y)}
                    >
                        {y}
                    </button>
                ))}
            </div>

            <div className="heatmap-wrapper">
                <div className="heatmap-grid">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="heatmap-col">
                            {week.map((day, di) =>
                                day ? (
                                    <div
                                        key={di}
                                        className={`heatmap-cell level-${day.level}`}
                                        title={`${day.count} anime ${
                                            day.count === 1
                                                ? "completed"
                                                : "completed"
                                        } on ${day.date.toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            },
                                        )}`}
                                    />
                                ) : (
                                    <div
                                        key={di}
                                        className="heatmap-cell heatmap-cell-empty"
                                        aria-hidden="true"
                                    />
                                ),
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="heatmap-legend">
                <span className="legend-text">Less</span>
                <div className="legend-colors">
                    {[0, 1, 2, 3, 4].map((lvl) => (
                        <div
                            key={lvl}
                            className={`legend-color-block heatmap-cell level-${lvl}`}
                            aria-hidden="true"
                        />
                    ))}
                </div>
                <span className="legend-text">More</span>
            </div>
        </section>
    );
}
