import React from "react";
import { useTheme } from "../../../context/ThemeContext.jsx";

export default function AppearanceTab() {
  const { theme, setThemePreference } = useTheme();
  const currentPref = localStorage.getItem("themePreference") || theme;

  return (
    <div className="settings-tab-content active" id="tab-appearance">
      <div className="settings-group">
        <h3>
          <i className="fas fa-palette" aria-hidden="true" /> Appearance
        </h3>

        <div className="settings-item">
          <label
            className="section-label"
            style={{ display: "block", marginBottom: "12px", fontWeight: 500 }}
          >
            Select Theme
          </label>
          <div
            className="theme-selection"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {/* Standard Dark Theme */}
            <div
              className={`theme-card ${currentPref === "dark" ? "active" : ""}`}
              onClick={() => setThemePreference("dark")}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border:
                  currentPref === "dark"
                    ? "2px solid var(--brand-yellow)"
                    : "1px solid var(--border-default)",
                background: "var(--bg-card)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  background: "#0A0A0A",
                  height: "60px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  border: "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="fas fa-moon"
                  style={{ color: "#FBFBFB", fontSize: "24px" }}
                />
              </div>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Standard Dark
              </span>
            </div>

            </div>
          </div>
        </div>

        <div
          className="settings-item"
          style={{
            paddingTop: 16,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
        </div>
      </div>
  );
}
