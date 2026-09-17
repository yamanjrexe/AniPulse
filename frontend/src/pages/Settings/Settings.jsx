import React, { useState } from "react";
import SettingsTabs from "./components/SettingsTabs.jsx";
import ProfileTab from "./components/ProfileTab.jsx";
import AppearanceTab from "./components/AppearanceTab.jsx";
import ExperienceTab from "./components/ExperienceTab.jsx";
import SyncTab from "./components/SyncTab.jsx";
import DangerTab from "./components/DangerTab.jsx";

export default function Settings() {
    const [tab, setTab] = useState(
        () => localStorage.getItem("settingsActiveTab") || "profile",
    );

    const changeTab = (k) => {
        setTab(k);
        localStorage.setItem("settingsActiveTab", k);
    };

    return (
        <div className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-user" aria-hidden="true" /> Profile
                Settings
            </h2>

            <SettingsTabs active={tab} onChange={changeTab} />

            <div className="settings-content">
                {tab === "profile" && <ProfileTab />}
                {tab === "appearance" && <AppearanceTab />}
                {tab === "experience" && <ExperienceTab />}
                {tab === "sync" && <SyncTab />}
                {tab === "danger" && <DangerTab />}
            </div>
        </div>
    );
}
