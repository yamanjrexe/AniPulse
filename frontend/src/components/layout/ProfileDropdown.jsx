import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useLevel } from "../../context/LevelContext.jsx";
import { formatNumberShort } from "../../utils/helpers.js";
import SidebarNav from "./SidebarNav.jsx";
import LevelBadge from "../level/LevelBadge.jsx";

export default function ProfileDropdown({ onClose }) {
    const { user } = useAuth();
    const { animeData } = useAnime();
    const { level, title } = useLevel();

    const [statMode, setStatMode] = useState("hours");
    const [animating, setAnimating] = useState(false);

    const stats = useMemo(() => {
        const completed = animeData.filter((a) => a.userStatus === "Completed");
        let episodes = 0;
        let minutes = 0;
        completed.forEach((a) => {
            if (a.type === "Movie") {
                episodes += 1;
                minutes += a.duration || 120;
            } else {
                const eps = a.episodes || 0;
                episodes += eps;
                minutes += eps * (a.duration || 20);
            }
        });
        return {
            anime: completed.length,
            episodes,
            hours: Math.round(minutes / 60),
        };
    }, [animeData]);

    useEffect(() => {
        const id = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setStatMode((m) => (m === "hours" ? "episodes" : "hours"));
                setAnimating(false);
            }, 150);
        }, 15000);
        return () => clearInterval(id);
    }, []);

    const displayValue =
        statMode === "hours"
            ? formatNumberShort(stats.hours)
            : formatNumberShort(stats.episodes);
    const displayLabel = statMode === "hours" ? "Hours" : "Eps";

    return (
        <div
            className="profile-dropdown open"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="sidebar-user">
                <div className="user-avatar-container">
                    <img
                        src={
                            user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=6a5acd&color=fff`
                        }
                        alt={user?.name || "User"}
                        className="sidebar-avatar"
                    />
                    <div className="online-status" aria-label="Online" />
                </div>

                <div className="sidebar-user-info">
                    <div className="sidebar-username">
                        {user?.name || "Otaku"}
                    </div>
                    <LevelBadge />
                    <div className="sidebar-user-stats">
                        <div className="stat-item">
                            <span className="stat-number">{stats.anime}</span>
                            <span className="stat-label">Anime</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span
                                className="stat-number toggle-number"
                                title={`${statMode === "hours" ? stats.hours : stats.episodes} ${displayLabel}`}
                                style={{
                                    opacity: animating ? 0 : 1,
                                    transition: "opacity 0.15s ease",
                                }}
                            >
                                {displayValue}
                            </span>
                            <span
                                className="stat-label toggle-label"
                                style={{
                                    opacity: animating ? 0 : 1,
                                    transition: "opacity 0.15s ease",
                                }}
                            >
                                {displayLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <SidebarNav onNavigate={onClose} />
        </div>
    );
}
