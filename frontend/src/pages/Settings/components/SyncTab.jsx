import React, { useEffect, useState, useCallback } from "react";
import { useSync } from "../../../context/SyncContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useLevel } from "../../../context/LevelContext.jsx";
import { autoBackupService } from "../../../services/autoBackupService.js";
import { anilistSync } from "../../../services/anilistSync.js";
import { animeService } from "../../../services/animeService.js";
import { tmdbService } from "../../../services/tmdbService.js";
import { clearAllCompletedHistory } from "../../../services/levelSystem.js";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import Modal from "../../../components/ui/Modal.jsx";

export default function SyncTab() {
  const { lastSync, syncToCloud, loadFromCloud } = useSync();
  const { showToast } = useToast();
  const { animeData, setAnimeData } = useAnime();
  const { recalc } = useLevel();

  const [backup, setBackup] = useState(() => autoBackupService.getStatus());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [importing, setImporting] = useState(false);

  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showFailedCoversModal, setShowFailedCoversModal] = useState(false);
  const [failedCoversList, setFailedCoversList] = useState([]);

  const [anilistStatus, setAnilistStatus] = useState({ connected: false });
  const [anilistBusy, setAnilistBusy] = useState(false);
  const [anilistQueue, setAnilistQueue] = useState({
    jobs: 0,
    total: 0,
    processing: null,
  });
  const [pendingRetry, setPendingRetry] = useState(0);
  const [failedMatches, setFailedMatches] = useState([]);

  useEffect(() => {
    autoBackupService.init();
    const unsub = autoBackupService.subscribe((status) => {
      setBackup(status);
      if (status.error) {
        setLocalError(status.error);
      } else {
        setLocalError(null);
      }
    });
    return () => unsub();
  }, []);

  const refreshAnilistStatus = useCallback(async () => {
    const s = await anilistSync.getStatus(true);
    setAnilistStatus(s);
    return s;
  }, []);

  const refreshAnilistQueue = useCallback(async () => {
    const q = await anilistSync.getQueueStatus();
    setAnilistQueue(q);
    setPendingRetry(anilistSync.getPendingCount());
    const fails = await anilistSync.getFailedMatches();
    setFailedMatches(fails);
  }, []);

  useEffect(() => {
    refreshAnilistStatus();
    refreshAnilistQueue();
    const id = setInterval(refreshAnilistQueue, 3000);
    return () => clearInterval(id);
  }, [refreshAnilistStatus, refreshAnilistQueue]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected === "1") {
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage(
            { type: "anilist-connected" },
            window.location.origin,
          );
        } catch (_) {}
        window.close();
        return;
      }

      showToast("Connected to AniList!", "success");
      anilistSync.invalidateStatus();
      refreshAnilistStatus().then((s) => {
        if (s.connected && animeData.length) {
          const flag = "anilistSyncDone";
          if (!localStorage.getItem(flag)) {
            anilistSync.syncAll(animeData).then((res) => {
              if (res.queued) {
                localStorage.setItem(flag, "1");
                showToast(
                  `Queued ${res.count} anime for background sync`,
                  "info",
                );
                refreshAnilistQueue();
              }
            });
          }
        }
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }

    if (error) {
      showToast(`AniList error: ${error}`, "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [animeData, showToast, refreshAnilistStatus, refreshAnilistQueue]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "anilist-connected") return;

      anilistSync.invalidateStatus();
      refreshAnilistStatus().then((s) => {
        if (!s.connected) return;
        showToast("Connected to AniList!", "success");

        const flag = "anilistSyncDone";
        if (!localStorage.getItem(flag) && animeData.length) {
          anilistSync.syncAll(animeData).then((res) => {
            if (res.queued) {
              localStorage.setItem(flag, "1");
              showToast(
                `Queued ${res.count} anime for background sync`,
                "info",
              );
              refreshAnilistQueue();
            }
          });
        }
      });
    };

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [animeData, showToast, refreshAnilistStatus, refreshAnilistQueue]);

  const onConnectAnilist = useCallback(async () => {
    setAnilistBusy(true);
    try {
      const ok = await anilistSync.connect();
      if (!ok) showToast("Could not open AniList authorization", "error");
    } finally {
      setAnilistBusy(false);
    }
  }, [showToast]);

  const onDisconnectAnilist = useCallback(async () => {
    if (
      !window.confirm(
        "Disconnect from AniList? Entries already on AniList are not removed.",
      )
    )
      return;
    setAnilistBusy(true);
    try {
      await anilistSync.disconnect();
      setAnilistStatus({ connected: false });
      setAnilistQueue({ jobs: 0, total: 0, processing: null });
      setPendingRetry(0);
      setFailedMatches([]);
      localStorage.removeItem("anilistSyncDone");
      showToast("Disconnected from AniList", "info");
    } finally {
      setAnilistBusy(false);
    }
  }, [showToast]);

  const runSyncAll = useCallback(
    async (force = false) => {
      if (!anilistStatus.connected) return;
      if (!animeData.length) {
        showToast("No anime to sync", "info");
        return;
      }
      setAnilistBusy(true);
      try {
        const res = await anilistSync.syncAll(animeData, { force });
        if (res.queued) {
          const skipped = res.skipped || 0;
          const count = res.count || 0;

          if (count === 0 && skipped > 0) {
            showToast(`All ${skipped} anime are already on AniList`, "success");
          } else if (skipped > 0) {
            showToast(
              `${count} queued · ${skipped} already on AniList`,
              "success",
            );
          } else {
            showToast(`Queued ${count} anime for background sync`, "success");
          }
          refreshAnilistQueue();
        } else {
          showToast(res.reason || "Sync failed", "error");
        }
      } finally {
        setAnilistBusy(false);
      }
    },
    [anilistStatus.connected, animeData, showToast, refreshAnilistQueue],
  );

  const onSyncAnilistAll = useCallback(() => runSyncAll(false), [runSyncAll]);

  const onDeepResync = useCallback(() => {
    if (
      !window.confirm(
        "This will forget all existing AniList mappings and re-search every anime from scratch. Use this to fix anime that were matched to the wrong format (e.g. OVA instead of TV). Continue?",
      )
    )
      return;
    runSyncAll(true);
  }, [runSyncAll]);

  const onClearFailed = useCallback(async () => {
    if (!window.confirm("Clear the list of unmatched anime?")) return;
    const ok = await anilistSync.clearFailedMatches();
    if (ok) {
      setFailedMatches([]);
      showToast("Cleared failed matches", "info");
    } else {
      showToast("Could not clear list", "error");
    }
  }, [showToast]);

  const executeImport = useCallback(async () => {
    setShowImportConfirm(false);
    setImporting(true);

    try {
      const res = await anilistSync.importFromAniList();
      if (!res.success) throw new Error(res.error || "Import failed");

      const anilistList = res.list || [];
      if (anilistList.length === 0) {
        showToast("No anime found on your AniList profile.", "info");
        setImporting(false);
        return;
      }

      const statusMap = {
        CURRENT: "Watching",
        PLANNING: "Plan to Watch",
        COMPLETED: "Completed",
        DROPPED: "Dropped",
        PAUSED: "On-Hold",
        REPEATING: "Watching",
      };

      const typeMap = {
        TV: "TV",
        TV_SHORT: "TV_SHORT",
        MOVIE: "Movie",
        OVA: "OVA",
        ONA: "ONA",
        SPECIAL: "Special",
      };

      const formatDate = (d) => {
        if (!d || !d.year) return null;
        const y = d.year;
        const m = String(d.month || 1).padStart(2, "0");
        const day = String(d.day || 1).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const normalizeStr = (str) =>
        (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const anilistSetIds = new Set();
      const anilistSetTitles = new Set();

      anilistList.forEach((entry) => {
        anilistSetIds.add(String(entry.media.id));
        const t1 = entry.media.title?.english;
        const t2 = entry.media.title?.romaji;
        const t3 = entry.media.title?.native;
        [t1, t2, t3]
          .filter(Boolean)
          .forEach((t) => anilistSetTitles.add(normalizeStr(t)));
      });

      let deletedCount = 0;
      let keptAnimes = animeData.filter((a) => {
        if (a.anilistId && anilistSetIds.has(String(a.anilistId))) {
          return true;
        }
        if (anilistSetTitles.has(normalizeStr(a.title))) {
          return true;
        }
        deletedCount++;
        return false;
      });

      const existingIds = new Set(
        keptAnimes.map((a) => String(a.anilistId)).filter(Boolean),
      );
      const existingTitles = new Set(
        keptAnimes.map((a) => normalizeStr(a.title)),
      );

      let newAnimes = [];
      let currentId = animeService.getNextAvailableId(keptAnimes);

      for (const entry of anilistList) {
        const media = entry.media;
        const title =
          media.title?.english ||
          media.title?.romaji ||
          media.title?.native ||
          "Unknown";

        if (
          existingIds.has(String(media.id)) ||
          existingTitles.has(normalizeStr(title))
        ) {
          continue;
        }

        let finalScore = null;
        if (entry.score) {
          finalScore = entry.score > 10 ? entry.score / 10 : entry.score;
        }

        const startStr = formatDate(entry.startedAt);
        const finishStr = formatDate(entry.completedAt);

        const effectiveProgress =
          entry.status === "COMPLETED" &&
          (!entry.progress || entry.progress === 0)
            ? media.episodes || 1
            : entry.progress || 0;

        newAnimes.push({
          id: currentId++,
          anilistId: media.id,
          title: title,
          type: typeMap[media.format] || "TV",
          episodes: media.episodes || 1,
          duration: media.duration || 20,
          userStatus: statusMap[entry.status] || "Plan to Watch",
          progress: effectiveProgress,
          score: finalScore,
          cover: "",
          genres: (media.genres || []).filter((g) => g !== "Award Winning"),
          finishDate: finishStr ? finishStr.substring(0, 7) : null,
          actualFinishDate: finishStr,
          createdAt: startStr
            ? `${startStr} 12:00:00`
            : new Date().toISOString().slice(0, 19).replace("T", " "),
          updatedAt: finishStr
            ? `${finishStr} 12:00:00`
            : new Date().toISOString().slice(0, 19).replace("T", " "),
        });
      }

      const merged = animeService.reindexIds([...keptAnimes, ...newAnimes]);
      const noChanges = newAnimes.length === 0 && deletedCount === 0;

      setAnimeData(merged);
      localStorage.setItem("animeData", JSON.stringify(merged, null, 2));
      await animeService.saveCloud(merged);
      window.dispatchEvent(new CustomEvent("animeUpdate"));

      if (!noChanges) {
        clearAllCompletedHistory();
        localStorage.removeItem("xpPendingQueue");
        recalc();
        window.dispatchEvent(new CustomEvent("uiRefresh"));
        await syncToCloud();
        showToast(
          `Synced! Added ${newAnimes.length}, Deleted ${deletedCount}.`,
          "success",
          3000,
        );
      } else {
        showToast(
          "Library reindexed and already in sync with AniList.",
          "info",
          3000,
        );
      }

      const missingCovers = merged.filter((a) => !a.cover);

      if (missingCovers.length === 0) {
        setImporting(false);
        return;
      }

      showToast(
        `Fetching TMDB covers for ${missingCovers.length} anime...`,
        "info",
        3000,
      );

      const fetchCoversAsync = async () => {
        let totalUpdated = 0;
        let missingTitles = [];
        const chunkSize = 3;
        const totalMissing = missingCovers.length;

        for (let i = 0; i < totalMissing; i += chunkSize) {
          const chunk = missingCovers.slice(i, i + chunkSize);
          let success = false;
          let attempts = 0;

          while (!success && attempts < 3) {
            try {
              const posters = await tmdbService.getPostersBatch(chunk);

              setAnimeData((prevList) => {
                let hasChanges = false;
                const updatedList = prevList.map((a) => {
                  if (!a.cover && (posters[a.anilistId] || posters[a.title])) {
                    hasChanges = true;
                    totalUpdated++;
                    return {
                      ...a,
                      cover: posters[a.anilistId] || posters[a.title],
                    };
                  } else if (
                    !a.cover &&
                    !(posters[a.anilistId] || posters[a.title])
                  ) {
                    if (!missingTitles.includes(a.title))
                      missingTitles.push(a.title);
                  }
                  return a;
                });

                if (hasChanges) {
                  localStorage.setItem(
                    "animeData",
                    JSON.stringify(updatedList, null, 2),
                  );
                  animeService.saveCloud(updatedList);
                }
                return updatedList;
              });
              success = true;
            } catch (err) {
              console.warn(
                `Chunk failed, retrying... (${attempts + 1}/3)`,
                err,
              );
              attempts++;
              await new Promise((r) => setTimeout(r, 2000));
            }
          }

          if (!success) {
            chunk.forEach((a) => {
              if (!missingTitles.includes(a.title)) missingTitles.push(a.title);
            });
          }
          await new Promise((r) => setTimeout(r, 1000));
        }

        window.dispatchEvent(new CustomEvent("animeUpdate"));

        if (missingTitles.length > 0) {
          setFailedCoversList(missingTitles);
          setShowFailedCoversModal(true);
          showToast(
            `Finished! ${missingTitles.length} covers could not be found.`,
            "warning",
            6000,
          );
        } else {
          showToast(
            `Finished fetching ${totalUpdated} covers successfully!`,
            "success",
            4000,
          );
        }
      };

      fetchCoversAsync();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to import from AniList", "error");
    } finally {
      setImporting(false);
    }
  }, [
    anilistStatus.connected,
    animeData,
    setAnimeData,
    showToast,
    recalc,
    syncToCloud,
  ]);

  const onSync = useCallback(async () => {
    const ok = await syncToCloud();
    showToast(ok ? "Synced to cloud" : "Sync failed", ok ? "success" : "error");
  }, [syncToCloud, showToast]);

  const onLoad = useCallback(async () => {
    if (
      !window.confirm(
        "This will replace your local data with cloud data. Continue?",
      )
    )
      return;
    setLoading(true);
    try {
      const ok = await loadFromCloud();
      if (ok) {
        showToast("Loaded from cloud", "success");
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast("Failed to load", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromCloud, showToast]);

  const onEnableBackup = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      await autoBackupService.enable();
      setLocalError(null);
      showToast("Auto backup enabled", "success");
    } catch (err) {
      setLocalError(err.message);
      showToast(err.message || "Could not enable backup", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, showToast]);

  const onDisableBackup = useCallback(async () => {
    if (busy) return;
    if (!window.confirm("Turn off auto backup?")) return;
    setBusy(true);
    try {
      await autoBackupService.disable();
      showToast("Auto backup disabled", "info");
    } finally {
      setBusy(false);
    }
  }, [busy, showToast]);

  const onSaveNow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await autoBackupService.saveNow();
      showToast(
        ok ? "Backup saved" : "Backup failed",
        ok ? "success" : "error",
      );
    } catch (err) {
      showToast(err.message || "Backup failed", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, showToast]);

  const isSyncing = Boolean(
    anilistQueue.processing && anilistQueue.processing.total > 0,
  );
  const syncCurrent = anilistQueue.processing?.current || 0;
  const syncTotal = anilistQueue.processing?.total || 0;
  const syncPercent = syncTotal
    ? Math.round((syncCurrent / syncTotal) * 100)
    : 0;

  return (
    <div className="settings-tab-content active" id="tab-sync">
      <div className="settings-group">
        <h3>
          <i className="fas fa-cloud-upload-alt" aria-hidden="true" /> Cloud
          Sync
        </h3>
        <div className="settings-item">
          <div className="sync-status">
            <i className="fas fa-cloud" aria-hidden="true" />
            <span>{lastSync ? "Cloud sync active" : "Not synced yet"}</span>
          </div>
        </div>
        <div className="settings-item settings-actions">
          <button
            className="btn btn-primary"
            onClick={onSync}
            disabled={loading}
          >
            <i className="fas fa-sync-alt" /> Sync now
          </button>
          <button
            className="btn btn-secondary"
            onClick={onLoad}
            disabled={loading}
          >
            <i className="fas fa-cloud-download-alt" /> Load from cloud
          </button>
        </div>
        <div className="settings-item">
          <small className="sync-info">
            Last sync:{" "}
            {lastSync ? new Date(lastSync).toLocaleString() : "Never"}
          </small>
        </div>
      </div>

      <div className="settings-group">
        <h3>
          <i className="fas fa-list-ul" aria-hidden="true" /> AniList Sync
        </h3>

        {!anilistStatus.connected && (
          <>
            <p className="settings-hint">
              Connect your AniList account to keep both libraries in sync. Every
              add, edit, or delete you make here is reflected on AniList in the
              background.
            </p>
            <button
              className="btn btn-primary"
              onClick={onConnectAnilist}
              disabled={anilistBusy}
            >
              <i
                className={`fas ${anilistBusy ? "fa-spinner fa-spin" : "fa-link"}`}
              />{" "}
              {anilistBusy ? "Opening…" : "Connect to AniList"}
            </button>
          </>
        )}

        {anilistStatus.connected && (
          <div className="anilist-connected-view">
            <div className="anilist-row anilist-status-row">
              <div className="sync-status sync-status-ok">
                <i className="fas fa-check-circle" aria-hidden="true" />
                <span>
                  Connected as <strong>{anilistStatus.anilistUsername}</strong>
                </span>
              </div>
            </div>

            {isSyncing && (
              <div className="anilist-row anilist-progress-row">
                <div className="anilist-progress-head">
                  <span className="anilist-progress-label">
                    <i className="fas fa-spinner fa-spin" aria-hidden="true" />{" "}
                    Syncing to AniList…
                  </span>
                  <span className="anilist-progress-count">
                    {syncCurrent} / {syncTotal}
                  </span>
                </div>
                <div className="anilist-progress-track">
                  <div
                    className="anilist-progress-fill"
                    style={{ width: `${syncPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="anilist-row anilist-actions-row">
              <button
                className="btn btn-secondary"
                onClick={onSyncAnilistAll}
                disabled={anilistBusy || importing}
              >
                <i
                  className={`fas ${anilistBusy ? "fa-spinner fa-spin" : "fa-sync-alt"}`}
                />{" "}
                {anilistBusy ? "Queueing…" : "Push to AniList"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={onDeepResync}
                disabled={anilistBusy || importing}
              >
                <i className="fas fa-broom" /> Deep re-sync
              </button>
              <button
                className="btn btn-ghost"
                onClick={onDisconnectAnilist}
                disabled={anilistBusy || importing}
              >
                <i className="fas fa-unlink" /> Disconnect
              </button>
            </div>

            <div className="anilist-row anilist-footer-row">
              <span className="anilist-footer-note">
                <span className="anilist-dot" /> Changes are pushed to AniList
                automatically.
              </span>
            </div>
          </div>
        )}
      </div>

      {anilistStatus.connected && (
        <div className="settings-group">
          <h3>
            <i className="fas fa-download" aria-hidden="true" /> Import from
            AniList
          </h3>
          <p className="settings-hint">
            Download your entire AniList library into AniPulse.{" "}
            <strong>Warning:</strong> This will also delete any anime in
            AniPulse that are not on your AniList profile to keep them perfectly
            mirrored.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowImportConfirm(true)}
            disabled={importing}
          >
            <i
              className={`fas ${importing ? "fa-spinner fa-spin" : "fa-download"}`}
            />{" "}
            {importing ? "Importing..." : "Import Library"}
          </button>
        </div>
      )}

      <div className="settings-group">
        <h3>
          <i className="fas fa-save" aria-hidden="true" /> Auto Backup
        </h3>

        {!backup.supported && (
          <>
            <p className="settings-hint">
              Auto backup uses the File System Access API, which is currently
              only available in Chrome, Edge, and other Chromium-based browsers.
            </p>
            <button className="btn btn-secondary" disabled>
              <i className="fas fa-ban" /> Not supported in this browser
            </button>
          </>
        )}

        {backup.supported && !backup.enabled && (
          <>
            <p className="settings-hint">
              Write a JSON backup of your anime list to a file of your choice.
              The backup updates automatically whenever your data changes.
            </p>
            {localError && (
              <div className="settings-item" style={{ marginBottom: 16 }}>
                <small
                  className="sync-error"
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    background: "rgba(249, 4, 21, 0.1)",
                    color: "var(--brand-red)",
                    border: "1px solid rgba(249, 4, 21, 0.3)",
                    borderRadius: "var(--r-sm)",
                    fontSize: "0.8rem",
                  }}
                >
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: 6 }}
                  />
                  {localError}
                </small>
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={onEnableBackup}
              disabled={busy}
            >
              <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-save"}`} />{" "}
              {busy ? "Enabling..." : "Enable auto backup"}
            </button>
          </>
        )}

        {backup.supported && backup.enabled && (
          <>
            <div className="sync-status sync-status-ok">
              <i className="fas fa-check-circle" aria-hidden="true" />
              <span>
                Backing up to <strong>{backup.handleName}</strong>
              </span>
            </div>
            <div className="settings-item">
              <small className="sync-info">
                Last backup:{" "}
                {backup.lastSavedAt
                  ? new Date(backup.lastSavedAt).toLocaleString()
                  : "Not saved yet"}
              </small>
            </div>
            {backup.error && (
              <div className="settings-item">
                <small className="sync-error">{backup.error}</small>
              </div>
            )}
            <div className="settings-item settings-actions">
              <button
                className="btn btn-primary"
                onClick={onSaveNow}
                disabled={busy}
              >
                <i
                  className={`fas ${busy ? "fa-spinner fa-spin" : "fa-save"}`}
                />{" "}
                {busy ? "Saving..." : "Save now"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={onDisableBackup}
                disabled={busy}
              >
                <i className="fas fa-times" /> Disable
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showImportConfirm}
        message="WARNING: This will download your AniList library into AniPulse AND DELETE any anime in AniPulse that are not on your AniList profile to keep them perfectly mirrored. Do you want to continue?"
        confirmLabel="Yes, Import & Overwrite"
        onConfirm={executeImport}
        onCancel={() => setShowImportConfirm(false)}
      />

      <Modal
        open={showFailedCoversModal}
        onClose={() => setShowFailedCoversModal(false)}
        title="Missing Covers"
      >
        <div style={{ padding: "0 4px" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
            TMDB could not find high-quality covers for the following{" "}
            <strong>{failedCoversList.length}</strong> anime. You can manually
            add a cover URL for these by clicking on them in your list.
          </p>
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--r-sm)",
              padding: "12px 16px",
            }}
          >
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--text-primary)",
                lineHeight: 1.6,
                fontSize: "0.9rem",
              }}
            >
              {failedCoversList.map((title, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {title}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="form-actions"
            style={{ marginTop: 24, paddingTop: 16 }}
          >
            <button
              className="btn btn-primary"
              onClick={() => setShowFailedCoversModal(false)}
              style={{ width: "100%" }}
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
