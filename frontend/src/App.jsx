import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AnimeProvider } from "./context/AnimeContext.jsx";
import { LevelProvider } from "./context/LevelContext.jsx";
import { SyncProvider } from "./context/SyncContext.jsx";
import { RefreshProvider } from "./context/RefreshContext.jsx";
import { initFirebase } from "./firebaseClient.js";
import { applyUpdate } from "./services/pwaService.js";

const MIN_LOADER_TIME = 3000;
const MAX_LOADER_TIME = 7000;

function FullScreenLoader({ progress = 30 }) {
  const phases = [
    { threshold: 15, label: "Booting" },
    { threshold: 35, label: "Connecting" },
    { threshold: 55, label: "Authenticating" },
    { threshold: 78, label: "Syncing" },
    { threshold: 100, label: "Ready" },
  ];

  const activeIndex = (() => {
    const idx = phases.findIndex((p) => progress < p.threshold);
    return idx === -1 ? phases.length - 1 : Math.max(0, idx);
  })();

  const isReady = progress >= 100;
  const label = isReady ? "Ready" : phases[activeIndex].label;
  const pctString = String(Math.min(progress, 100)).padStart(2, "0");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        color: "#FBFBFB",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: "24px",
        overflow: "hidden",
      }}
      role="status"
      aria-label="Loading application"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(252, 231, 6, 0.055) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 340,
          animation: "loaderContentIn 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <img
          src="/icon/Anipulse.png"
          alt="AniPulse"
          style={{
            width: 128,
            height: 128,
            objectFit: "contain",
            display: "block",
            marginBottom: 20,
          }}
        />

        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FBFBFB",
            margin: "0 0 6px 0",
            lineHeight: 1,
            paddingLeft: "0.14em",
          }}
        >
          AniPulse
        </h1>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#8A8A8A",
            margin: "0 0 40px 0",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          Your anime library, organized
        </p>

        <div
          style={{
            width: "min(320px, 82vw)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 6,
              background: "#1F1F1F",
              borderRadius: 999,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min(progress, 100)}%`,
                background: isReady ? "#22C55E" : "#FCE706",
                borderRadius: 999,
                transition:
                  "width 0.35s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s ease",
              }}
            />
            {[20, 40, 60, 80].map((pct) => (
              <span
                key={pct}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -3,
                  bottom: -3,
                  left: `calc(${pct}% - 1px)`,
                  width: 2,
                  background: "#0A0A0A",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: isReady ? "#22C55E" : "#8A8A8A",
                transition: "color 0.3s ease",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#FBFBFB",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
              }}
            >
              {pctString}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 32,
          }}
        >
          {phases.map((p, i) => {
            const passed = i <= activeIndex;
            const current = i === activeIndex && !isReady;
            const size = current ? 8 : 5;
            return (
              <span
                key={p.label}
                aria-hidden="true"
                style={{
                  width: size,
                  height: size,
                  borderRadius: 999,
                  background: passed
                    ? isReady
                      ? "#22C55E"
                      : "#FCE706"
                    : "#262626",
                  transition:
                    "background-color 0.25s ease, width 0.25s ease, height 0.25s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      <style>{`
                @keyframes loaderContentIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
    </div>
  );
}

export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / MIN_LOADER_TIME, 1);

      let eased;
      if (t < 0.05) eased = t * 5 * 0.15;
      else if (t < 0.5) eased = 0.15 + ((t - 0.05) / 0.45) * 0.45;
      else if (t < 0.85) eased = 0.6 + ((t - 0.5) / 0.35) * 0.25;
      else eased = 0.85 + ((t - 0.85) / 0.15) * 0.1;

      setProgress(Math.floor(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    import("./firebaseClient.js").then(({ API_BASE_URL }) => {
      if (API_BASE_URL) {
        fetch(`${API_BASE_URL}/api/health`).catch(() => {});
      }
    });
    let cancelled = false;
    initFirebase()
      .then(() => {
        if (!cancelled) setFirebaseReady(true);
      })
      .catch((err) => {
        console.error("[App] Firebase init failed:", err);
        if (!cancelled) setFirebaseReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), MIN_LOADER_TIME);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setForceHide(true), MAX_LOADER_TIME);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if ((firebaseReady && minTimeElapsed) || forceHide) {
      setProgress(100);
    }
  }, [firebaseReady, minTimeElapsed, forceHide]);

  useEffect(() => {
    const onUpdate = () => {
      if (window.confirm("New version available. Reload now?")) applyUpdate();
    };
    window.addEventListener("swUpdateAvailable", onUpdate);
    return () => window.removeEventListener("swUpdateAvailable", onUpdate);
  }, []);

  const showLoader = !((firebaseReady && minTimeElapsed) || forceHide);

  return (
    <>
      {showLoader && <FullScreenLoader progress={progress} />}

      {!showLoader && (
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <AnimeProvider>
                  <LevelProvider>
                    <SyncProvider>
                      <RefreshProvider>
                        <AppRoutes />
                      </RefreshProvider>
                    </SyncProvider>
                  </LevelProvider>
                </AnimeProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      )}
    </>
  );
}
