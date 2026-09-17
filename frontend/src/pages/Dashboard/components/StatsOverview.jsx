import React, { useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import CountUp from "../../../components/ui/CountUp.jsx";

function getMonthStats(animeData, year, month) {
    let completed = 0,
        movies = 0,
        episodes = 0,
        minutes = 0;

    (animeData || []).forEach((a) => {
        if (a.userStatus !== "Completed") return;
        const dstr = a.actualFinishDate || a.finishDate;
        if (!dstr) return;
        const d = new Date(dstr);
        if (isNaN(d) || d.getMonth() !== month || d.getFullYear() !== year)
            return;

        completed++;
        if (a.type === "Movie") {
            movies++;
            episodes += 1;
            minutes += a.duration || 120;
        } else {
            episodes += a.episodes || 0;
            minutes += (a.episodes || 0) * (a.duration || 20);
        }
    });

    return {
        completed,
        movies,
        episodes,
        hours: Math.floor(minutes / 60),
    };
}

function compare(current, previous) {
    if (previous === 0 && current === 0)
        return { cls: "neutral", icon: "fa-minus", text: "No data" };
    if (previous === 0 && current > 0)
        return { cls: "positive", icon: "fa-arrow-up", text: "New activity" };
    if (previous > 0 && current === 0)
        return { cls: "negative", icon: "fa-arrow-down", text: "No activity" };

    const change = ((current - previous) / previous) * 100;
    const abs = Math.abs(change);

    if (abs < 1) return { cls: "neutral", icon: "fa-minus", text: "No change" };

    return change > 0
        ? {
              cls: "positive",
              icon: "fa-arrow-up",
              text: `${abs.toFixed(1)}% more`,
          }
        : {
              cls: "negative",
              icon: "fa-arrow-down",
              text: `${abs.toFixed(1)}% less`,
          };
}

const BADGE_STYLES = {
    positive: {
        bg: "rgba(16,185,129,0.12)",
        color: "#10B981",
        border: "rgba(16,185,129,0.3)",
    },
    negative: {
        bg: "rgba(239,68,68,0.12)",
        color: "#EF4444",
        border: "rgba(239,68,68,0.3)",
    },
    neutral: {
        bg: "rgba(148,163,184,0.12)",
        color: "#94A3B8",
        border: "rgba(148,163,184,0.3)",
    },
};

export default function StatsOverview() {
    const { animeData } = useAnime();

    const { current, previous, monthName, isJanuary } = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        let py = y,
            pm = m - 1;
        if (pm < 0) {
            pm = 11;
            py--;
        }

        return {
            current: getMonthStats(animeData, y, m),
            previous: getMonthStats(animeData, py, pm),
            monthName: now.toLocaleString("default", { month: "long" }),
            isJanuary: m === 0,
        };
    }, [animeData]);

    const cards = [
        {
            value: current.completed,
            label: "Total Completed",
            icon: "fa-check-circle",
            tone: "success",
            change: isJanuary
                ? null
                : compare(current.completed, previous.completed),
        },
        {
            value: current.movies,
            label: "Total Movies",
            icon: "fa-video",
            tone: "info",
            change: isJanuary ? null : compare(current.movies, previous.movies),
        },
        {
            value: current.episodes,
            label: "Total Episodes",
            icon: "fa-play-circle",
            tone: "warning",
            change: isJanuary
                ? null
                : compare(current.episodes, previous.episodes),
        },
        {
            value: current.hours,
            label: "Total Hours",
            icon: "fa-clock",
            tone: "primary",
            change: isJanuary ? null : compare(current.hours, previous.hours),
        },
    ];

    return (
        <section className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-tachometer-alt" aria-hidden="true" />{" "}
                Overview ({monthName})
            </h2>
            <div className="stats-grid">
                {cards.map((c, i) => (
                    <Card key={i} {...c} index={i} />
                ))}
            </div>
        </section>
    );
}

function Card({ value, label, icon, tone, change, index }) {
    const s = change ? BADGE_STYLES[change.cls] || BADGE_STYLES.neutral : null;

    const timing = [
        { duration: 3500, delay: 0 },
        { duration: 3500, delay: 120 },
        { duration: 3500, delay: 200 },
        { duration: 3500, delay: 340 },
    ][index] || { duration: 1100, delay: index * 100 };

    return (
        <div className="stat-card fade-in">
            <div className="stat-header">
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="stat-value">
                        <CountUp
                            end={value}
                            duration={timing.duration}
                            delay={timing.delay}
                        />
                    </div>
                    <div className="stat-label">{label}</div>

                    {change && (
                        <div
                            className={`stat-change ${change.cls}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 8,
                                padding: "3px 8px",
                                borderRadius: 999,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background: s.bg,
                                color: s.color,
                                border: `1px solid ${s.border}`,
                                whiteSpace: "nowrap",
                                lineHeight: 1.2,
                            }}
                            title={`vs previous month`}
                        >
                            <i
                                className={`fas ${change.icon}`}
                                style={{ fontSize: "0.6rem" }}
                            />
                            <span>{change.text}</span>
                        </div>
                    )}
                </div>

                <div className={`stat-icon ${tone}`}>
                    <i className={`fas ${icon}`} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}
