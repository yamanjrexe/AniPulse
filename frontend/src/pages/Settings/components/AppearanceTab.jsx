import React from "react";
import { useTheme } from "../../../context/ThemeContext.jsx";

const OPTIONS = [
    { k: "light", label: "Light" },
    { k: "dark", label: "Dark" },
    { k: "system", label: "System" },
];

export default function AppearanceTab() {
    const { theme } = useTheme();
    const currentPref = localStorage.getItem("themePreference") || theme;

    return (
        <div className="settings-tab-content active" id="tab-appearance">
            <div className="settings-group">
                <h3>
                    <i className="fas fa-palette" aria-hidden="true" />{" "}
                    Appearance
                </h3>
                <div className="settings-item">
                    <label className="section-label">Theme</label>
                    <div className="theme-selection">
                        {OPTIONS.map((o) => (
                            <div
                                key={o.k}
                                className={`theme-card ${currentPref === o.k ? "active" : ""}`}
                                data-theme={o.k}
                                onClick={() =>
                                    window.dispatchEvent(
                                        new CustomEvent("setThemePreference", {
                                            detail: o.k,
                                        }),
                                    )
                                }
                            >
                                <div className={`theme-sample ${o.k}`} />
                                <span className="theme-label">{o.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
