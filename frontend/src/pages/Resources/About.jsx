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
              <i className="fas fa-list-ul" style={{ marginRight: "8px" }} />
              Two-Way AniList Sync
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Connect your AniList account to push your edits, progress updates,
              and completions directly to your AniList profile. Our smart
              backend worker prevents spamming your activity feed and
              automatically handles format mismatches.
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
              heatmap, month-by-month period stats, genre distribution charts,
              and a psychological rating analysis that tells you what kind of
              critic you are.
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
              <i className="fas fa-robot" style={{ marginRight: "8px" }} />
              Integrated AI ChatBot
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Stuck on what to watch? Our built-in bot uses the AniList GraphQL
              API to suggest shows based on your mood ("I'm sad", "I want
              action"), look up metadata, and even add shows to your Plan to
              Watch list with a single click.
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
              <i className="fas fa-mobile-alt" style={{ marginRight: "8px" }} />
              Installable PWA & Offline Mode
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              AniPulse is a Progressive Web App. Install it on your phone or
              desktop for a native app feel. Thanks to our local-first
              architecture, you can continue editing your list while offline;
              changes will sync automatically once you reconnect.
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
        <Link to="/login?register=true" className="btn btn-primary">
          <i className="fas fa-user-plus" /> Create free account
        </Link>
      </div>
    </div>
  );
}
