import React, { useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function OverviewMetrics() {
    const { animeData } = useAnime();

    const m = useMemo(() => {
        const now = new Date();
        const cm = now.getMonth(),
            cy = now.getFullYear();

        const completed = animeData.filter((a) => a.userStatus === "Completed");
        const rated = animeData.filter((a) => a.score > 0);

        let totalEps = 0,
            totalMins = 0;
        completed.forEach((a) => {
            if (a.type === "Movie") {
                totalEps += 1;
                totalMins += a.duration || 120;
            } else {
                totalEps += a.episodes || 0;
                totalMins += (a.episodes || 0) * (a.duration || 20);
            }
        });
        const totalHours = Math.round(totalMins / 60);
        const avg = rated.length
            ? rated.reduce((s, a) => s + a.score, 0) / rated.length
            : 0;

        const thisMonth = animeData.filter((a) => {
            if (a.userStatus !== "Completed") return false;
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return false;
            const dt = new Date(d);
            return (
                !isNaN(dt) && dt.getMonth() === cm && dt.getFullYear() === cy
            );
        });
        let mEps = 0,
            mMins = 0;
        thisMonth.forEach((a) => {
            if (a.type === "Movie") {
                mEps += 1;
                mMins += a.duration || 120;
            } else {
                mEps += a.episodes || 0;
                mMins += (a.episodes || 0) * (a.duration || 20);
            }
        });

        const months = new Set();
        completed.forEach((a) => {
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return;
            const dt = new Date(d);
            if (!isNaN(dt)) months.add(`${dt.getFullYear()}-${dt.getMonth()}`);
        });

        const total = animeData.length;
        const completionRate = total
            ? Math.round((completed.length / total) * 100)
            : 0;

        return {
            completed: completed.length,
            episodes: totalEps,
            hours: totalHours,
            avg: parseFloat(avg.toFixed(1)),
            rated: rated.length,
            rate: completionRate,
            total,
            watching: animeData.filter((a) => a.userStatus === "Watching")
                .length,
            plan: animeData.filter((a) => a.userStatus === "Plan to Watch")
                .length,
            streakMonths: months.size,
            thisMonthCompleted: thisMonth.length,
            thisMonthEpisodes: mEps,
            thisMonthHours: Math.round(mMins / 60),
        };
    }, [animeData]);

    const cards = [
        {
            icon: "fa-check-circle",
            cls: "completed",
            value: m.completed,
            label: "Anime Completed",
            change: `+${m.thisMonthCompleted} this month`,
            changeCls: m.thisMonthCompleted > 0 ? "positive" : "neutral",
            timing: { duration: 1200, delay: 0 },
        },
        {
            icon: "fa-film",
            cls: "episodes",
            value: m.episodes,
            label: "Episodes Watched",
            change: `+${m.thisMonthEpisodes} this month`,
            changeCls: m.thisMonthEpisodes > 0 ? "positive" : "neutral",
            timing: { duration: 1500, delay: 80 },
        },
        {
            icon: "fa-clock",
            cls: "time",
            value: m.hours,
            suffix: "h",
            label: "Watch Time",
            change: `+${m.thisMonthHours}h this month`,
            changeCls: m.thisMonthHours > 0 ? "positive" : "neutral",
            timing: { duration: 1100, delay: 160 },
        },
        {
            icon: "fa-star",
            cls: "rating",
            value: m.avg,
            decimals: 1,
            suffix: "★",
            label: "Average Rating",
            change: `from ${m.rated} ratings`,
            changeCls: "neutral",
            timing: { duration: 900, delay: 240 },
        },
        {
            icon: "fa-percent",
            cls: "rate",
            value: m.rate,
            suffix: "%",
            label: "Completion Rate",
            change: "of total entries",
            changeCls: "neutral",
            timing: { duration: 1300, delay: 320 },
        },
        {
            icon: "fa-eye",
            cls: "watching",
            value: m.watching,
            label: "Currently Watching",
            change: m.watching > 0 ? `${m.watching} active` : "none active",
            changeCls: m.watching > 0 ? "positive" : "neutral",
            timing: { duration: 800, delay: 400 },
        },
        {
            icon: "fa-clock",
            cls: "plan",
            value: m.plan,
            label: "Plan to Watch",
            change: `${m.plan} in queue`,
            changeCls: "neutral",
            timing: { duration: 950, delay: 480 },
        },
        {
            icon: "fa-fire",
            cls: "streak",
            value: m.streakMonths,
            label: "Current Streak",
            change: `${m.streakMonths} month${m.streakMonths !== 1 ? "s" : ""} watching`,
            changeCls: m.streakMonths > 0 ? "positive" : "neutral",
            timing: { duration: 1050, delay: 560 },
        },
    ];

    return (
        <div className="overview-metrics">
            <div className="overview-header">
                <h2 className="overview-title">
                    <i className="fas fa-chart-simple" aria-hidden="true" />{" "}
                    Library Overview
                </h2>
                <span className="overview-subtitle">
                    Your anime stats at a glance
                </span>
            </div>
            <div className="overview-grid">
                {cards.map((c, i) => (
                    <div key={i} className="metric-card">
                        <div className={`metric-icon ${c.cls}`}>
                            <i className={`fas ${c.icon}`} aria-hidden="true" />
                        </div>
                        <div className="metric-content">
                            <span className="metric-value">
                                <CountUp
                                    end={c.value}
                                    suffix={c.suffix || ""}
                                    decimals={c.decimals || 0}
                                    duration={c.timing.duration}
                                    delay={c.timing.delay}
                                    inView
                                    threshold={0.35}
                                />
                            </span>
                            <span className="metric-label">{c.label}</span>
                            <span className={`metric-change ${c.changeCls}`}>
                                {c.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
