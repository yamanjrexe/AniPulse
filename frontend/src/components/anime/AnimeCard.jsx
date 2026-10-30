import React from "react";
import PosterImage from "../ui/PosterImage.jsx";

export default function AnimeCard({ anime, onClick }) {
  const score = anime.score ? parseFloat(anime.score).toFixed(1) : null;
  const episodesText = anime.episodes ? `${anime.episodes} Eps` : "";

  const totalEpisodes = anime.episodes || 0;
  const progress = anime.progress || 0;
  const percent =
    totalEpisodes > 0
      ? Math.min(100, Math.round((progress / totalEpisodes) * 100))
      : 0;

  return (
    <div
      className="anime-card fade-in"
      onClick={() => onClick?.(anime)}
      style={{ minWidth: 0 }}
    >
      <div className="anime-img-wrapper">
        <PosterImage anime={anime} alt={anime.title} className="anime-cover" />
        {score && <div className="rating-badge">⭐ {score}</div>}
      </div>
      <div className="anime-info" style={{ minWidth: 0 }}>
        <div
          className="anime-title"
          title={anime.title}
          style={{
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: "unset",
            lineClamp: "unset",
            WebkitBoxOrient: "unset",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {anime.title}
        </div>
        <div className="anime-meta">
          <span>{anime.type || "TV"}</span>
          {episodesText && <span>{episodesText}</span>}
        </div>
        {anime.userStatus === "Watching" && progress > 0 && (
          <>
            <div className="progress-bar-container">
              <div
                className="progress-bar blue"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="progress-text">
              <span>
                {progress}/{anime.episodes || "?"}
              </span>
              <span className="percentage-text">{percent}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
