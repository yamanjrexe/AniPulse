import React from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";

function timeAgo(ts) {
    if (!ts) return "Just now";
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return d.toLocaleDateString();
}

const ICONS = {
    added: { cls: "added", icon: "plus" },
    completed: { cls: "completed", icon: "check" },
    watching: { cls: "watching", icon: "play" },
    edited: { cls: "edited", icon: "edit" },
    deleted: { cls: "deleted", icon: "trash" },
};

export default function RecentActivity() {
    const { activityLog } = useAnime();

    return (
        <section className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-history" /> Recent Activity
            </h2>
            <div className="activity-card fade-in">
                <div className="activity-header">
                    <div className="activity-title">Latest Changes</div>
                </div>
                <div className="activity-list">
                    {activityLog.length === 0 && (
                        <div className="no-activity">No recent activity.</div>
                    )}
                    {activityLog.slice(0, 6).map((a) => {
                        const info = ICONS[a.action] || ICONS.edited;
                        const text =
                            a.action === "added"
                                ? `Added ${a.animeTitle} to your list`
                                : a.action === "completed"
                                  ? `Completed ${a.animeTitle}`
                                  : a.action === "watching"
                                    ? `Started watching ${a.animeTitle}`
                                    : a.action === "deleted"
                                      ? `Removed ${a.animeTitle}`
                                      : `Updated ${a.animeTitle}`;
                        return (
                            <div key={a.id} className="activity-item">
                                <div className={`activity-icon ${info.cls}`}>
                                    <i className={`fas fa-${info.icon}`} />
                                </div>
                                <div className="activity-content">
                                    <div className="activity-anime">
                                        {a.animeTitle}
                                    </div>
                                    <div className="activity-desc">{text}</div>
                                </div>
                                <div className="activity-time">
                                    {timeAgo(a.timestamp)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
