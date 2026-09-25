import React, { useState, useEffect, useRef } from "react";
import Modal from "../ui/Modal.jsx";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useSync } from "../../context/SyncContext.jsx";

export default function ImportModal() {
  const { animeData, setAnimeData } = useAnime();
  const { showToast } = useToast();
  const { syncToCloud } = useSync();

  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onOpen = () => {
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(true);
    };
    window.addEventListener("openImportModal", onOpen);
    return () => window.removeEventListener("openImportModal", onOpen);
  }, []);

  // Always allowed to close — used after a successful import.
  const close = () => {
    setOpen(false);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Used by Cancel / backdrop — refuses while an import is in flight.
  const closeIfIdle = () => {
    if (importing) return;
    close();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showToast("Please select a JSON file", "error");
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      let importedData;
      try {
        importedData = JSON.parse(text);
      } catch (parseErr) {
        showToast("Failed to parse JSON file", "error");
        setImporting(false);
        return;
      }

      if (!Array.isArray(importedData)) {
        showToast("Invalid JSON: expected an array of anime", "error");
        setImporting(false);
        return;
      }

      const existingMap = new Map(animeData.map((a) => [a.id, a]));
      let addedCount = 0;
      let updatedCount = 0;

      importedData.forEach((imported) => {
        if (!imported || typeof imported !== "object" || !imported.id) {
          return;
        }
        const existing = existingMap.get(imported.id);
        if (existing) {
          Object.keys(imported).forEach((key) => {
            if (key !== "id") existing[key] = imported[key];
          });
          updatedCount++;
        } else {
          existingMap.set(imported.id, imported);
          addedCount++;
        }
      });

      if (addedCount === 0 && updatedCount === 0) {
        showToast("No new or changed entries found", "info");
        setImporting(false);
        return;
      }

      const mergedList = Array.from(existingMap.values());

      setAnimeData(mergedList);
      localStorage.setItem("localDirty", "true");

      window.dispatchEvent(new CustomEvent("animeUpdate"));

      // Close first (so the `importing` guard doesn't block it),
      // then clear the flag on the next tick.
      close();
      setImporting(false);

      setTimeout(async () => {
        const ok = await syncToCloud();
        if (ok) {
          showToast(
            `✅ Imported ${addedCount + updatedCount} anime (${addedCount} new, ${updatedCount} updated)`,
            "success",
          );
        } else {
          showToast(
            "⚠️ Saved locally. Cloud sync will retry automatically.",
            "warning",
          );
        }
      }, 100);
    } catch (err) {
      console.error("Import error:", err);
      showToast(err.message || "Import failed", "error");
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeIfIdle}
      title="Import Anime Data"
      aria-labelledby="importModalTitle"
    >
      <div className="form-group">
        <label htmlFor="importFile">Select JSON file</label>
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            id="importFile"
            accept=".json,application/json"
            onChange={handleFile}
          />
          <div className="file-input-btn">
            <i className="fas fa-file-import" aria-hidden="true" />{" "}
            {fileName || "Choose File"}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={closeIfIdle}
          disabled={importing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={importing || !fileName}
        >
          {importing ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Importing...
            </>
          ) : (
            <>
              <i className="fas fa-file-import" /> Import Data
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
