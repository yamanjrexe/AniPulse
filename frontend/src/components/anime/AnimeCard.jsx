import React from "react";

export default function AnimeCard({ anime, onClick }) {
    const score = anime.score ? parseFloat(anime.score).toFixed(1) : null;
    const cover =
        anime.cover ||
        "https://placehold.co/300x400/6a5acd/white?text=No+Image";
    const episodesText = anime.episodes ? `${anime.episodes} Eps` : "";

    return (
        <div
            className="anime-card fade-in"
            onClick={() => onClick?.(anime)}
            style={{ minWidth: 0 }}
        >
            <div className="anime-img-wrapper">
                <img
                    src={cover}
                    alt={anime.title}
                    className="anime-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src =
                            "https://placehold.co/300x400/6a5acd/white?text=No+Image";
                    }}
                />
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
                {anime.userStatus === "Watching" && anime.progress > 0 && (
                    <>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar blue"
                                style={{
                                    width: `${Math.min(100, (anime.progress / (anime.episodes || 1)) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="progress-text">
                            <span>
                                {anime.progress}/{anime.episodes || "?"}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
