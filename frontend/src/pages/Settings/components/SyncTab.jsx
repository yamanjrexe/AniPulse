import React, { useEffect, useState, useCallback } from "react";
import { useSync } from "../../../context/SyncContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { autoBackupService } from "../../../services/autoBackupService.js";

export default function SyncTab() {
    const { lastSync, syncToCloud, loadFromCloud } = useSync();
    const { showToast } = useToast();

    const [backup, setBackup] = useState(() => autoBackupService.getStatus());
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        autoBackupService.init();
        const unsub = autoBackupService.subscribe(setBackup);
        return () => {
            unsub();
        };
    }, []);

    const onSync = useCallback(async () => {
        const ok = await syncToCloud();
        showToast(
            ok ? "Synced to cloud" : "Sync failed",
            ok ? "success" : "error",
        );
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

    return (
        <div className="settings-tab-content active" id="tab-sync">
            <div className="settings-group">
                <h3>
                    <i className="fas fa-cloud-upload-alt" aria-hidden="true" />{" "}
                    Cloud Sync
                </h3>

                <div className="settings-item">
                    <div className="sync-status">
                        <i className="fas fa-cloud" aria-hidden="true" />
                        <span>
                            {lastSync ? "Cloud sync active" : "Not synced yet"}
                        </span>
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
                        <i className="fas fa-cloud-download-alt" /> Load from
                        cloud
                    </button>
                </div>

                <div className="settings-item">
                    <small className="sync-info">
                        Last sync:{" "}
                        {lastSync
                            ? new Date(lastSync).toLocaleString()
                            : "Never"}
                    </small>
                </div>
            </div>

            <div className="settings-group">
                <h3>
                    <i className="fas fa-save" aria-hidden="true" /> Auto Backup
                </h3>

                {!backup.supported && (
                    <>
                        <p className="settings-hint">
                            Auto backup uses the File System Access API, which
                            is currently only available in Chrome, Edge, and
                            other Chromium-based browsers.
                        </p>
                        <button className="btn btn-secondary" disabled>
                            <i className="fas fa-ban" /> Not supported in this
                            browser
                        </button>
                    </>
                )}

                {backup.supported && !backup.enabled && (
                    <>
                        <p className="settings-hint">
                            Write a JSON backup of your anime list to a file of
                            your choice. The backup updates automatically
                            whenever your data changes.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={onEnableBackup}
                            disabled={busy}
                        >
                            <i
                                className={`fas ${busy ? "fa-spinner fa-spin" : "fa-save"}`}
                            />{" "}
                            {busy ? "Enabling..." : "Enable auto backup"}
                        </button>
                    </>
                )}

                {backup.supported && backup.enabled && (
                    <>
                        <div className="sync-status sync-status-ok">
                            <i
                                className="fas fa-check-circle"
                                aria-hidden="true"
                            />
                            <span>
                                Backing up to{" "}
                                <strong>{backup.handleName}</strong>
                            </span>
                        </div>

                        <div className="settings-item">
                            <small className="sync-info">
                                Last backup:{" "}
                                {backup.lastSavedAt
                                    ? new Date(
                                          backup.lastSavedAt,
                                      ).toLocaleString()
                                    : "Not saved yet"}
                            </small>
                        </div>

                        {backup.error && (
                            <div className="settings-item">
                                <small className="sync-error">
                                    {backup.error}
                                </small>
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
