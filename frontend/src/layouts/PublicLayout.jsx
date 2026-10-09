import React, { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const RESOURCES_TITLES = {
  "/resources/docs": "Documentation - AniPulse",
  "/resources/help": "Help Center - AniPulse",
  "/resources/changelog": "Changelog - AniPulse",
  "/resources/about": "About - AniPulse",
  "/resources": "Resources - AniPulse",
};

export default function PublicLayout() {
  const headerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const h = headerRef.current;
      if (!h) return;
      if (window.scrollY > 50) h.classList.add("scrolled");
      else h.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  // ─── Browser tab title for all Resources pages ─────────────
  useEffect(() => {
    document.title =
      RESOURCES_TITLES[location.pathname] || "Resources - AniPulse";
  }, [location.pathname]);

  return (
    <>
      <header className="landing-header" ref={headerRef}>
        <div className="container header-content">
          <Link to="/" className="logo" aria-label="AniPulse Home">
            <img
              src="/icon/Anipulse.png"
              alt="AniPulse Logo"
              className="header-logo"
            />
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <Link to="/resources/about" className="nav-link">
              About
            </Link>
            <Link to="/resources/docs" className="nav-link">
              Docs
            </Link>
            <Link to="/resources/help" className="nav-link">
              Help
            </Link>
            <Link to="/resources/changelog" className="nav-link">
              Changelog
            </Link>
            <Link to="/dashboard" className="cta-button">
              Launch App
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ paddingTop: 100, minHeight: "70vh" }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <Link to="/">
                <img
                  src="/icon/Anipulse.png"
                  alt="AniPulse Logo"
                  className="footer-logo"
                />
              </Link>
              <p>Anime tracking and analytics platform.</p>
              <div className="social-icons">
                <a
                  href="https://www.facebook.com/yamanjrexe"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook" />
                </a>
                <Link to="/community" aria-label="Community">
                  <i className="fab fa-discord" />
                </Link>
                <a
                  href="https://github.com/yamanjrexe/AniPulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <i className="fab fa-github" />
                </a>
                <a
                  href="https://www.instagram.com/yamanjr.exe"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h3>Features</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/statistics">Analytics</Link>
                </li>
                <li>
                  <Link to="/watchlist">Watchlist</Link>
                </li>
                <li>
                  <Link to="/achievements">Achievements</Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Resources</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/resources/about">About</Link>
                </li>
                <li>
                  <Link to="/resources/docs">Documentation</Link>
                </li>
                <li>
                  <Link to="/resources/help">Help Center</Link>
                </li>
                <li>
                  <Link to="/resources/changelog">Changelog</Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Community</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/community">Community Hub</Link>
                </li>
                <li>
                  <Link to="/community?tab=discussions">Discussions</Link>
                </li>
                <li>
                  <Link to="/leaderboard">Leaderboard</Link>
                </li>
                <li>
                  <Link to="/community?tab=friends">Friends</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2026 AniPulse. All rights reserved. Anime data via Anilist
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
