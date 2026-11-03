import React from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

export default function SecondAnimeSlide({ data }) {
  return (
    <>
      <p className="subtitle">Second Highest Rated</p>

      {data.secondAnime ? (
        <div className="top-anime-showcase">
          <div className="recap-poster-wrapper">
            <PosterImage
              anime={data.secondAnime}
              alt={data.secondAnime.title}
            />
          </div>
          <h1 className="clamped-title" title={data.secondAnime.title}>
            {data.secondAnime.title}
          </h1>
          <div className="score-badge-large">
            <i className="fas fa-star" /> {data.secondAnime.score}
          </div>
        </div>
      ) : (
        <h1>None</h1>
      )}
    </>
  );
}
