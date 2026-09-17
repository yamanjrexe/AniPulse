import React from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import AnimeCard from "../../../components/anime/AnimeCard.jsx";

export default function CurrentlyWatching() {
    const { animeData } = useAnime();
    const watching = animeData.filter((a) => a.userStatus === "Watching");

    if (!watching.length) return null;

    return (
        <section className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-eye" /> Currently Watching
            </h2>
            <div className="top-anime-grid">
                {watching.map((a) => (
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
