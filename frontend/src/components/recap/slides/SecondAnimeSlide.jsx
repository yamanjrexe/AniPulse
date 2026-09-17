import React from "react";

export default function SecondAnimeSlide({ data }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-medal" />
            </div>
            <h1>{data.secondAnime?.title || "None"}</h1>
            <p className="subtitle">Second Highest Rated</p>
            {data.secondAnime ? (
                <p className="score">
                    <i className="fas fa-star" /> {data.secondAnime.score}
                </p>
            ) : (
                <p className="hint">Need more ratings</p>
            )}
        </>
    );
}
