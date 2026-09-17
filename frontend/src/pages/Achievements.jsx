import React, { useMemo, useEffect, useState } from "react";
import { useAnime } from "../context/AnimeContext.jsx";
import { ACHIEVEMENTS } from "../services/achievements.js";

// ═══════════════════════════════════════════════════════════
// STREAK HELPERS
// ═══════════════════════════════════════════════════════════

function getMaxDayStreak(data) {
    const dateStrings = data
        .filter((a) => a.userStatus === "Completed")
        .map((a) => a.actualFinishDate || a.finishDate)
        .filter((d) => d && d.length >= 10);
    if (!dateStrings.length) return 0;

    const dates = dateStrings
        .map((d) => {
            const x = new Date(d);
            if (isNaN(x)) return null;
            x.setHours(0, 0, 0, 0);
            return x;
        })
        .filter(Boolean);
    if (!dates.length) return 0;

    const ts = new Set(dates.map((d) => d.getTime()));
    const sorted = Array.from(ts)
        .map((t) => new Date(t))
        .sort((a, b) => a - b);

    let max = 0,
        cur = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = (sorted[i] - sorted[i - 1]) / 86400000;
        if (diff === 1) {
            cur++;
            if (cur > max) max = cur;
        } else {
            cur = 1;
        }
    }
    if (sorted.length > 0 && max === 0) max = 1;
    return max;
}

function getCurrentDayStreak(data) {
    const dateStrings = data
        .filter((a) => a.userStatus === "Completed")
        .map((a) => a.actualFinishDate || a.finishDate)
        .filter((d) => d && d.length >= 10);
    if (!dateStrings.length) return 0;

    const dates = dateStrings
        .map((d) => {
            const x = new Date(d);
            if (isNaN(x)) return null;
            x.setHours(0, 0, 0, 0);
            return x;
        })
        .filter(Boolean);
    if (!dates.length) return 0;

    const ts = new Set(dates.map((d) => d.getTime()));
    const sorted = Array.from(ts).map((t) => new Date(t));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let cur = new Date(today);
    while (true) {
        if (sorted.some((d) => d.getTime() === cur.getTime())) {
            streak++;
            cur.setDate(cur.getDate() - 1);
        } else break;
    }
    return streak;
}

function getMaxMonthStreak(data) {
    const monthStrings = [
        ...new Set(
            data
                .filter(
                    (a) =>
                        a.userStatus === "Completed" &&
                        (a.actualFinishDate || a.finishDate),
                )
                .map((a) => {
                    const d = new Date(a.actualFinishDate || a.finishDate);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                }),
        ),
    ];
    const months = monthStrings
        .map((s) => {
            const [y, m] = s.split("-").map(Number);
            return { year: y, month: m };
        })
        .sort((a, b) => a.year - b.year || a.month - b.month);
    if (!months.length) return 0;

    let max = 1,
        streak = 1;
    for (let i = 1; i < months.length; i++) {
        const diff =
            (months[i].year - months[i - 1].year) * 12 +
            (months[i].month - months[i - 1].month);
        if (diff === 1) streak++;
        else streak = 1;
        max = Math.max(max, streak);
    }
    return max;
}

function getCurrentMonthStreak(data) {
    const monthSet = new Set(
        data
            .filter(
                (a) =>
                    a.userStatus === "Completed" &&
                    (a.actualFinishDate || a.finishDate),
            )
            .map((a) => {
                const d = new Date(a.actualFinishDate || a.finishDate);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }),
    );
    if (!monthSet.size) return 0;

    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let streak = 0;
    while (true) {
        const key = `${year}-${String(month).padStart(2, "0")}`;
        if (monthSet.has(key)) {
            streak++;
            month--;
            if (month === 0) {
                month = 12;
                year--;
            }
        } else break;
    }
    return streak;
}

// ═══════════════════════════════════════════════════════════
// Progress computation
// ═══════════════════════════════════════════════════════════

function decadesWatched(data) {
    const d = new Set();
    data.forEach((a) => {
        if (a.startYear) d.add(Math.floor(a.startYear / 10) * 10);
    });
    return Array.from(d);
}

