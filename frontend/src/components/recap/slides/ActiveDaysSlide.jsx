import React from "react";

export default function ActiveDaysSlide({ data, isYearly }) {
    const denom = isYearly ? 365 : 30;
    const pct = Math.min(100, (data.streakDays / denom) * 100);
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-chart-line" />
            </div>
            <h1>{data.streakDays}</h1>
            <p className="subtitle">Active Watching Days</p>
            <p className="hint">
                {isYearly ? "Out of 365 days" : "Out of 30 days on average"}
            </p>
            <div className="streak-bar">
                <div className="streak-fill" style={{ width: `${pct}%` }} />
            </div>
            {isYearly && data.completionMonth && (
                <p className="hint">Busiest month: {data.completionMonth}</p>
            )}
        </>
    );
}
