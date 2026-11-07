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

let _top8Ids = null;
let _cachedAnimeData = null;

function getTop8Ids() {
  try {
    const raw = localStorage.getItem("animeData") || "[]";
    if (raw === _cachedAnimeData && _top8Ids) return _top8Ids;
    _cachedAnimeData = raw;
    const data = JSON.parse(raw);
    const sorted = [...data].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0),
    );
    _top8Ids = new Set(sorted.slice(0, 8).map((a) => String(a.id)));
  } catch {
    _top8Ids = new Set();
  }
  return _top8Ids;
}

if (typeof window !== "undefined") {
  window.addEventListener("animeUpdate", () => {
    _top8Ids = null;
    _cachedAnimeData = null;
  });
}

export default function PosterImage({
  anime,
  alt,
  className,
  style,
  aspectRatio = "2 / 3",
  ...rest
}) {
  const originalCover = anime?.cover || null;

  const [src, setSrc] = useState(() => {
    if (!originalCover) return null;

    const isTop8 = getTop8Ids().has(String(anime.id));

    // If it's Top 8, use the database cover immediately (preserve custom covers)
    if (isTop8) return originalCover;

    // If it's a custom user upload (not AniList, not TMDB), preserve it
    if (!isAnilistUrl(originalCover) && !isTmdbUrl(originalCover)) {
      return originalCover;
    }

    // Otherwise, start with null and fetch the correct one
    return null;
  });

  const [fallbackSrc, setFallbackSrc] = useState(originalCover);

  useEffect(() => {
    if (!anime) return;

    const cover = anime.cover;
    setFallbackSrc(cover);

    const isTop8 = getTop8Ids().has(String(anime.id));

    // 1. Protect Top 8 anime
    if (isTop8 && cover) {
      setSrc(cover);
      return;
    }

    // 2. Protect custom user-uploaded covers
    const isCustom = cover && !isAnilistUrl(cover) && !isTmdbUrl(cover);
    if (isCustom) {
      setSrc(cover);
      return;
    }

    // 3. FORCE FETCH for everything else (This fixes the old wrong TMDB URLs)
    let cancelled = false;
    setSrc(cover || null);

    tmdbService.getPoster(anime).then((tmdbUrl) => {
      if (!cancelled) {
        setSrc(tmdbUrl || cover || PLACEHOLDER);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [anime?.id, anime?.title, anime?.cover]);

  const handleError = () => {
    if (src !== fallbackSrc && fallbackSrc) {
      setSrc(fallbackSrc);
    } else {
      setSrc(PLACEHOLDER);
    }
  };

  return (
    <img
      src={src || PLACEHOLDER}
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
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
}
