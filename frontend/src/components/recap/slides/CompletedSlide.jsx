import React from "react";

export default function CompletedSlide({ data, isYearly }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-tv" />
            </div>
            <h1>{data.totalAnime}</h1>
            <p className="subtitle">Anime Completed</p>
            <p className="hint">
                {isYearly ? "Over 12 months" : "In one month"}
            </p>
            <div className="stat-badge">
                <span>
                    <i className="fas fa-film" /> {data.totalEpisodes} episodes
                </span>
            </div>
        </>
    );
}
