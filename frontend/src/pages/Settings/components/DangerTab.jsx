import React, { useState, useMemo, useRef, useEffect } from "react";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useSync } from "../../../context/SyncContext.jsx";
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
  const { syncToCloud, loadFromCloud } = useSync();

  const [exportOpen, setExportOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
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

  const { completionYears, totalCount } = useMemo(() => {
    const comp = new Map();
    for (const a of animeData) {
      const cy = completionYear(a);
      if (cy) comp.set(cy, (comp.get(cy) || 0) + 1);
    }
    const sortDesc = (m) => [...m.entries()].sort((a, b) => b[0] - a[0]);
    return {
      completionYears: sortDesc(comp),
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

  const forcePushToCloud = async () => {
    if (
      !window.confirm(
        "This will overwrite your cloud data with your current local data. Continue?",
      )
    )
      return;
    setProcessing(true);
    try {
      const ok = await syncToCloud();
      if (ok) showToast("Successfully pushed local data to cloud", "success");
      else showToast("Failed to push to cloud", "error");
    } finally {
      setProcessing(false);
    }
  };

  const forcePullFromCloud = async () => {
    if (
      !window.confirm(
        "This will replace your local data with cloud data and refresh the page. Continue?",
      )
    )
      return;
    setProcessing(true);
    try {
      await loadFromCloud();
      showToast("Pulled cloud data successfully. Refreshing...", "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast("Failed to pull from cloud", "error");
      setProcessing(false);
    }
  };

  const clearLocalCache = () => {
    if (
      !window.confirm(
        "This will clear local cache and log you out. Your cloud data will NOT be deleted. Continue?",
      )
    )
      return;
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      caches
        .keys()
        .then((names) => names.forEach((name) => caches.delete(name)));
    }
    window.location.href = "/login";
  };

  const resetGamification = async () => {
    if (
      !window.confirm(
        "This will reset your XP, Level, and Streak back to zero. Your anime list will not be affected. Continue?",
      )
    )
      return;

    localStorage.setItem("userXP", "0");
    localStorage.setItem("userLevel", "1");
    localStorage.setItem("userLevelTitle", "Newbie");
    localStorage.setItem("streak", "0");
    localStorage.setItem("lastActive", "");
    localStorage.setItem("completedAnimeHistory", "{}");
    localStorage.setItem("xpPendingQueue", "[]");

    try {
      const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      profile.totalExp = 0;
      profile.level = 1;
      profile.title = "Newbie";
      localStorage.setItem("userProfile", JSON.stringify(profile));
    } catch (_) {}

    setProcessing(true);
    await syncToCloud();
    showToast("Gamification reset successfully. Refreshing...", "success");
    setTimeout(() => window.location.reload(), 1200);
  };

  const executeClearAll = async () => {
    setShowClearConfirm(false);
    setProcessing(true);
    try {
      showToast("Deleting cloud data...", "info", 2000);
      await animeService.saveCloud([]);
      await animeService.saveActivity([]);
    } catch (err) {
      console.error("Failed to clear cloud data:", err);
      showToast("Failed to clear cloud data, clearing local only.", "error");
    }
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="settings-tab-content active" id="tab-danger">
      {/* 1. DATA SYNC & RECOVERY */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-sync-alt" aria-hidden="true" /> Data Sync &
          Recovery
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          Manually force data to push or pull from the cloud. Useful if your
          local and cloud states get out of sync.
        </p>
        <div
          className="danger-actions"
          style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
        >
          <button
            className="btn btn-secondary"
            onClick={forcePullFromCloud}
            disabled={processing}
          >
            <i
              className={`fas ${processing ? "fa-spinner fa-spin" : "fa-cloud-download-alt"}`}
            />{" "}
            Force Pull from Cloud
          </button>
          <button
            className="btn btn-secondary"
            onClick={forcePushToCloud}
            disabled={processing}
          >
            <i
              className={`fas ${processing ? "fa-spinner fa-spin" : "fa-cloud-upload-alt"}`}
            />{" "}
            Force Push to Cloud
          </button>
        </div>
      </div>

      {/* 2. GAMIFICATION RESET */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-gamepad" aria-hidden="true" /> Gamification Reset
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          Want a fresh start on your leveling journey? This will reset your XP,
          Level, and Streak to zero, but will keep your anime list fully intact.
        </p>
        <div className="danger-actions">
          <button
            className="btn btn-warning"
            onClick={resetGamification}
            disabled={processing}
          >
            <i
              className={`fas ${processing ? "fa-spinner fa-spin" : "fa-undo"}`}
            />{" "}
            Reset XP, Level & Streak
          </button>
        </div>
      </div>

      {/* 3. DATA EXPORT */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-file-export" aria-hidden="true" /> Export Data
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          Download a permanent backup of your anime list in JSON format.
        </p>

        {/* FIXED EXPORT DROPDOWN WRAPPER */}
        <div
          style={{ position: "relative", display: "inline-block" }}
          ref={menuRef}
        >
          <button
            className="btn btn-success"
            onClick={() => setExportOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-file-export" /> Export Data as JSON
            <i
              className={`fas fa-chevron-${exportOpen ? "up" : "down"}`}
              style={{ fontSize: "0.8em", marginLeft: "4px" }}
            />
          </button>

          {exportOpen && (
            <div
              className="export-menu"
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 9999,
                minWidth: "240px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                padding: "6px",
                animation: "fadeIn 0.15s ease-out",
              }}
            >
              <button
                className="export-menu-item export-menu-item-all"
                onClick={exportAll}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                }}
              >
                <i
                  className="fas fa-database"
                  style={{ color: "var(--brand-yellow)" }}
                />
                <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>
                  All Data
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    background: "var(--bg-card)",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    fontSize: "0.8em",
                  }}
                >
                  {totalCount}
                </span>
              </button>

              {completionYears.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 10px 6px",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      borderTop: "1px solid var(--border-subtle)",
                      marginTop: "4px",
                    }}
                  >
                    <i className="fas fa-check-circle" /> By Completion Year
                  </div>
                  {completionYears.map(([year, count]) => (
                    <button
                      key={`c-${year}`}
                      className="export-menu-item"
                      onClick={() => exportByCompletionYear(year, count)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px",
                      }}
                    >
                      <i
                        className="fas fa-calendar-check"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span style={{ flex: 1, textAlign: "left" }}>{year}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          background: "var(--bg-card)",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          fontSize: "0.8em",
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. ACTUAL DANGER ZONE */}
      <div className="danger-zone" style={{ marginTop: "24px" }}>
        <h3>
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />{" "}
          Danger Zone
        </h3>
        <p>
          These actions are irreversible and will result in permanent data loss.
          Please proceed with extreme caution.
        </p>

        <div
          className="danger-actions"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={clearLocalCache}
              style={{
                borderColor: "var(--border-default)",
                color: "var(--brand-red)",
                minWidth: "220px",
              }}
            >
              <i className="fas fa-broom" /> Clear Local Cache & Log Out
            </button>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Clears browser storage without deleting cloud data.
            </small>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-danger"
              onClick={() => setShowClearConfirm(true)}
              style={{ minWidth: "220px" }}
            >
              <i className="fas fa-trash" /> Delete All Data (Local & Cloud)
            </button>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Wipes your entire account and anime list from existence.
            </small>
          </div>
        </div>
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
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
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
                disabled={processing}
              >
                <i className="fas fa-trash" /> Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
