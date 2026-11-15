import React from "react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    icon: "fa-rocket",
    title: "Getting Started & UI",
    desc: "Learn the layout and how to navigate the app quickly.",
    points: [
      "FAB Menu: Click the floating yellow button (bottom-right) to Add Anime, Import, or open the ChatBot",
      "Filters: Use the dropdowns on your Anime List or Watchlist to filter by Status, Type (TV, Movie, OVA), and Genre",
      "Keyboard Shortcuts: Press Enter in forms to jump to the next field; press Esc to close modals",
      "PWA Install: Use the download icon in the header to install AniPulse as a native app",
    ],
  },
  {
    icon: "fa-list-check",
    title: "Tracking Your Library",
    desc: "Master the anime list and keep your data accurate.",
    points: [
      "Smart Progress: Selecting 'Watching' automatically bumps your progress to at least 1",
      "Date Picker: When marking as Completed, choose the exact month and year (and day, if it's in the past)",
      "Top 8: Feature up to 8 anime on your public profile by adding them in Settings",
      "Filters: Filter your list by status, type, completion month, and year to find specific entries",
    ],
  },
  {
    icon: "fa-trophy",
    title: "Gamification & Achievements",
    desc: "How your XP, levels, and history logs work.",
    points: [
      "XP System: Earn XP by adding anime and marking them completed (more XP for longer shows)",
      "Daily Limit: You can earn up to 1,500 XP per day; extra XP is queued and applied the next day",
      "48 Achievements: Earn badges for milestones like 10K episodes, 365-day streaks, and 500+ lists",
      "Levels: Level up from 1 to 50 (Rookie to Omnipotent) unlocking new titles and roadmap rewards",
    ],
  },
  {
    icon: "fa-sync-alt",
    title: "AniList Import & Sync",
    desc: "Keep both your AniPulse and AniList accounts perfectly aligned.",
    points: [
      "Import Library: Go to Settings → Sync & Backup to instantly mirror your AniList profile.",
      "TMDB Covers: Our background worker automatically fetches high-res covers for imported anime.",
      "ID Reindexing: Imported anime are cleanly sorted by date with no ID gaps.",
      "Background Sync: We queue your edits and push them without spamming your AniList activity feed.",
    ],
  },
  {
    icon: "fa-robot",
    title: "AniPulse ChatBot",
    desc: "Your personal anime assistant powered by AniList data.",
    points: [
      "Ask for recommendations: 'Recommend me', 'I'm sad', 'Action anime under 30 eps'",
      "Look up anime: 'Tell me about Frieren', 'Top 10 anime'",
      "Click any poster card to view a synopsis and add it to your list",
      "Voice Input: Use the microphone icon on supported browsers to speak your queries",
    ],
  },
  {
    icon: "fa-chart-line",
    title: "Analytics & Visuals",
    desc: "Understand the data behind your anime journey.",
    points: [
      "Heatmap: A daily grid of your completion history; darker green means more anime finished that day",
      "Period Stats: Pick any month/year combination to see exactly what you watched then",
      "Rating Analytics: Analyze your average, median, and most common scores to see your personality",
      "Monthly Charts: View your completion trends over the current year",
    ],
  },
  {
    icon: "fa-cloud",
    title: "Cloud Sync & Backup",
    desc: "How your data moves between devices safely.",
    points: [
      "Local-First: Every edit is saved to your browser instantly before hitting the cloud",
      "Firebase Sync: When logged in, your data securely syncs to Firestore",
      "Auto Backup: Enable this in Settings to write a JSON backup file directly to your computer's hard drive",
      "Conflict Resolution: The server is the source of truth on initial load",
    ],
  },
  {
    icon: "fa-user-astronaut",
    title: "Profile Customization",
    desc: "Make your profile truly yours.",
    points: [
      "Avatars & Banners: Upload images and crop them with our built-in Facebook/YouTube-style cropper",
      "Socials: Link your Twitter, Instagram, MyAnimeList, and AniList accounts",
      "Public Profiles: Claim a username to get a shareable link (anipulse.app/u/username)",
      "Member Since: Your profile automatically tracks the exact date you joined",
    ],
  },
  {
    icon: "fa-file-import",
    title: "Import, Export & Danger Zone",
    desc: "You own your data. Manage it safely.",
    points: [
      "Export: In the Danger Zone, download your entire list or filter it by completion year",
      "Import: Use the FAB menu to upload a JSON file (formatted correctly)",
      "Clear Data: The Danger Zone allows you to wipe your local AND cloud data permanently",
      "Recovery: Once data is cleared, it cannot be restored unless you have an export",
    ],
  },
];

export default function Docs() {
  return (
    <div className="resources-page docs-page">
      <style>{`
        .docs-page .resources-grid {
          gap: 24px;
        }
        
        .docs-page .resources-card {
          position: relative;
          overflow: hidden;
          padding: 32px;
          background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-surface) 100%);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
          display: flex;
          flex-direction: column;
        }

        .docs-page .resources-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--brand-yellow), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .docs-page .resources-card:hover {
          transform: translateY(-5px);
          border-color: rgba(252, 231, 6, 0.4);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(252, 231, 6, 0.05);
        }

        .docs-page .resources-card:hover::before {
          opacity: 1;
        }

        .docs-page .resources-card-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(252, 231, 6, 0.1);
          border: 1px solid rgba(252, 231, 6, 0.2);
          border-radius: 12px;
          color: var(--brand-yellow);
          font-size: 22px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .docs-page .resources-card:hover .resources-card-icon {
          background: var(--brand-yellow);
          color: #000;
          transform: scale(1.1) rotate(5deg);
        }

        .docs-page .docs-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .docs-page .docs-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 24px;
          flex: 1;
          line-height: 1.5;
        }

        .docs-page .docs-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .docs-page .docs-list li {
          position: relative;
          padding-left: 28px;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .docs-page .docs-list li::before {
          content: "\\f00c";
          font-family: "Font Awesome 6 Free";
          font-weight: 900;
          position: absolute;
          left: 0;
          top: 4px;
          color: var(--brand-yellow);
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .docs-page .resources-cta {
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%);
          border: 1px solid var(--border-strong);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Documentation & User Guide</h1>
        <p>
          Everything you need to master AniPulse. From basic tracking to deep
          analytics and AniList syncing, learn how to make the most of your
          library.
        </p>
      </header>

      <div className="resources-grid">
        {SECTIONS.map((s) => (
          <section key={s.title} className="resources-card">
            <div className="resources-card-icon">
              <i className={`fas ${s.icon}`} />
            </div>
            <h2 className="docs-title">{s.title}</h2>
            <p className="docs-desc">{s.desc}</p>
            <ul className="docs-list">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="resources-cta" style={{ marginTop: "48px" }}>
        <h2>Need more help?</h2>
        <p>
          If you couldn't find what you're looking for, check the Help Center or
          ask the community.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/resources/help"
            className="btn btn-primary"
            style={{ color: "black" }}
          >
            <i className="fas fa-question-circle" /> Help Center
          </Link>
          <Link to="/community" className="btn btn-secondary">
            <i className="fas fa-users" /> Visit Community
          </Link>
        </div>
      </div>
    </div>
  );
}
