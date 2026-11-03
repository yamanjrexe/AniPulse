import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext.jsx";

export default function AppearanceTab() {
  const { theme, setThemePreference } = useTheme();
  const currentPref = localStorage.getItem("themePreference") || theme;

  // Read initial state from localStorage
  const [reduceMotion, setReduceMotion] = useState(
    localStorage.getItem("reduceMotion") === "true",
  );
  const [compactView, setCompactView] = useState(
    localStorage.getItem("compactView") === "true",
  );

  // Apply classes on initial load
  useEffect(() => {
    if (reduceMotion) document.body.classList.add("reduce-motion");
    else document.body.classList.remove("reduce-motion");

    if (compactView) document.body.classList.add("compact-view");
    else document.body.classList.remove("compact-view");
  }, [reduceMotion, compactView]);

  const handleReduceMotion = (e) => {
    const val = e.target.checked;
    setReduceMotion(val);
    localStorage.setItem("reduceMotion", String(val));
    window.dispatchEvent(new CustomEvent("uiRefresh"));
  };

  const handleCompactView = (e) => {
    const val = e.target.checked;
    setCompactView(val);
    localStorage.setItem("compactView", String(val));
    window.dispatchEvent(new CustomEvent("uiRefresh"));
  };

  return (
    <div className="settings-tab-content active" id="tab-appearance">
      <div className="settings-group">
        <h3>
          <i className="fas fa-palette" aria-hidden="true" /> Appearance
        </h3>

        {/* THEME SELECTION */}
        <div className="settings-item">
          <label className="section-label">Select Theme</label>
          <div className="theme-selection">
            <div
              className={`theme-card ${currentPref === "dark" ? "active" : ""}`}
              onClick={() => setThemePreference("dark")}
            >
              <div className="theme-preview-box">
                <i className="fas fa-moon" />
              </div>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Standard Dark
              </span>
            </div>
          </div>
        </div>

        {/* DISPLAY PREFERENCES */}
        <div
          className="settings-item"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 20,
          }}
        >
          <label className="section-label">Display Preferences</label>

          {/* Compact View */}
          <div className="settings-toggle-row">
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
              >
                Compact Anime Cards
              </strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Shrink posters to fit more anime on your dashboard.
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={compactView}
                onChange={handleCompactView}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Reduce Motion */}
          <div className="settings-toggle-row" style={{ marginTop: 20 }}>
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
              >
                Reduce Motion
              </strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Disable Recap animations, XP popups, and page fades.
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={handleReduceMotion}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
