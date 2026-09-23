import React, { useState, useMemo, useRef, useEffect } from "react";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";

/* ============================================================
   HELPERS
   ============================================================ */

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

/* ============================================================
   COMPONENT
   ============================================================ */

export default function DangerTab() {
  const { showToast } = useToast();
  const { animeData } = useAnime();

  const [exportOpen, setExportOpen] = useState(false);
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

  /* ---------------- EXPORT ACTIONS ---------------- */

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

  /* ---------------- CLEAR ---------------- */

  const clearAll = () => {
    if (
      !window.confirm(
        "⚠️ This will delete ALL your data. Are you absolutely sure?",
      )
    )
      return;
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ---------------- RENDER ---------------- */

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
          <button className="btn btn-danger" onClick={clearAll}>
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
                {/* ---- All ---- */}
                <button
                  className="export-menu-item export-menu-item-all"
                  role="menuitem"
                  onClick={exportAll}
                >
                  <i className="fas fa-database" />
                  <span className="export-menu-label">All Data</span>
                  <span className="export-menu-count">{totalCount}</span>
                </button>

                {/* ---- By completion year ---- */}
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
    </div>
  );
}
