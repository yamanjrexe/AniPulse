import React from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

export default function TopAnimeSlide({ data }) {
  return (
    <>
      <p className="subtitle">Your Top Rated Anime</p>

      {data.topAnime ? (
        <div className="top-anime-showcase">
          <div className="recap-poster-wrapper">
            <PosterImage anime={data.topAnime} alt={data.topAnime.title} />
          </div>
          <h1 className="clamped-title" title={data.topAnime.title}>
            {data.topAnime.title}
          </h1>
          <div className="score-badge-large">
            <i className="fas fa-star" /> {data.topAnime.score}
          </div>
        </div>
      ) : (
        <h1>None</h1>
      )}
    </>
  );
}
