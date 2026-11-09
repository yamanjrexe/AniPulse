import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CountUp from "../components/ui/CountUp.jsx";

const FEATURES = [
  {
    icon: "fa-fire",
    title: "Global Spotlight",
    desc: "Discover what the world is watching right now with our real-time trending anime hero slider.",
    list: ["Live AniList data", "Auto-playing slider", "Smart season badges"],
  },
  {
    icon: "fa-magic",
    title: "Story-Style Recaps",
    desc: "Experience your anime journey like never before with interactive, swipeable monthly and yearly recaps.",
    list: ["Interactive slides", "Poster showcases", "Animated stats"],
  },
  {
    icon: "fa-chart-pie",
    title: "Deep Analytics",
    desc: "Dive into your viewing habits with GitHub-style heatmaps, genre distribution charts, and rating personalities.",
    list: ["Activity heatmaps", "Rating insights", "Watch time stats"],
  },
  {
    icon: "fa-shield-alt",
    title: "Privacy & Security",
    desc: "Your watch history is strictly yours. We enforce strict database rules and email verification to keep your data safe.",
    list: ["Firebase App Check", "Strict data rules", "Private activity logs"],
  },
  {
    icon: "fa-sync-alt",
    title: "Two-Way AniList Sync",
    desc: "Keep your AniPulse library perfectly aligned with your AniList profile using our smart background worker.",
    list: ["Auto-sync updates", "Deep re-sync", "Format matching"],
  },
  {
    icon: "fa-mobile-alt",
    title: "Installable PWA",
    desc: "AniPulse works beautifully as a Progressive Web App. Install it on your phone or desktop for a native experience.",
    list: ["Offline mode", "Home screen install", "Lightning fast"],
  },
];

const STATS = [
  { end: 1000, suffix: "+", label: "Active Users", duration: 1200, delay: 0 },
  {
    end: 25000,
    suffix: "+",
    label: "Episodes Tracked",
    duration: 1500,
    delay: 120,
  },
  { end: 99, suffix: "%", label: "Uptime", duration: 900, delay: 240 },
  {
    end: 4.9,
    decimals: 1,
    suffix: "★",
    label: "User Rating",
    duration: 1100,
    delay: 360,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up securely with email or Google. Enable 2FA for extra security.",
  },
  {
    num: "02",
    title: "Build your library",
    desc: "Search our massive AniList database to add anime and track your progress.",
  },
  {
    num: "03",
    title: "Analyze & Sync",
    desc: "Watch your stats come alive, unlock achievements, and sync to your AniList profile.",
  },
];

const FAQS = [
  {
    q: "Is AniPulse completely free?",
    a: "Yes! AniPulse is a passion project and is completely free to use. There are no premium tiers, hidden fees, or ads.",
  },
  {
    q: "Does it sync with MyAnimeList?",
    a: "Currently, we offer deep, two-way synchronization with AniList. We are exploring MyAnimeList integration for future updates.",
  },
  {
    q: "Can I use AniPulse offline?",
    a: "Absolutely. Because AniPulse is a Progressive Web App (PWA), you can install it on your device and access your cached data offline.",
  },
  {
    q: "Is my watch history private?",
    a: "Privacy is our top priority. We use strict Firebase Security Rules and App Check. Your private data is never shared with other users.",
  },
];

const HERO_PREVIEW_STATS = [
  { label: "Completed", end: 142, duration: 1000, delay: 0 },
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
      ".feature-card, .stats-section .stat-card, .step-card",
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
              <i className="fas fa-rocket" /> Version 3.2.4 is live
            </div>

            <h1 className="hero-title">
              Your anime journey,
              <br />
              <span>visualized &amp; analyzed</span>
            </h1>

            <p className="hero-subtitle">
              AniPulse is more than an anime tracker. Track every episode,
              discover global trends in our new Spotlight tab, and celebrate
              your milestones with interactive story-style recaps.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>Privacy-first</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>AniList Sync</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle feature-check" />
                <span>Installable PWA</span>
              </div>
            </div>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/login?register=true")}
              >
                <i className="fas fa-play-circle" /> Start tracking free
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
              <div className="preview-window-bar">
                <div className="window-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="window-title">
                  <img
                    src="/icon/Anipulse.png"
                    alt="Logo"
                    className="logo-img"
                  />
                </div>
                <div className="window-actions">
                  <i className="fas fa-search" />
                  <i className="fas fa-bell" />
                </div>
              </div>

              <div className="preview-stats">
                <div className="stats-grid-preview">
                  {HERO_PREVIEW_STATS.map((s) => (
                    <div key={s.label} className="stat-preview">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value">
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
                  {[45, 70, 60, 90, 55, 85, 70].map((h, i) => (
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

      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How it works</span>
            <h2 className="section-title">Start tracking in seconds</h2>
            <p className="section-subtitle">
              Three simple steps to transform your anime journey.
            </p>
          </div>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{step.num}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
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

      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Everything you need to know before getting started.
            </p>
          </div>
          <div className="faq-grid">
            {FAQS.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
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
