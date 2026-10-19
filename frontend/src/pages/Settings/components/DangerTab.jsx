import React, { useState, useMemo, useRef, useEffect } from "react";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { animeService } from "../../../services/animeService.js";

function extractYear(value) {
  if (!value || typeof value !== "string") return null;
  const m = value.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function completionYear(anime) {
  return (
    extractYear(anime.actualFinishDate) || extractYear(anime.finishDate) || null
  );
}

function addedYear(anime) {
  return extractYear(anime.createdAt) || extractYear(anime.updatedAt) || null;
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DangerTab() {
  const { showToast } = useToast();
  const { animeData } = useAnime();

  const [exportOpen, setExportOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!exportOpen) return;

    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setExportOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  const { completionYears, addedYears, totalCount } = useMemo(() => {
    const comp = new Map();
    const added = new Map();

    for (const a of animeData) {
      const cy = completionYear(a);
      if (cy) comp.set(cy, (comp.get(cy) || 0) + 1);

      const ay = addedYear(a);
      if (ay) added.set(ay, (added.get(ay) || 0) + 1);
    }

    const sortDesc = (m) => [...m.entries()].sort((a, b) => b[0] - a[0]);

    return {
      completionYears: sortDesc(comp),
      addedYears: sortDesc(added),
      totalCount: animeData.length,
    };
  }, [animeData]);

  const exportAll = () => {
    if (!animeData.length) {
      showToast("No data to export", "error");
      return;
    }
    downloadJson(animeData, `My Anime List - All (${animeData.length}).json`);
    showToast(`Exported all ${animeData.length} anime`, "success");
    setExportOpen(false);
  };

  const exportByCompletionYear = (year, count) => {
    const filtered = animeData.filter((a) => completionYear(a) === year);
    if (!filtered.length) {
      showToast(`No anime completed in ${year}`, "error");
      return;
    }
    downloadJson(filtered, `My Anime List - Completed ${year}.json`);
    showToast(`Exported ${count} anime from ${year}`, "success");
    setExportOpen(false);
  };

  const exportByAddedYear = (year, count) => {
    const filtered = animeData.filter((a) => addedYear(a) === year);
    if (!filtered.length) {
      showToast(`No anime added in ${year}`, "error");
      return;
    }
    downloadJson(filtered, `My Anime List - Added ${year} (${count}).json`);
    showToast(`Exported ${count} anime added in ${year}`, "success");
    setExportOpen(false);
  };

  const executeClearAll = async () => {
    setShowClearConfirm(false);

    try {
      showToast("Deleting cloud data...", "info", 2000);
      // Wipe the cloud database first
      await animeService.saveCloud([]);
      await animeService.saveActivity([]);
    } catch (err) {
      console.error("Failed to clear cloud data:", err);
      showToast("Failed to clear cloud data, clearing local only.", "error");
    }

    // Clear browser local storage and log out
    localStorage.clear();
    window.location.href = "/login";
  };

  const hasData = animeData.length > 0;

  return (
    <div className="settings-tab-content active" id="tab-danger">
      <div className="danger-zone">
        <h3>
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />{" "}
          Danger Zone
        </h3>
        <p>These actions are irreversible. Please proceed with caution.</p>

        <div className="danger-actions">
          <button
            className="btn btn-danger"
            onClick={() => setShowClearConfirm(true)}
          >
            <i className="fas fa-trash" /> Clear All Data
          </button>

          <div className="export-dropdown" ref={menuRef}>
            <button
              className="btn btn-success"
              onClick={() => setExportOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              disabled={!hasData}
              title={hasData ? "" : "No data to export"}
            >
              <i className="fas fa-file-export" /> Export Data as JSON
              <i
                className={`fas fa-chevron-${exportOpen ? "up" : "down"} export-caret`}
              />
            </button>

            {exportOpen && (
              <div className="export-menu" role="menu">
                <button
                  className="export-menu-item export-menu-item-all"
                  role="menuitem"
                  onClick={exportAll}
                >
                  <i className="fas fa-database" />
                  <span className="export-menu-label">All Data</span>
                  <span className="export-menu-count">{totalCount}</span>
                </button>

                {completionYears.length > 0 && (
                  <>
                    <div className="export-menu-section">
                      <i className="fas fa-check-circle" />
                      By Completion Year
                    </div>
                    {completionYears.map(([year, count]) => (
                      <button
                        key={`c-${year}`}
                        className="export-menu-item"
                        role="menuitem"
                        onClick={() => exportByCompletionYear(year, count)}
                      >
                        <i className="fas fa-calendar-check" />
                        <span className="export-menu-label">{year}</span>
                        <span className="export-menu-count">{count}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          className="settings-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("openRecap"))}
        >
          <i className="fas fa-chart-line" /> View Recap
        </button>
      </div>

      {/* CUSTOM DANGER MODAL */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            padding: "20px",
            animation: "fadeIn 150ms ease-out",
          }}
        >
          <div
            style={{
              background: "var(--bg-card, #1A2234)",
              border: "1px solid var(--border-default, #333)",
              borderRadius: "16px",
              padding: "32px 24px",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)",
              animation: "zoomIn 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "var(--brand-red, #EF4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
                fontSize: "28px",
              }}
            >
              <i className="fas fa-exclamation-triangle" />
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              Delete All Data?
            </h3>

            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "24px",
              }}
            >
              This will permanently delete your entire anime list, activity
              history, and achievements from{" "}
              <strong>both this device and the cloud</strong>.
              <br />
              <br />
              <span
                style={{ color: "var(--brand-red, #EF4444)", fontWeight: 600 }}
              >
                This action CANNOT be undone.
              </span>
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={executeClearAll}
                style={{ flex: 1 }}
              >
                <i className="fas fa-trash" /> Yes, Delete Everything
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
