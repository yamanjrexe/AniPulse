import React from "react";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function HiddenAnimeManager({ profile, setProfile }) {
  const { animeData } = useAnime();
  const { showToast } = useToast();

  const toggleHiddenAnime = (animeId) => {
    const hidden = profile.hiddenAnimeIds || [];
    const nextHidden = hidden.includes(animeId)
      ? hidden.filter((id) => id !== animeId)
      : [...hidden, animeId];

    const nextProfile = { ...profile, hiddenAnimeIds: nextHidden };
    setProfile(nextProfile);
    localStorage.setItem("userProfile", JSON.stringify(nextProfile));
    window.dispatchEvent(new CustomEvent("syncSchedule"));
  };

  return (
    <div
      style={{
        maxHeight: 300,
        overflowY: "auto",
        background: "var(--bg-surface)",
        borderRadius: 8,
        padding: 10,
      }}
    >
      {animeData.map((anime) => {
        const isHidden = (profile.hiddenAnimeIds || []).includes(
          String(anime.id),
        );
        return (
          <div
            key={anime.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}
              >
                {anime.title}
              </span>
            </div>
            <button
              className={`btn ${isHidden ? "btn-danger" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={() => toggleHiddenAnime(String(anime.id))}
            >
              {isHidden ? "Hidden" : "Visible"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
