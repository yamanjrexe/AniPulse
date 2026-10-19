import React from "react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    icon: "fa-rocket",
    title: "Getting Started & UI",
    desc: "Learn the layout and how to navigate the app quickly.",
    points: [
      "FAB Menu: Click the floating yellow button (bottom-right) to Add Anime, Import, or open the ChatBot",
      "Keyboard Shortcuts: Press Enter in forms to jump to the next field; press Esc to close modals",
      "Theme Toggle: Swap between light and dark mode in the top header",
      "PWA Install: Use the download icon in the header to install AniPulse as an app",
    ],
  },
  {
    icon: "fa-list-check",
    title: "Tracking Your Library",
    desc: "Master the anime list and keep your data accurate.",
    points: [
      "Smart Progress: Selecting 'Watching' automatically bumps your progress to at least 1",
      "Date Picker: When marking as Completed, choose the exact month and year (and day, if it's in the past)",
      "Filters: Filter your list by status, completion month, and year to find specific entries",
      "Favorites: Feature up to 4 anime on your public profile by adding them in Settings",
    ],
  },
  {
    icon: "fa-chart-line",
    title: "Analytics & Visuals",
    desc: "Understand the data behind your anime journey.",
    points: [
      "Heatmap: A daily grid of your completion history; darker green means more anime finished that day",
      "Period Stats: Pick any month/year combination to see exactly what you watched then",
      "Rating Personality: Our algorithm analyzes your scores to tell you if you are a Generous, Balanced, or Harsh critic",
      "Monthly Charts: View your completion trends over the current year",
    ],
  },
  {
    icon: "fa-list-ul",
    title: "AniList Two-Way Sync",
    desc: "Keep both your AniPulse and AniList accounts perfectly aligned.",
    points: [
      "Connect via OAuth in Settings → Sync & Backup",
      "Background Sync: We queue your edits and push them without spamming your AniList activity feed",
      "Deep Re-sync: Fix wrong title or format matches (e.g., TV vs OVA) by forcing a fresh search",
      "Completion Rules: Marking as 'Completed' will auto-fill the episode count on AniList without creating a 'watched ep' activity",
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
    icon: "fa-history",
    title: "Activity History & Gamification",
    desc: "How your XP, levels, and history logs work.",
    points: [
      "XP System: Earn XP by adding anime and marking them completed (more XP for longer shows)",
      "Daily Limit: You can earn up to 1,500 XP per day; extra XP is queued and applied the next day",
      "Activity History: View your recent actions; filter by Today, Last 7 Days, etc., and delete specific logs",
      "Levels: Level up from 1 to 50, unlocking new titles (Newbie → Max)",
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
      "Custom Status: Write a short bio or set a custom status (e.g., 'Watching Frieren')",
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
    <div className="resources-page">
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
          <section
            key={s.title}
            className="resources-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="resources-card-icon">
              <i className={`fas ${s.icon}`} />
            </div>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              {s.title}
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "16px",
                flex: 1,
              }}
            >
              {s.desc}
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                display: "grid",
                gap: "10px",
                fontSize: "0.85rem",
                lineHeight: "1.5",
              }}
            >
              {s.points.map((p) => (
                <li key={p} style={{ position: "relative" }}>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="resources-cta" style={{ marginTop: "40px" }}>
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
            marginTop: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/resources/help" className="btn btn-primary">
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
