import React from "react";
import { useSearchParams } from "react-router-dom";
import SettingsTabs from "./components/SettingsTabs.jsx";
import ProfileTab from "./components/ProfileTab.jsx";
import AppearanceTab from "./components/AppearanceTab.jsx";
import ExperienceTab from "./components/ExperienceTab.jsx";
import SyncTab from "./components/SyncTab.jsx";
import DangerTab from "./components/DangerTab.jsx";

const VALID_TABS = ["profile", "appearance", "experience", "sync", "danger"];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTab = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(paramTab) ? paramTab : "profile";

  const changeTab = (newTab) => {
    if (!VALID_TABS.includes(newTab)) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);

    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="dashboard-section">
      <h2 className="section-title">
        <i className="fas fa-user" aria-hidden="true" /> Profile Settings
      </h2>

      <SettingsTabs active={activeTab} onChange={changeTab} />

      <div className="settings-content">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "experience" && <ExperienceTab />}
        {activeTab === "sync" && <SyncTab />}
        {activeTab === "danger" && <DangerTab />}
      </div>
    </div>
  );
}
