import React from "react";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";

export default function DangerTab() {
    const { showToast } = useToast();
    const { animeData } = useAnime();

    const exportJson = () => {
        if (!animeData.length) return showToast("No data to export", "error");
        const blob = new Blob([JSON.stringify(animeData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "My Anime List.json";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Exported!", "success");
    };

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

    return (
        <div className="settings-tab-content active" id="tab-danger">
            <div className="danger-zone">
                <h3>
                    <i
                        className="fas fa-exclamation-triangle"
                        aria-hidden="true"
                    />{" "}
                    Danger Zone
                </h3>
                <p>
                    These actions are irreversible. Please proceed with caution.
                </p>
                <div className="danger-actions">
                    <button className="btn btn-danger" onClick={clearAll}>
                        <i className="fas fa-trash" /> Clear All Data
                    </button>
                    <button className="btn btn-success" onClick={exportJson}>
                        <i className="fas fa-file-export" /> Export Data as JSON
                    </button>
                </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
                <button
                    className="settings-btn"
                    onClick={() =>
                        window.dispatchEvent(new CustomEvent("openRecap"))
                    }
                >
                    <i className="fas fa-chart-line" /> View Recap
                </button>
            </div>
        </div>
    );
}
