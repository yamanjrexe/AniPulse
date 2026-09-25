import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>About AniPulse</h1>
        <p>
          AniPulse is a fan-made anime tracker built around the idea that your
          list should also tell a story about you.
        </p>
      </header>

      <div
        className="resources-card"
        style={{ maxWidth: 760, margin: "0 auto" }}
      >
        <h2>What it is</h2>
        <p>
          A modern tracker with real analytics. Track every episode, watch
          patterns emerge, get recaps at the end of every month, and compare
          stats with friends.
        </p>

        <h2 style={{ marginTop: 24 }}>What it isn't</h2>
        <p>
          Not a piracy site. Not a streaming service. Not affiliated with
          MyAnimeList, AniList, or any studio. Anime metadata comes from the
          public Jikan and AniList APIs.
        </p>

        <h2 style={{ marginTop: 24 }}>Privacy</h2>
        <p>
          Your library lives in your browser first, then syncs to Firebase when
          you're signed in. Nothing else is collected. No third-party analytics.
          No ad tracking.
        </p>

        <h2 style={{ marginTop: 24 }}>Source</h2>
        <p>
          The project is open source. Find it on{" "}
          <a
            href="https://github.com/yamanjrexe/AniPulse"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>

      <div className="resources-cta">
        <h2>Ready to start?</h2>
        <p>Create a free account and add your first anime in under a minute.</p>
        <Link to="/login?register=true" className="btn btn-primary">
          <i className="fas fa-user-plus" /> Create free account
        </Link>
      </div>
    </div>
  );
}
