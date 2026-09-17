import React from "react";

export default function TopGenreSlide({ data }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-tags" />
            </div>
            <h1>{data.topGenre}</h1>
            <p className="subtitle">Favorite Genre</p>
            <p className="hint">Your most watched category</p>
            <div className="genre-list">
                {data.topGenre && (
                    <span className="genre-badge primary">{data.topGenre}</span>
                )}
                {data.secondGenre !== "—" && (
                    <span className="genre-badge secondary">
                        {data.secondGenre}
                    </span>
                )}
                {data.thirdGenre !== "—" && (
                    <span className="genre-badge tertiary">
                        {data.thirdGenre}
                    </span>
                )}
            </div>
        </>
    );
}
