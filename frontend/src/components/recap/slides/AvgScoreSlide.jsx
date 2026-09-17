import React from "react";

export default function AvgScoreSlide({ data }) {
    const score = parseFloat(data.avgScore) || 0;
    const hint =
        score >= 8
            ? "Great taste!"
            : score >= 7
              ? "Solid picks!"
              : "You're critical!";
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-star" />
            </div>
            <h1>{data.avgScore}</h1>
            <p className="subtitle">Average Score</p>
            <p className="hint">{hint}</p>
            <div className="rating-meter">
                <div
                    className="meter-fill"
                    style={{ width: `${(score / 10) * 100}%` }}
                />
            </div>
        </>
    );
}
