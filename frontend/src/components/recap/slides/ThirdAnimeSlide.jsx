import React from "react";

export default function ThirdAnimeSlide({ data }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-award" />
            </div>
            <h1>{data.thirdAnime?.title || "None"}</h1>
            <p className="subtitle">Third Highest Rated</p>
            {data.thirdAnime ? (
                <>
                    <p className="score">
                        <i className="fas fa-star" /> {data.thirdAnime.score}
                    </p>
                    <p className="hint">Completing the podium!</p>
                </>
            ) : (
                <p className="hint">Keep watching and rating</p>
            )}
        </>
    );
}
