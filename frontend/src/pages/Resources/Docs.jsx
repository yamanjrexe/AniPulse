import React from "react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    icon: "fa-rocket",
    title: "Getting Started",
    desc: "Create your account, add your first anime, and understand the dashboard.",
    points: [
      "Sign up with email or Google",
      "Search any anime via AniList and one-click add",
      "Track episodes, status, score, and completion dates",
    ],
  },
  {
    icon: "fa-list-check",
    title: "Tracking Your Library",
    desc: "Everything you can do with an anime entry.",
    points: [
      "Four statuses: Completed · Watching · Plan to Watch · Dropped",
      "Progress caps to total episodes automatically",
      "Completion dates power the heatmap and recaps",
    ],
  },
  {
    icon: "fa-chart-line",
    title: "Analytics & Stats",
    desc: "What the numbers on the Statistics page actually mean.",
    points: [
      "Overview Metrics: totals across your whole library",
      "Period Stats: pick any month/year for a snapshot",
      "Rating Analytics: distribution, behaviour, personality",
    ],
  },
  {
    icon: "fa-cloud",
    title: "Cloud Sync",
    desc: "How your data travels between devices.",
    points: [
      "Every change is saved locally first, then synced",
      "The server is the source of truth on first load",
      "Offline edits are queued and pushed when you reconnect",
    ],
  },
  {
    icon: "fa-file-import",
    title: "Import & Export",
    desc: "Bring your data in, take it out.",
    points: [
      "Import a JSON file from the FAB menu → Import Anime",
      "Export everything, or just one completion year",
      "Danger Zone in Settings for full JSON export",
    ],
  },
  {
    icon: "fa-star",
    title: "Levels & Achievements",
    desc: "Earning XP, levelling up, unlocking badges.",
    points: [
      "XP comes from completing anime — more for longer shows",
      "Daily XP limit of 1,500 keeps things fair",
      "50 levels, 38 achievements, unlockable in any order",
    ],
  },
];

export default function Docs() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Documentation</h1>
        <p>
          Everything you need to get the most out of AniPulse. Each section
          below covers a feature area end-to-end.
        </p>
      </header>

      <div className="resources-grid">
        {SECTIONS.map((s) => (
          <section key={s.title} className="resources-card">
            <div className="resources-card-icon">
              <i className={`fas ${s.icon}`} />
            </div>
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
            <ul>
              {s.points.map((p) => (
                <li key={p}>
                  <i className="fas fa-check" /> {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="resources-cta">
        <h2>Still need help?</h2>
        <p>
          Check the <Link to="/resources/help">Help Center</Link> for common
          questions, or open a discussion inside the app.
        </p>
        <Link to="/community" className="btn btn-primary">
          <i className="fas fa-users" /> Visit Community
        </Link>
      </div>
    </div>
  );
}
