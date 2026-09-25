import React, { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

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
          <div className="footer-bottom">
            <p>
              &copy; 2026 AniPulse. All rights reserved. Anime data via Jikan
              API — fan-made project.
            </p>
            <p style={{ marginTop: 8 }}>
              <Link to="/" style={{ color: "inherit" }}>
                Home
              </Link>{" "}
              ·{" "}
              <Link to="/resources/about" style={{ color: "inherit" }}>
                About
              </Link>{" "}
              ·{" "}
              <Link to="/resources/changelog" style={{ color: "inherit" }}>
                Changelog
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
