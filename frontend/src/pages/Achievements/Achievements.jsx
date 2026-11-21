import React from "react";
import { useSearchParams } from "react-router-dom";
import AchievementList from "./components/AchievementList.jsx";
import Titles from "./components/Titles.jsx";
import Frames from "./components/Frames.jsx";

export default function Achievements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "achievements";

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div id="achievements-page">
      <div className="achievements-tabs">
        <button
          className={`achievements-tab ${activeTab === "achievements" ? "active" : ""}`}
          onClick={() => handleTabChange("achievements")}
        >
          <i className="fas fa-trophy" />
          <span>Achievements</span>
        </button>
        <button
          className={`achievements-tab ${activeTab === "titles" ? "active" : ""}`}
          onClick={() => handleTabChange("titles")}
        >
          <i className="fas fa-crown" />
          <span>Titles</span>
        </button>
        <button
          className={`achievements-tab ${activeTab === "frames" ? "active" : ""}`}
          onClick={() => handleTabChange("frames")}
        >
          <i className="fas fa-image" />
          <span>Frames</span>
        </button>
      </div>

      {activeTab === "achievements" && <AchievementList />}
      {activeTab === "titles" && <Titles />}
      {activeTab === "frames" && <Frames />}
    </div>
  );
}
