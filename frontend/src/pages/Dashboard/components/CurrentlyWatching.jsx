import React, { useState } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useSync } from "../../../context/SyncContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import PosterImage from "../../../components/ui/PosterImage.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

export default function CurrentlyWatching() {
  const { animeData, setAnimeData, logActivity } = useAnime();
  const { syncToCloud } = useSync();
  const { showToast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null);

  const watching = animeData.filter((a) => a.userStatus === "Watching");

  if (!watching.length) return null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const newList = animeData.filter((a) => a.id !== deleteTarget.id);
      setAnimeData(newList);
      logActivity("deleted", deleteTarget.title);
      await syncToCloud();
      showToast(
        `"${deleteTarget.title}" removed from watching list`,
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to delete anime", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="dashboard-section" id="currently-watching-section">
      <h2 className="section-title">
        <i className="fas fa-play-circle" /> Currently Watching
      </h2>
      <div className="watching-grid">
        {watching.map((a) => {
          const totalEps = a.episodes || 0;
          const currentEps = a.progress || 0;
          const percent =
            totalEps > 0
              ? Math.min(100, Math.round((currentEps / totalEps) * 100))
              : 0;

          return (
            <div
              key={a.id}
              className="watching-card"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("openEditAnimeModal", {
                    detail: { id: a.id },
                  }),
                )
              }
            >
              <div className="watching-media">
                <PosterImage anime={a} alt={a.title} />
                <div className="watching-overlay" />

                {/* DELETE BUTTON */}
                <button
                  className="watching-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(a);
                  }}
                  title="Remove from watching"
                >
                  <i className="fas fa-times" />
                </button>

                <div className="watching-bottom-badges">
                  <span className="ep-badge">EP {currentEps}</span>
                  <span className="progress-badge">
                    {currentEps}/{totalEps || "?"}
                  </span>
                </div>

                <div className="watching-progress-track">
                  <div
                    className="watching-progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="watching-info">
                <div className="watching-title" title={a.title}>
                  {a.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Are you sure you want to remove "${deleteTarget?.title}" from your watching list?`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
