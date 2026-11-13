import React from "react";
import { ACHIEVEMENTS } from "../../../services/achievements.js";

export default function AchievementsShelf({ achievements }) {
  const unlockedIds = achievements || [];

  const completed = ACHIEVEMENTS.filter((a) =>
    unlockedIds.includes(a.id),
  ).slice(0, 3);
  const remaining = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));

  const inProgress = remaining.slice(0, 3);
  const locked = remaining.slice(3, 5);

  const displayItems = [
    ...completed.map((a) => ({ ...a, state: "completed" })),
    ...inProgress.map((a) => ({ ...a, state: "progress" })),
    ...locked.map((a) => ({ ...a, state: "locked" })),
  ];

  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Achievements</h2>
      <div className="achievementsGrid">
        {displayItems.map((ach) => (
          <div key={ach.id} className={`achievementBadge ${ach.state}`}>
            <div className="achIcon">
              <i className={`fas ${ach.icon}`} />
            </div>
            <div className="achTitle">{ach.title}</div>
            <div className="achDesc">{ach.desc}</div>
            <div className={`achStatus ${ach.state}`}>
              {ach.state === "completed" && "Completed"}
              {ach.state === "progress" && "In Progress"}
              {ach.state === "locked" && "Locked"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
