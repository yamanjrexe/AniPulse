import React from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";

export default function WatchingSidebar({ items }) {
  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Watching list</h2>
      <div className="watchingList">
        {!items || items.length === 0 ? (
          <div className="emptyStateCard small">
            <p>Not watching anything right now.</p>
          </div>
        ) : (
          items.map((anime) => {
            const current = anime.progress || 0;
            const epLabel = current === 1 ? "Ep" : "Eps";

            return (
              <div key={anime.id} className="watchingItem">
                <div className="watchingPoster">
                  <PosterImage anime={anime} />
                </div>
                <div className="watchingInfo">
                  <div className="watchingTitle" title={anime.title}>
                    {anime.title}
                  </div>
                  <div className="watchingMeta">
                    <span className="meta-label">Watched</span>
                    <span className="meta-badge">
                      {current} <span className="meta-unit">{epLabel}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
