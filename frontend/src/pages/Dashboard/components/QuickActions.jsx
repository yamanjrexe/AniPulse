import React from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";

export default function QuickActions() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { animeData } = useAnime();

    const openAdd = () =>
        window.dispatchEvent(new CustomEvent("openAddAnimeModal"));
    const openImport = () =>
        window.dispatchEvent(new CustomEvent("openImportModal"));

    const exportData = () => {
        if (!animeData.length) return showToast("No data to export", "error");
        const blob = new Blob([JSON.stringify(animeData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "AniPulse_Backup.json";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Data exported!", "success");
    };

    return (
        <div className="quick-actions">
            <button className="action-btn" onClick={openAdd}>
                <div className="action-icon primary">
                    <i className="fas fa-plus" />
                </div>
                <span className="action-text">Add Anime</span>
            </button>
            <button className="action-btn" onClick={openImport}>
                <div className="action-icon success">
                    <i className="fas fa-file-import" />
                </div>
                <span className="action-text">Import Data</span>
            </button>
            <button className="action-btn" onClick={exportData}>
                <div className="action-icon warning">
                    <i className="fas fa-file-export" />
                </div>
                <span className="action-text">Export Data</span>
            </button>
            <button
                className="action-btn"
                onClick={() => navigate("/statistics")}
            >
                <div className="action-icon info">
                    <i className="fas fa-chart-pie" />
                </div>
                <span className="action-text">View Stats</span>
            </button>
        </div>
    );
}
