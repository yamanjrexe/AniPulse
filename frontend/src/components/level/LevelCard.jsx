import React from "react";
import { useLevel } from "../../context/LevelContext.jsx";
import { getLevelStats } from "../../services/levelSystem.js";

export default function LevelCard() {
    const { profile } = useLevel();

    const totalExp = profile?.totalExp || 0;
    const { current, next, percent, remaining } = getLevelStats(totalExp);

    return (
        <div className="level-card settings-level-card">
            <div className="level-card-header">
                <div className="level-rank">
                    <div className="level-badge-image">
                        <i
                            className="fas fa-user-astronaut"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="level-title-wrap">
                        <div className="level-title">{current.title}</div>
                        <div className="level-subtitle">
                            Level {current.level}
                        </div>
                    </div>
                </div>
                <div className="level-number">
                    {totalExp.toLocaleString()} XP
                </div>
            </div>

            <div className="level-progress">
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="progress-row">
                    <div className="progress-stats">
                        <span className="current">
                            {totalExp.toLocaleString()}
                        </span>
                        <span> / </span>
                        <span className="next">
                            {next.xpRequired.toLocaleString()}
                        </span>
                        <span> XP</span>
                    </div>
                    <div className="progress-percent">{percent}%</div>
                </div>
            </div>

            <div className="level-next">
                <i className="fas fa-arrow-up" aria-hidden="true" />{" "}
                {next.level !== current.level
                    ? `Next: ${next.title} at ${next.xpRequired.toLocaleString()} XP (${remaining.toLocaleString()} to go)`
                    : "Max level reached"}
            </div>
        </div>
    );
}
