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
                <div className="no-anime">No highly rated anime yet.</div>
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
