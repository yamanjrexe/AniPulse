import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>About AniPulse</h1>
        <p>
          A modern, privacy-first anime tracker built for people who love data,
          clean interfaces, and seamless integrations.
        </p>
      </header>

      <div
        className="resources-card"
        style={{ maxWidth: 840, margin: "0 auto" }}
      >
        <h2>The Story</h2>
        <p>
          AniPulse started as a passion project. Existing anime trackers often
          felt dated, lacked modern analytics, or forced you into clunky
          interfaces. We wanted to build a tracker that felt like a premium app
          — one that treats your viewing history as a story worth visualizing.
        </p>
        <p>
          Whether you're tracking a single seasonal anime or managing a library
          of thousands of episodes, AniPulse is designed to scale with you, your
          data, and your devices.
        </p>

        <h2 style={{ marginTop: 32 }}>Powerful Features</h2>
        <div style={{ display: "grid", gap: "20px", marginTop: "16px" }}>
          <div>
            <h3
              style={{
                fontSize: "1rem",
                color: "var(--brand-yellow)",
                marginBottom: "4px",
              }}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: "8px" }} />
              Instant AniList Import
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Connect your AniList account and mirror your entire library in
              seconds. Our backend worker intelligently batches your list,
              fetches high-resolution TMDB covers in the background, and cleans
              up ID gaps so your list stays perfectly chronological.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1rem",
                color: "var(--brand-yellow)",
                marginBottom: "4px",
              }}
            >
              <i className="fas fa-trophy" style={{ marginRight: "8px" }} />
              48-Tier Achievement System
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Level up your tracking with a massive expansion to 48
              achievements. We track your episodes, hours, ratings, and streaks
              fairly and accurately, rewarding you with massive XP bounties as
              you progress from Rookie to Omnipotent.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1rem",
                color: "var(--brand-yellow)",
                marginBottom: "4px",
              }}
            >
              <i className="fas fa-bolt" style={{ marginRight: "8px" }} />
              Blazing Fast Performance
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              We completely overhauled our data pipeline. By optimizing API
              payloads, compressing heavy Base64 images, and implementing smart
              local caching, the global leaderboard and user profiles now load
              almost instantly.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1rem",
                color: "var(--brand-yellow)",
                marginBottom: "4px",
              }}
            >
              <i className="fas fa-chart-pie" style={{ marginRight: "8px" }} />
              Deep Analytics Engine
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Dive into your viewing habits with a GitHub-style completion
              heatmap, month-by-month period stats, and a redesigned Rating
              Analytics dashboard that breaks down your average, median, and
              most common scores so you know exactly what kind of critic you
              are.
            </p>
          </div>
        </div>

        <h2 style={{ marginTop: 32 }}>Tech Stack & Open Source</h2>
        <p>
          AniPulse is proudly open source and built with modern technologies:
        </p>
        <ul
          style={{
            listStyleType: "disc",
            paddingLeft: "20px",
            fontSize: "0.9rem",
            lineHeight: "1.8",
          }}
        >
          <li>
            <strong>Frontend:</strong> React, React Router, Chart.js, Context
            API
          </li>
          <li>
            <strong>Backend:</strong> Node.js, Express, Firebase Admin
          </li>
          <li>
            <strong>Database:</strong> Google Cloud Firestore
          </li>
          <li>
            <strong>APIs:</strong> AniList GraphQL (for metadata and sync)
          </li>
        </ul>
        <p style={{ marginTop: "12px" }}>
          Check out the source code or contribute on{" "}
          <a
            href="https://github.com/yamanjrexe/AniPulse"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--brand-yellow)", fontWeight: "bold" }}
          >
            GitHub
          </a>
          .
        </p>

        <h2 style={{ marginTop: 32 }}>Privacy First</h2>
        <p>
          We believe your watch history is personal. Your library lives in your
          browser's localStorage first, meaning it works offline and loads
          instantly. When you log in, it securely syncs to your private Firebase
          document. We do not sell data, run ads, or track you across the web.
        </p>
      </div>

      <div className="resources-cta">
        <h2>Ready to start?</h2>
        <p>Create a free account and see your anime journey visualized.</p>
        <Link
          to="/login?register=true"
          className="btn btn-primary"
          style={{ color: "black" }}
        >
          <i className="fas fa-user-plus" /> Create free account
        </Link>
      </div>
    </div>
  );
}
