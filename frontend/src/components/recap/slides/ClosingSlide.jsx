import React from "react";

export default function ClosingSlide({ data, periodText, isYearly }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-flag-checkered" />
            </div>
            <h1>Recap Complete!</h1>
            <p className="subtitle">{periodText || "Your journey"}</p>
            <div className="recap-summary">
                {data?.totalAnime != null && (
                    <div className="summary-item">
                        <i className="fas fa-tv" />
                        <span>{data.totalAnime} anime</span>
                    </div>
                )}
                {data?.totalHours != null && (
                    <div className="summary-item">
                        <i className="fas fa-clock" />
                        <span>{data.totalHours} hours</span>
                    </div>
                )}
                {data?.avgScore != null && (
                    <div className="summary-item">
                        <i className="fas fa-star" />
                        <span>{data.avgScore} avg score</span>
                    </div>
                )}
                {data?.topGenre && (
                    <div className="summary-item">
                        <i className="fas fa-tags" />
                        <span>{data.topGenre}</span>
                    </div>
                )}
            </div>
            <p className="hint">
                See you {isYearly ? "next year" : "next month"} for another
                recap!
            </p>
        </>
    );
}
