import React, { useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";

export default function AnimeDNA() {
    const { animeData } = useAnime();

    const dna = useMemo(() => {
        const completed = animeData.filter((a) => a.userStatus === "Completed");
        if (!completed.length) return { genre: "—", score: "—", format: "—" };

        const gc = {};
        completed.forEach((a) =>
            (a.genres || []).forEach((g) => {
                if (g !== "Award Winning") gc[g] = (gc[g] || 0) + 1;
            }),
        );
        const genre =
            Object.entries(gc).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        const scored = completed.filter((a) => a.score > 0);
        const score = scored.length
            ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(
                  1,
              )
            : "—";

        const tc = {};
        completed.forEach((a) => {
            const t = a.type || "TV";
            tc[t] = (tc[t] || 0) + 1;
        });
        const format =
            Object.entries(tc).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        return { genre, score, format };
    }, [animeData]);

    return (
        <section className="dashboard-section">
            <h2 className="section-title">
                <i className="fas fa-dna" aria-hidden="true" /> Your Anime DNA
            </h2>
            <div className="dna-grid">
                <div className="dna-card">
                    <span className="dna-label">Favorite Genre</span>
                    <span className="dna-value">{dna.genre}</span>
                </div>
                <div className="dna-card">
                    <span className="dna-label">Average Score</span>
                    <span className="dna-value">{dna.score}</span>
                </div>
                <div className="dna-card">
                    <span className="dna-label">Preferred Format</span>
                    <span className="dna-value">{dna.format}</span>
                </div>
            </div>
        </section>
    );
}
