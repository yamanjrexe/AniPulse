import React from "react";
import usePWAInstall from "../../hooks/usePWAInstall.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function PWAInstallButton() {
    const { installable, installed, promptInstall } = usePWAInstall();
    const { showToast } = useToast();

    if (installed) return null;
    if (localStorage.getItem("pwa-dismissed")) return null;
    if (!installable) return null;

    const handleClick = async () => {
        const accepted = await promptInstall();
        if (accepted) showToast("🎉 Installing AniPulse!", "success");
    };

    const handleDismiss = (e) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem("pwa-dismissed", "true");
        window.dispatchEvent(new CustomEvent("pwaDismissed"));
    };

    return (
        <button
            id="pwa-install-btn"
            className="theme-toggle"
            title="Install AniPulse"
            onClick={handleClick}
            onContextMenu={handleDismiss}
            style={{ cursor: "pointer" }}
        >
            <i className="fas fa-download" />
        </button>
    );
}