function totalWatchHours(data) {
    return data.reduce(
        (s, a) => s + ((a.episodes || 0) * (a.duration || 20)) / 60,
        0,
    );
}

function computeProgress(data) {
    const completed = data.filter((a) => a.userStatus === "Completed").length;
    const totalEps = data.reduce((s, a) => s + (a.episodes || 0), 0);
    const totalHours = totalWatchHours(data);
    const totalRated = data.filter((a) => a.score > 0).length;
    const uniqueGenres = new Set(data.flatMap((a) => a.genres || [])).size;
    const listSize = data.length;
    const movies = data.filter(
        (a) => a.type === "Movie" && a.userStatus === "Completed",
    ).length;
    const tv = data.filter(
        (a) => a.type === "TV" && a.userStatus === "Completed",
    ).length;
    const ova = data.filter(
        (a) =>
            (a.type === "OVA" || a.type === "ONA") &&
            a.userStatus === "Completed",
    ).length;
    const decadeCount = decadesWatched(data).length;
    const planCount = data.filter(
        (a) => a.userStatus === "Plan to Watch",
    ).length;
    const watchingCount = data.filter(
        (a) => a.userStatus === "Watching",
    ).length;
    const droppedCount = data.filter((a) => a.userStatus === "Dropped").length;
    const score9plus = data.filter((a) => a.score >= 9).length;

    const avgRatingHigh = (() => {
        const rated = data.filter((a) => a.score && a.score > 0);
        if (rated.length < 10) return 0;
        const avg = rated.reduce((s, a) => s + a.score, 0) / rated.length;
        return avg >= 8.0 ? 1 : 0;
    })();

    return {
        first_anime: listSize,
        first_complete: completed,
        first_movie: movies,
        first_10: data.filter((a) => a.score === 10).length,
        complete_5: completed,
        complete_15: completed,
        complete_30: completed,
        complete_50: completed,
        complete_100: completed,
        complete_250: completed,
        complete_500: completed,
        complete_1000: completed,
        ep_100: totalEps,
        ep_500: totalEps,
        ep_1000: totalEps,
        ep_5000: totalEps,
        ep_10000: totalEps,
        hour_24: totalHours,
        hour_100: totalHours,
        hour_500: totalHours,
        hour_1000: totalHours,
        hour_5000: totalHours,
        rate_10: totalRated,
        rate_50: totalRated,
        rate_100: totalRated,
        avg_high: avgRatingHigh,
        genre_3: uniqueGenres,
        genre_6: uniqueGenres,
        genre_10: uniqueGenres,
        genre_15: uniqueGenres,
        genre_20: uniqueGenres,
        movie_10: movies,
        tv_10: tv,
        ova_5: ova,
        list_10: listSize,
        list_25: listSize,
        list_50: listSize,
        list_100: listSize,
        list_250: listSize,
        decade_3: decadeCount,
        decade_5: decadeCount,
        score_9plus: score9plus,
        watching_5: watchingCount,
        plan_10: planCount,
        dropped_5: droppedCount,
    };
}

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export default function Achievements() {
    const { animeData } = useAnime();

    const [unlocked, setUnlocked] = useState(() => {
        try {
            const stored = JSON.parse(
                localStorage.getItem("unlockedAchievements") || "[]",
            );
            if (!Array.isArray(stored)) return [];
            // Legacy: numeric indexes → ids
            if (stored.length > 0 && typeof stored[0] === "number") {
                return stored
                    .map((idx) => ACHIEVEMENTS[idx]?.id)
                    .filter(Boolean);
            }
            return stored;
        } catch {
            return [];
        }
    });

    const streaks = useMemo(
        () => ({
            maxDay: getMaxDayStreak(animeData),
            currentDay: getCurrentDayStreak(animeData),
            maxMonth: getMaxMonthStreak(animeData),
            currentMonth: getCurrentMonthStreak(animeData),
        }),
        [animeData],
    );

    const progress = useMemo(() => computeProgress(animeData), [animeData]);

    // Unlock detection
    useEffect(() => {
        const newlyUnlocked = [];
        const next = [...unlocked];

        ACHIEVEMENTS.forEach((ach) => {
            let done = false;

            // Streak achievements — special handling
            if (ach.id === "streak_week") done = streaks.maxDay >= ach.goal;
            else if (ach.id === "streak_month")
                done = streaks.maxDay >= ach.goal;
            else if (ach.id === "streak_3m")
                done = streaks.maxMonth >= ach.goal;
            else if (ach.id === "streak_6m")
                done = streaks.maxMonth >= ach.goal;
            else if (ach.id === "streak_12m")
                done = streaks.maxMonth >= ach.goal;
            else {
                const p = progress[ach.id];
                done = p !== undefined && p >= ach.goal;
            }

            if (done && !next.includes(ach.id)) {
                next.push(ach.id);
                newlyUnlocked.push(ach.title);
            }
        });

        if (newlyUnlocked.length) {
            setUnlocked(next);
            localStorage.setItem("unlockedAchievements", JSON.stringify(next));
            newlyUnlocked.forEach((t) => {
                if (typeof window.showToast === "function") {
                    window.showToast(`Achievement Unlocked: ${t}!`, "success");
                }
            });
            // Trigger sync
            window.dispatchEvent(new CustomEvent("syncSchedule"));
        }
    }, [progress, unlocked, streaks]);

    const completedCount = ACHIEVEMENTS.filter((a) =>
        unlocked.includes(a.id),
    ).length;
    const inProgressCount = ACHIEVEMENTS.filter((a) => {
        if (unlocked.includes(a.id)) return false;
        if (a.id === "streak_week" || a.id === "streak_month")
            return streaks.currentDay > 0;
        if (
            a.id === "streak_3m" ||
            a.id === "streak_6m" ||
            a.id === "streak_12m"
        )
            return streaks.currentMonth > 0;
        const p = progress[a.id];
        return p !== undefined && p > 0;
    }).length;

    return (
        <div className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-trophy" aria-hidden="true" /> Achievements
            </h2>

            <div className="achievements-summary">
                <div className="summary-card">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">{ACHIEVEMENTS.length}</span>
                </div>
                <div className="summary-card completed">
                    <span className="summary-label">Completed</span>
                    <span className="summary-value">{completedCount}</span>
                </div>
                <div className="summary-card progress">
                    <span className="summary-label">In Progress</span>
                    <span className="summary-value">{inProgressCount}</span>
                </div>
            </div>

            <div className="achievements-grid">
                {ACHIEVEMENTS.map((ach) => {
                    let current = 0;
                    let goal = ach.goal;
                    let done = false;

                    if (ach.id === "streak_week" || ach.id === "streak_month") {
                        done = streaks.maxDay >= goal;
                        current = done
                            ? goal
                            : Math.min(streaks.currentDay, goal);
                    } else if (
                        ach.id === "streak_3m" ||
                        ach.id === "streak_6m" ||
                        ach.id === "streak_12m"
                    ) {
                        done = streaks.maxMonth >= goal;
                        current = done
                            ? goal
                            : Math.min(streaks.currentMonth, goal);
                    } else {
                        current = progress[ach.id] || 0;
                        done = current >= goal;
                    }

                    const pct = Math.min((current / goal) * 100, 100);
                    const unlockedFlag = done || unlocked.includes(ach.id);

                    const statusClass = unlockedFlag
                        ? "status-completed"
                        : current > 0
                          ? "status-progress"
                          : "status-locked";
                    const statusText = unlockedFlag
                        ? "Completed"
                        : current > 0
                          ? `In Progress (${Math.floor(pct)}%)`
                          : "Locked";

                    return (
                        <div
                            key={ach.id}
                            className={`achievement-card fade-in ${unlockedFlag ? "unlocked" : ""}`}
                        >
                            <div className="achievement-icon">
                                <i className={`fas ${ach.icon}`} />
                            </div>
                            <div className="achievement-title">{ach.title}</div>
                            <div className="achievement-desc">{ach.desc}</div>
                            <div
                                className={`achievement-status ${statusClass}`}
                            >
                                {statusText}
                            </div>
                            <div className="achievement-progress-bar">
                                <div
                                    className="achievement-progress"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
