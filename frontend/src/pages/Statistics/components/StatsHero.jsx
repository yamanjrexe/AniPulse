import React, { useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function StatsHero() {
    const { animeData } = useAnime();
    const { user } = useAuth();

    const stats = useMemo(() => {
        const completed = animeData.filter((a) => a.userStatus === "Completed");
        let eps = 0,
            mins = 0;
        completed.forEach((a) => {
            if (a.type === "Movie") {
                eps += 1;
                mins += a.duration || 120;
            } else {
                eps += a.episodes || 0;
                mins += (a.episodes || 0) * (a.duration || 20);
            }
        });
        const hours = Math.round(mins / 60);
        const rated = animeData.filter((a) => a.score > 0);
        const avg = rated.length
            ? rated.reduce((s, a) => s + a.score, 0) / rated.length
            : 0;

        const topGenre = (() => {
            const g = {};
            completed.forEach((a) =>
                (a.genres || []).forEach((x) => {
                    g[x] = (g[x] || 0) + 1;
                }),
            );
            return (
                Object.entries(g).sort((a, b) => b[1] - a[1])[0]?.[0] ||
                "None yet"
            );
        })();

        const months = new Set();
        completed.forEach((a) => {
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return;
            const dt = new Date(d);
            if (!isNaN(dt)) months.add(`${dt.getFullYear()}-${dt.getMonth()}`);
        });

        return {
            completed: completed.length,
            episodes: eps,
            hours,
            avg: parseFloat(avg.toFixed(1)),
            topGenre,
            streakMonths: months.size,
        };
    }, [animeData]);

    const watchTimeDisplay =
        stats.hours >= 8760
            ? `${Math.floor(stats.hours / 8760)}y ${Math.floor((stats.hours % 8760) / 24)}d`
            : stats.hours >= 24
              ? `${Math.floor(stats.hours / 24)}d ${stats.hours % 24}h`
              : `${stats.hours}h`;

    const subtitle =
        stats.completed === 0
            ? "Start your anime journey."
            : stats.completed < 10
              ? "You're just getting started."
              : stats.completed < 50
                ? "Building an impressive collection."
                : stats.completed < 100
                  ? "Dedicated anime fan."
                  : stats.completed < 500
                    ? "Anime veteran."
                    : "Legendary collection.";

    return (
        <div className="stats-hero">
            <div className="stats-hero-content">
                <div className="stats-hero-left">
                    <div className="hero-badge">
                        <span className="hero-badge-text">
                            Your Anime Journey
                        </span>
                    </div>
                    <h1 className="hero-title">
                        <span className="hero-greeting-text">
                            Welcome back,
                        </span>{" "}
                        <span className="hero-username">
                            {user?.name || "AnimeFan"}
                        </span>
                    </h1>
                    <p className="hero-subtitle">{subtitle}</p>

                    <div className="hero-insights">
                        <div className="hero-insight-item">
                            <div className="hero-insight-icon">
                                <i className="fas fa-trophy" />
                            </div>
                            <div className="hero-insight-info">
                                <span className="hero-insight-label">
                                    Top Genre
                                </span>
                                <span className="hero-insight-text">
                                    {stats.completed
                                        ? stats.topGenre
                                        : "Add anime"}
                                </span>
                            </div>
                        </div>
                        <div className="hero-insight-item">
                            <div className="hero-insight-icon">
                                <i className="fas fa-fire" />
                            </div>
                            <div className="hero-insight-info">
                                <span className="hero-insight-label">
                                    Watch Streak
                                </span>
                                <span className="hero-insight-text">
                                    {stats.streakMonths > 0
                                        ? `${stats.streakMonths} month${stats.streakMonths > 1 ? "s" : ""}`
                                        : "Not started"}
                                </span>
                            </div>
                        </div>
                        <div className="hero-insight-item">
                            <div className="hero-insight-icon">
                                <i className="fas fa-star" />
                            </div>
                            <div className="hero-insight-info">
                                <span className="hero-insight-label">
                                    Avg Rating
                                </span>
                                <span className="hero-insight-text">
                                    {stats.avg}★
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stats-hero-right">
                    <HeroStatCard
                        icon="fa-check-circle"
                        value={stats.completed}
                        label="Completed"
                    />
                    <HeroStatCard
                        icon="fa-film"
                        value={stats.episodes}
                        label="Episodes"
                    />
                    <div className="hero-stat-card">
                        <div className="hero-stat-icon">
                            <i className="fas fa-clock" aria-hidden="true" />
                        </div>
                        <div className="hero-stat-info">
                            <span className="hero-stat-value">
                                {watchTimeDisplay}
                            </span>
                            <span className="hero-stat-label">Watch Time</span>
                        </div>
                    </div>
                    <HeroStatCard
                        icon="fa-star"
                        value={stats.avg}
                        decimals={1}
                        label="Avg Rating"
                    />
                </div>
            </div>
        </div>
    );
}

function HeroStatCard({ icon, value, decimals = 0, label }) {
    const timing =
        label === "Completed"
            ? { duration: 1100, delay: 0 }
            : label === "Episodes"
              ? { duration: 1400, delay: 140 }
              : { duration: 900, delay: 280 };

    return (
        <div className="hero-stat-card">
            <div className="hero-stat-icon">
                <i className={`fas ${icon}`} aria-hidden="true" />
            </div>
            <div className="hero-stat-info">
                <span className="hero-stat-value">
                    <CountUp
                        end={value}
                        decimals={decimals}
                        duration={timing.duration}
                        delay={timing.delay}
                    />
                </span>
                <span className="hero-stat-label">{label}</span>
            </div>
        </div>
    );
}
