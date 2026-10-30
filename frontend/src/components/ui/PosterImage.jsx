// src/components/ui/PosterImage.jsx
import React, { useEffect, useState } from "react";
import { tmdbService } from "../../services/tmdbService.js";

const PLACEHOLDER = "https://placehold.co/140x210/111111/555555?text=No+Poster";

function isTmdbUrl(url) {
  return typeof url === "string" && url.startsWith("https://image.tmdb.org/");
}

function isAnilistUrl(url) {
  if (typeof url !== "string") return false;
  return url.includes("anilist.co") || url.includes("anili.st");
}

// --- TOP 8 CACHE LOGIC ---
let _top8Ids = null;

function getTop8Ids() {
  if (_top8Ids) return _top8Ids;
  try {
    const data = JSON.parse(localStorage.getItem("animeData") || "[]");
    const sorted = [...data].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0),
    );
    _top8Ids = new Set(sorted.slice(0, 8).map((a) => String(a.id)));
  } catch {
    _top8Ids = new Set();
  }
  return _top8Ids;
}

// Reset the cache whenever the anime list updates (e.g., new anime added, score changed)
if (typeof window !== "undefined") {
  window.addEventListener("animeUpdate", () => {
    _top8Ids = null;
  });
}
// -------------------------

export default function PosterImage({
  anime,
  alt,
  className,
  style,
  aspectRatio = "2 / 3",
  ...rest
}) {
  const [src, setSrc] = useState(() => anime?.cover || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!anime) return;

    const cover = anime.cover;
    const isTop8 = getTop8Ids().has(String(anime.id));
    const isCustom = cover && !isAnilistUrl(cover) && !isTmdbUrl(cover);

    // 1. Top 8 Custom URL: Show immediately
    if (isCustom && isTop8) {
      setSrc(cover);
      setFailed(false);
      return;
    }

    // 2. TMDB URL: Show immediately
    if (isTmdbUrl(cover)) {
      setSrc(cover);
      setFailed(false);
      return;
    }

    // 3. Everything else: Fetch TMDB, fallback to AniList/Custom if TMDB fails
    let cancelled = false;

    // Set initial source to the cover (AniList or Custom) to prevent blank flashes
    setSrc(cover || null);
    setFailed(false);

    tmdbService.getPoster(anime).then((tmdbUrl) => {
      if (!cancelled) {
        // If TMDB returns a poster, use it. If not, keep the AniList/Custom cover.
        // Only show PLACEHOLDER if both TMDB and AniList are missing.
        setSrc(tmdbUrl || cover || PLACEHOLDER);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [anime?.id, anime?.title, anime?.cover]);

  const displaySrc = failed ? PLACEHOLDER : src || PLACEHOLDER;

  return (
    <img
      src={displaySrc}
      alt={alt || anime?.title || "Anime poster"}
      className={className}
      style={{
        width: "100%",
        aspectRatio,
        objectFit: "cover",
        display: "block",
        background: "var(--bg-surface)",
        ...style,
      }}
      onError={() => setFailed(true)}
      loading="lazy"
      {...rest}
    />
  );
}
