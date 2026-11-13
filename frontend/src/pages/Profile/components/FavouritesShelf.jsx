import React from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

export default function FavouritesShelf({ items, isOwner, onEdit }) {
  const slots = Array(5).fill(null);
  (items || []).forEach((item, index) => {
    if (index < 5) slots[index] = item;
  });

  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Favorites</h2>
      <p className="slotsFilled">{items?.length || 0} / 5 slots filled</p>
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
