import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CountUp from "../components/ui/CountUp.jsx";

const FEATURES = [
  {
    icon: "fa-chart-line",
    title: "Advanced Analytics",
    desc: "Deep insights into your watching habits, genre preferences, and interactive charts.",
    list: ["Monthly progress", "Genre distribution", "Watch time stats"],
  },
  {
    icon: "fa-heart",
    title: "Smart Watchlist",
    desc: "Organize anime with custom status, priority, and episode tracking.",
    list: ["Custom categories", "Priority sorting", "Seasonal planning"],
  },
  {
    icon: "fa-trophy",
    title: "Achievements",
    desc: "Unlock badges, celebrate milestones, and join seasonal challenges.",
    list: ["50+ badges", "Progress milestones", "Achievement showcase"],
  },
  {
    icon: "fa-calendar-day",
    title: "Activity Heatmaps",
    desc: "Yearly activity visualization, daily patterns, and seasonal trends.",
    list: ["Heatmap calendar", "Watching patterns", "Custom ranges"],
  },
  {
    icon: "fa-robot",
    title: "AI Recommendations",
    desc: "Personalized anime suggestions based on your taste and ratings.",
    list: ["Smart matching", "Hidden gems", "Seasonal picks"],
  },
  {
    icon: "fa-users",
    title: "Community Hub",
    desc: "Connect with fans, share progress, and join discussions.",
    list: ["User profiles", "Discussion forums", "Shared watchlists"],
  },
];

const STATS = [
  { end: 1000, suffix: "+", label: "Active Users", duration: 1200, delay: 0 },
  {
    end: 1500,
    suffix: "+",
    label: "Anime Entries",
    duration: 1500,
    delay: 120,
  },
  {
    end: 98,
    suffix: "%",
    label: "User Satisfaction",
    duration: 900,
    delay: 240,
  },
  {
    end: 4.8,
    decimals: 1,
    suffix: "?",
    label: "Average Rating",
    duration: 1100,
    delay: 360,
  },
];

const HERO_PREVIEW_STATS = [
  { label: "Completed", end: 42, duration: 1000, delay: 0 },
  { label: "Hours", end: 328, duration: 1300, delay: 100 },
  { label: "Episodes", end: 1240, duration: 1600, delay: 200 },
  { label: "Score Avg", end: 8.2, decimals: 1, duration: 900, delay: 300 },
];

export default function Landing() {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") return;
    if (localStorage.getItem("authToken")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current;
      if (!header) return;
      if (window.scrollY > 50) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(
      ".feature-card, .stats-section .stat-card",
    );
    if (!els.length) return;

    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition =
        "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    els.forEach((el) => observer.observe(el));

    const timeout = setTimeout(() => {
      els.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 100) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      });
    }, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header className="landing-header" id="header" ref={headerRef}>
        <div className="container header-content">
          <Link to="/" className="logo" aria-label="AniPulse Home">
            <img
              src="/icon/Anipulse.png"
              alt="AniPulse Logo"
              className="header-logo"
            />
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollTo(featuresRef)}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollTo(statsRef)}
            >
              Stats
            </button>
            <Link to="/dashboard" className="cta-button">
              Launch App
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-tag">
              <i className="fas fa-rocket" /> Version 3 launched
            </div>

            <h1 className="hero-title">
              Your anime journey,
              <br />
              <span>visualized &amp; analyzed</span>
            </h1>

            <p className="hero-subtitle">
              AniPulse is more than an anime tracker. Track every episode,
              analyze habits, discover patterns, and connect with a community
              that shares your passion.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>Real-time progress</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>Advanced analytics</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>AI recommendations</span>
              </div>
            </div>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/login?register=true")}
              >
                <i className="fas fa-play-circle" /> Start free
              </button>
              <button
                className="btn-secondary"
                onClick={() => scrollTo(featuresRef)}
              >
                <i className="fas fa-chart-line" /> Explore features
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <img
                  src="/icon/Anipulse.png"
                  alt="AniPulse Logo"
                  className="logo-img"
                />
                <div className="preview-icons">
                  {["fa-search", "fa-bell", "fa-sun"].map((ic) => (
                    <div key={ic} className="preview-icon-btn">
                      <i className={`fas ${ic}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="preview-stats">
                <div className="stats-grid-preview">
                  {HERO_PREVIEW_STATS.map((s) => (
                    <div key={s.label} className="stat-preview">
                      <div>{s.label}</div>
                      <div>
                        <CountUp
                          end={s.end}
                          decimals={s.decimals || 0}
                          duration={s.duration}
                          delay={s.delay}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="preview-chart">
                  {[75, 60, 90, 45, 80, 70, 55].map((h, i) => (
                    <div
                      key={i}
                      className="chart-bar"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features" ref={featuresRef}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Powerful features</span>
            <h2 className="section-title">
              Everything you need in one dashboard
            </h2>
            <p className="section-subtitle">
              Tracking, analytics, and community features combined for anime
              lovers.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">
                  <i className={`fas ${f.icon}`} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-description">{f.desc}</p>
                <ul className="feature-list">
                  {f.list.map((item) => (
                    <li key={item}>
                      <i className="fas fa-check" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">By the numbers</span>
            <h2 className="section-title">Trusted by anime enthusiasts</h2>
            <p className="section-subtitle">
              Join thousands who transformed their tracking experience.
            </p>
          </div>

          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-number">
                  <CountUp
                    end={s.end}
                    decimals={s.decimals || 0}
                    suffix={s.suffix || ""}
                    duration={s.duration}
                    delay={s.delay}
                    inView
                    threshold={0.4}
                  />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="community" className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">
              Ready to transform your anime experience?
            </h2>
            <p className="cta-subtitle">
              Join AniPulse today and start tracking, analyzing, and celebrating
              your anime journey.
            </p>

            <div className="cta-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/login?register=true")}
              >
                <i className="fas fa-user-plus" /> Create free account
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/login")}
              >
                <i className="fas fa-sign-in-alt" /> Sign in to dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

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
                  <Link to="/resources/docs">Documentation</Link>
                </li>
                <li>
                  <Link to="/resources/help">Help Center</Link>
                </li>
                <li>
                  <Link to="/resources/changelog">Changelog</Link>
                </li>
                <li>
                  <Link to="/resources/about">About</Link>
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
              API  fan-made project.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
