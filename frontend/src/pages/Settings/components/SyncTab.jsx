import React, { useEffect, useState, useCallback } from "react";
import { useSync } from "../../../context/SyncContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { autoBackupService } from "../../../services/autoBackupService.js";
import { anilistSync } from "../../../services/anilistSync.js";

export default function SyncTab() {
  const { lastSync, syncToCloud, loadFromCloud } = useSync();
  const { showToast } = useToast();
  const { animeData } = useAnime();

  const [backup, setBackup] = useState(() => autoBackupService.getStatus());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const unsub = autoBackupService.subscribe(setBackup);
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
    try {
      await autoBackupService.enable();
      showToast("Auto backup enabled", "success");
    } catch (err) {
      if (err.name === "AbortError") return;
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
              background — no manual button per anime.
            </p>

            <p
              className="settings-hint"
              style={{ fontSize: "0.7rem", opacity: 0.7 }}
            >
              Combined-season entries are supported — progress is capped to
              AniList's actual episode count when the two differ.
            </p>

            <button
              className="btn btn-primary"
              onClick={onConnectAnilist}
              disabled={anilistBusy}
            >
              <i
                className={`fas ${
                  anilistBusy ? "fa-spinner fa-spin" : "fa-link"
                }`}
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
                    <i className="fas fa-spinner fa-spin" aria-hidden="true" />
                    Syncing library…
                  </span>
                  <span className="anilist-progress-count">
                    {syncCurrent}
                    <span className="anilist-progress-sep">/</span>
                    {syncTotal}
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

            {!isSyncing && anilistQueue.jobs > 0 && (
              <div className="anilist-row">
                <div className="sync-status">
                  <i className="fas fa-hourglass-half" aria-hidden="true" />
                  <span>{anilistQueue.jobs} anime waiting in queue</span>
                </div>
              </div>
            )}

            {pendingRetry > 0 && (
              <div className="anilist-row">
                <div className="sync-status">
                  <i className="fas fa-rotate-right" aria-hidden="true" />
                  <span>
                    {pendingRetry} change
                    {pendingRetry > 1 ? "s" : ""} pending — retrying
                    automatically
                  </span>
                </div>
              </div>
            )}

            <div className="anilist-row anilist-actions-row">
              <button
                className="btn btn-secondary"
                onClick={onSyncAnilistAll}
                disabled={anilistBusy}
              >
                <i
                  className={`fas ${
                    anilistBusy ? "fa-spinner fa-spin" : "fa-sync-alt"
                  }`}
                />{" "}
                {anilistBusy ? "Queueing…" : "Re-sync entire library"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={onDeepResync}
                disabled={anilistBusy}
              >
                <i className="fas fa-broom" /> Deep re-sync
              </button>
              <button
                className="btn btn-ghost"
                onClick={onDisconnectAnilist}
                disabled={anilistBusy}
              >
                <i className="fas fa-unlink" /> Disconnect
              </button>
            </div>

            {failedMatches.length > 0 && (
              <div className="anilist-row anilist-failed-row">
                <div className="sync-status">
                  <i
                    className="fas fa-triangle-exclamation"
                    aria-hidden="true"
                  />
                  <span>
                    {failedMatches.length} anime couldn't be matched on AniList
                  </span>
                </div>

                <details className="anilist-failed-details">
                  <summary>Show list</summary>
                  <ul>
                    {failedMatches.map((f) => (
                      <li key={f.animeId}>
                        <span>{f.title}</span>
                        <span className="anilist-failed-hint">
                          Rename in AniPulse to match AniList's title, then edit
                          it here to retry
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClearFailed}
                  >
                    <i className="fas fa-broom" /> Clear list
                  </button>
                </details>
              </div>
            )}

            <div className="anilist-row anilist-footer-row">
              <span className="anilist-footer-note">
                <span className="anilist-dot" />
                Auto-sync is active. New anime, edits, and deletions are pushed
                to AniList automatically from every device you log into.
              </span>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
