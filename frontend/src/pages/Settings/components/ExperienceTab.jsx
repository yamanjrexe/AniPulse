import React, { useEffect, useMemo } from "react";
import { useLevel } from "../../../context/LevelContext.jsx";
import LevelCard from "../../../components/level/LevelCard.jsx";
import XpQueueCard from "../../../components/level/XpQueueCard.jsx";
import { LEVELS } from "../../../services/levelSystem.js";

export default function ExperienceTab() {
  const { refreshAll, level } = useLevel();

  useEffect(() => {
    refreshAll();
    const id = setInterval(() => {
      if (!document.hidden) refreshAll();
    }, 30000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Dynamically calculate the next 4 levels
  const upcomingLevels = useMemo(() => {
    return LEVELS.filter((l) => l.level > level).slice(0, 4);
  }, [level]);

  return (
    <div className="settings-tab-content active" id="tab-experience">
      <LevelCard />
      <XpQueueCard />

      {/* DYNAMIC LEVEL ROADMAP */}
      <div className="settings-group" style={{ marginTop: "24px" }}>
        <h3>
          <i className="fas fa-road" aria-hidden="true" /> Level Roadmap
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "16px",
          }}
        >
          Keep watching and completing anime to unlock these upcoming titles.
        </p>

        <div className="roadmap-list">
          {upcomingLevels.length > 0 ? (
            upcomingLevels.map((lvl) => (
              <div key={lvl.level} className="roadmap-item">
                <div className="roadmap-level">Lvl {lvl.level}</div>
                <div className="roadmap-info">
                  <span className="roadmap-title">{lvl.title}</span>
                  <span className="roadmap-xp">
                    {lvl.xpRequired.toLocaleString()} XP Required
                  </span>
                </div>
                <i className="fas fa-lock roadmap-lock" />
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "var(--brand-yellow)",
                fontWeight: 600,
              }}
            >
              <i className="fas fa-crown" /> You have reached the maximum level!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
