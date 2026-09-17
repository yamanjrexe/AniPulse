import React from "react";
import { useLevel } from "../../context/LevelContext.jsx";

export default function XpQueueCard() {
    const {
        queue = [],
        queueCount = 0,
        queueXP = 0,
        todayXP = 0,
        dailyLimit = 1500,
        processQueue,
    } = useLevel();

    const dailyPercent = Math.min(
        100,
        Math.floor((todayXP / dailyLimit) * 100),
    );

    return (
        <div className="settings-group queue-status-card">
            <h3>
                <i className="fas fa-clock" aria-hidden="true" /> XP Queue
                Status
            </h3>

            <div className="queue-info">
                <div className="queue-stats">
                    <div className="queue-stat-item">
                        <span className="queue-label">Queued XP:</span>
                        <span className="queue-value">
                            {(queueXP || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="queue-stat-item">
                        <span className="queue-label">Queue Items:</span>
                        <span className="queue-value">{queueCount || 0}</span>
                    </div>
                    <div className="queue-stat-item">
                        <span className="queue-label">Today's XP:</span>
                        <span className="queue-value">
                            {(todayXP || 0).toLocaleString()}
                        </span>
                        <span className="queue-max">
                            / {(dailyLimit || 1500).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="queue-progress">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${dailyPercent}%` }}
                        />
                    </div>
                    <span className="queue-percent">{dailyPercent}%</span>
                </div>

                <div
                    className={`queue-message ${queueCount > 0 ? "has-queue" : ""}`}
                >
                    {queueCount > 0 ? (
                        <>
                            <i className="fas fa-clock" aria-hidden="true" />{" "}
                            {queueCount} item
                            {queueCount > 1 ? "s" : ""} queued (
                            {(queueXP || 0).toLocaleString()} XP total). Will be
                            added when daily limit resets.
                        </>
                    ) : (
                        <>
                            <i
                                className="fas fa-check-circle"
                                aria-hidden="true"
                            />{" "}
                            No pending XP in queue
                        </>
                    )}
                </div>

                {queueCount > 0 && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={processQueue}
                        style={{ marginTop: 12 }}
                    >
                        <i className="fas fa-play" aria-hidden="true" /> Process
                        Queue Now
                    </button>
                )}
            </div>
        </div>
    );
}
