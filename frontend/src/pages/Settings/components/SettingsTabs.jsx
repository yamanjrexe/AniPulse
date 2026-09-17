import React from "react";

const TABS = [
    { k: "profile", l: "Profile", icon: "fa-user" },
    { k: "appearance", l: "Appearance", icon: "fa-palette" },
    { k: "experience", l: "Experience", icon: "fa-star" },
    { k: "sync", l: "Sync & Backup", icon: "fa-cloud" },
    { k: "danger", l: "Danger Zone", icon: "fa-exclamation-triangle" },
];

export default function SettingsTabs({ active, onChange }) {
    return (
        <div className="settings-tabs">
            {TABS.map((t) => (
                <button
                    key={t.k}
                    className={`settings-tab ${active === t.k ? "active" : ""}`}
                    onClick={() => onChange(t.k)}
                >
                    <i className={`fas ${t.icon}`} />
                    <span>{t.l}</span>
                </button>
            ))}
        </div>
    );
}
