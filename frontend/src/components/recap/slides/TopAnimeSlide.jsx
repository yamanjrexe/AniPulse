import React from "react";

export default function TopAnimeSlide({ data }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-crown" />
            </div>
            <h1>{data.topAnime?.title || "None"}</h1>
            <p className="subtitle">Top Rated Anime</p>
            {data.topAnime ? (
                <>
                    <p className="score">
                        <i className="fas fa-star" /> {data.topAnime.score}
                    </p>
                    <p className="hint">Your highest rated</p>
                </>
            ) : (
                <p className="hint">Rate your anime!</p>
            )}
        </>
    );
}
