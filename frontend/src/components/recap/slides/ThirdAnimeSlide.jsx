import React from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

export default function ThirdAnimeSlide({ data }) {
  return (
    <>
      <p className="subtitle">Third Highest Rated</p>

      {data.thirdAnime ? (
        <div className="top-anime-showcase">
          <div className="recap-poster-wrapper">
            <PosterImage anime={data.thirdAnime} alt={data.thirdAnime.title} />
          </div>
          <h1 className="clamped-title" title={data.thirdAnime.title}>
            {data.thirdAnime.title}
          </h1>
          <div className="score-badge-large">
            <i className="fas fa-star" /> {data.thirdAnime.score}
          </div>
        </div>
      ) : (
        <h1>None</h1>
      )}
    </>
  );
}
