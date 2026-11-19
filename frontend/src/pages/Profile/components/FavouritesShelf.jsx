import React, { useState, useEffect } from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export default function FavouritesShelf({ items, isOwner, onEdit }) {
  const isSmallScreen = useMediaQuery("(max-width: 599px)");
  const maxSlots = isSmallScreen ? 4 : 5;
  const slots = Array(maxSlots).fill(null);

  (items || []).forEach((item, index) => {
    if (index < maxSlots) slots[index] = item;
  });

  const filledCount = Math.min(items?.length || 0, maxSlots);

  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Favorites</h2>
      <p className="slotsFilled">
        {filledCount} / {maxSlots} slots filled
      </p>
      <div className="favoritesGrid">
        {slots.map((anime, index) => (
          <div key={index} className="favoriteSlot">
            {anime ? (
              <>
                <PosterImage anime={anime} />
                {isOwner && <div></div>}
              </>
            ) : (
              <div className="slotEmpty" onClick={isOwner ? onEdit : undefined}>
                <i className="fas fa-plus" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
