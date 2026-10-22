import React from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import AnimeCard from "../../../components/anime/AnimeCard.jsx";

export default function TopRated() {
  const { animeData } = useAnime();
  const top = animeData
    .filter((a) => a.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!top.length) {
    return (
      <section className="dashboard-section">
        <h2 className="section-title">
          <i className="fas fa-star" /> Top Rated Anime
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            background: "var(--bg-card)",
            border: "1px dashed var(--border-default)",
            borderRadius: "var(--r-md)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <i
              className="fas fa-star"
              style={{
                fontSize: "24px",
                color: "var(--brand-yellow)",
                opacity: 0.8,
              }}
            />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              marginBottom: "8px",
              color: "var(--text-primary)",
            }}
          >
            No highly rated anime yet
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              maxWidth: "300px",
              margin: "0 0 20px 0",
              lineHeight: 1.5,
            }}
          >
            Rate an anime 8.0 or higher and it will be featured here on your
            dashboard.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openAddAnimeModal"))
            }
          >
            <i className="fas fa-plus" /> Add Anime
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <h2 className="section-title">
        <i className="fas fa-star" /> Top Rated Anime
      </h2>
      <div className="top-anime-grid" id="top-rated-anime">
        {top.map((a) => (
          <AnimeCard
            key={a.id}
            anime={a}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("openEditAnimeModal", {
                  detail: { id: a.id },
                }),
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
