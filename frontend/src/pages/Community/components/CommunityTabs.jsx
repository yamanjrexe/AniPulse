import React from "react";

const TABS = [
    { k: "friends", l: "Friends", icon: "fa-user-friends" },
    { k: "feed", l: "Feed", icon: "fa-newspaper" },
    { k: "discussions", l: "Discussions", icon: "fa-comments" },
    { k: "leaderboard", l: "Leaderboard", icon: "fa-trophy" },
];

export default function CommunityTabs({ active, onChange }) {
    return (
        <div className="community-tabs">
            {TABS.map((t) => (
                <button
                    key={t.k}
                    className={`community-tab ${active === t.k ? "active" : ""}`}
                    onClick={() => onChange(t.k)}
                >
                    <i className={`fas ${t.icon}`} aria-hidden="true" /> {t.l}
                </button>
            ))}
        </div>
    );
}
