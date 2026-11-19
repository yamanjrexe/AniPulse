import React, { useEffect, useState, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import Header from "../components/layout/Header.jsx";
import FabMenu from "../components/layout/FabMenu.jsx";
import ChatBot from "../components/layout/ChatBot.jsx";
import NameEntryModal from "../components/layout/NameEntryModal.jsx";
import SearchBridge from "../components/layout/SearchBridge.jsx";
import GlobalBanner from "../components/layout/GlobalBanner.jsx";

import AnimeModal from "../components/anime/AnimeModal.jsx";
import ImportModal from "../components/anime/ImportModal.jsx";
import RecapModal from "../components/recap/RecapModal.jsx";
import DayPromptModal from "../components/ui/DayPromptModal.jsx";
import XpPopupManager from "../components/level/XpPopupManager.jsx";

import useScrollRestoration from "../hooks/useScrollRestoration.js";
import { navigationItems } from "../routes/routeConfig.jsx";
import { autoBackupService } from "../services/autoBackupService.js";

const PAGE_TITLES = {
  "/leaderboard": "Leaderboard - AniPulse",
};

function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "60vh",
        width: "100%",
      }}
    >
      <i
        className="fas fa-spinner fa-spin"
        style={{ fontSize: "2rem", color: "var(--brand-yellow)" }}
      />
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { user, initialized } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const isAuthed = !!user;

  useScrollRestoration();

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    const match = navigationItems.find((i) => i.path === location.pathname);
    document.title =
      match?.title || PAGE_TITLES[location.pathname] || "AniPulse";
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthed) return;
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const shown = sessionStorage.getItem("nameModalShown");
    if (!profile.name && !shown) {
      sessionStorage.setItem("nameModalShown", "true");
      setTimeout(
        () => window.dispatchEvent(new CustomEvent("openNameEntry")),
        600,
      );
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    autoBackupService.init();
  }, [isAuthed]);

  if (!initialized) {
    return (
      <div className="main-content">
        <PageFallback />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="main-content">
        <header className="top-bar" role="banner">
          <div className="header-left">
            <Link to="/" aria-label="AniPulse Home">
              <div className="app-logo">
                <img src="/icon/Anipulse.png" alt="AniPulse Logo" />
              </div>
            </Link>
          </div>
          <div className="user-actions">
            <Link
              to="/login"
              style={{
                padding: "8px 16px",
                background: "var(--brand-yellow)",
                color: "#000",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Sign in
            </Link>
          </div>
        </header>

        <main className="page active" key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Header onMenuClick={() => setDrawer((v) => !v)} />

      <GlobalBanner />

      <main className="page active" key={location.pathname}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <SearchBridge />
      <FabMenu />
      <ChatBot />
      <AnimeModal />
      <ImportModal />
      <RecapModal />
      <NameEntryModal />
      <DayPromptModal />
      <XpPopupManager />
    </div>
  );
}
