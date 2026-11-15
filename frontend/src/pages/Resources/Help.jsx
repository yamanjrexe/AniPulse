import React from "react";
import { Link } from "react-router-dom";

const FAQ_GROUPS = [
  {
    category: "AniList Sync & Imports",
    items: [
      {
        q: "Why are there ID gaps in my anime list after importing?",
        a: "There shouldn't be! Our new v3.2.6 update completely rewrote the import logic. When you import from AniList, we automatically reindex every anime sequentially by their `createdAt` date. If you are still seeing gaps, try clicking 'Force XP Recalc' in Settings or re-importing.",
      },
      {
        q: "Why are my imported anime missing covers?",
        a: "When importing from AniList, AniPulse uses a background worker to fetch high-quality TMDB covers. If a cover is missing, it means TMDB didn't have a match. You can manually add a cover URL by editing the anime, or wait for our next database sync.",
      },
      {
        q: "Why isn't my AniList activity feed showing my completions?",
        a: "We designed the sync to be non-spammy. When you mark an anime as 'Completed', AniPulse sends a silent status update to AniList. This updates your score and progress to 100% without generating a 'Watched Episode 12' activity post.",
      },
      {
        q: "I deleted an anime, but it came back after refreshing. Why?",
        a: "This happens if the cloud sync is interrupted or failed. The app will pull the old data from the Firebase database on refresh. Ensure you have a stable internet connection. If it persists, it means the delete request failed; try clearing your browser cache.",
      },
    ],
  },
  {
    category: "XP, Levels & Achievements",
    items: [
      {
        q: "My XP and Level didn't update after a bulk import. How do I fix it?",
        a: "We fixed this in v3.2.6! If you are still seeing it, go to Settings → Sync & Backup and click 'Force XP Recalc'. If your XP drops or doesn't move, an old 'Admin Override' might be stuck on your account. Our backend now automatically clears stale overrides if they drift more than 15%, but you can also ping an admin to clear it manually.",
      },
      {
        q: "Why did my XP go down after I edited an anime?",
        a: "XP is recalculated based on your total episode count and scores. If you change an anime from 'Completed' to 'Dropped', or reduce the episode count, your total XP will automatically adjust downward.",
      },
      {
        q: "Do achievements reset if I delete an anime?",
        a: "No. Achievements are permanent badges of honor. Once you unlock a milestone (e.g., 'Completed 100 Anime'), it stays unlocked on your profile forever, even if you clear your list.",
      },
      {
        q: "I reached 10,000 episodes but didn't get the achievement.",
        a: "Achievements are calculated based on your **Completed** anime. Ensure that your anime are marked as 'Completed' and not 'Watching' or 'On-Hold'. If they are, try refreshing the page to force a recalculation.",
      },
    ],
  },
  {
    category: "Basics, Filters & UI",
    items: [
      {
        q: "How do I filter my list for only Movies or OVAs?",
        a: "On the Anime List or Watchlist page, use the new 'Type' dropdown filter. You can filter by TV, Movie, OVA, ONA, Special, and TV Short.",
      },
      {
        q: "Why can't I change the title of an anime once it's added?",
        a: "Titles are locked after being added to prevent accidental changes that would break the AniList sync mapping. If you added the wrong anime, delete it and re-add it using the search bar.",
      },
      {
        q: "What does the 'FAB' do?",
        a: "The Floating Action Button (bottom-right) is your quick-action menu. It lets you open the ChatBot, Import a JSON file, or open the Add Anime modal from any page in the app.",
      },
    ],
  },
  {
    category: "Troubleshooting & PWA",
    items: [
      {
        q: "The app is showing stale data or a blank screen. How do I fix it?",
        a: "Because AniPulse is a PWA (Progressive Web App), it caches files for offline use. Sometimes it holds onto an old version. Do a 'Hard Refresh' (Ctrl+F5 or Cmd+Shift+R). If that fails, go to your browser DevTools -> Application -> Storage -> 'Clear Site Data' and reload.",
      },
      {
        q: "How do I install AniPulse on my phone?",
        a: "Open AniPulse in Chrome (Android) or Safari (iOS). Tap the browser's share/menu button and select 'Add to Home Screen'. It will install like a native app, complete with an icon and full-screen mode.",
      },
      {
        q: "My heatmap or charts aren't updating.",
        a: "Charts rely on exact dates (Month, Day, Year). Ensure that when you mark an anime as 'Completed', you fill out the completion date properly. If you leave the date blank, it won't show up on the heatmap.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    items: [
      {
        q: "Where is my data stored?",
        a: "Your data is saved locally in your browser's LocalStorage first, making the UI lightning fast. If you are logged in, it securely syncs to Google Cloud Firestore (a private database document tied to your user ID).",
      },
      {
        q: "How do I permanently delete my account and data?",
        a: "Go to Settings -> Danger Zone. Click 'Clear All Data'. This will instantly wipe your anime list, history, and XP from your browser AND send a request to delete it from the cloud database. This action cannot be undone.",
      },
      {
        q: "Can I export my data to Excel?",
        a: "You can export your list as a JSON file in the Danger Zone. You can then use an online JSON-to-CSV converter to open it in Excel or Google Sheets.",
      },
    ],
  },
];

export default function Help() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Help Center</h1>
        <p>
          Find answers to common questions about tracking, syncing,
          troubleshooting, and your account.
        </p>
      </header>

      <div
        className="resources-faq"
        style={{ maxWidth: "840px", margin: "0 auto" }}
      >
        {FAQ_GROUPS.map((group) => (
          <div key={group.category} style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "16px",
                color: "var(--text-primary)",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {group.category}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="faq-item"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <summary
                    style={{
                      padding: "16px",
                      cursor: "pointer",
                      fontWeight: "600",
                      outline: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {item.q}
                  </summary>
                  <p
                    style={{
                      padding: "0 16px 16px",
                      margin: 0,
                      color: "var(--text-muted)",
                      lineHeight: "1.6",
                      fontSize: "0.9rem",
                    }}
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="resources-cta" style={{ marginTop: "20px" }}>
        <h2>Still stuck?</h2>
        <p>
          If your issue isn't listed here, reach out to the community or check
          the GitHub repository.
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
          <Link
            to="/community?tab=discussions"
            className="btn btn-primary"
            style={{ color: "black" }}
          >
            <i className="fas fa-comments" /> Ask in Community
          </Link>
          <a
            href="https://github.com/yamanjrexe/AniPulse/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <i className="fab fa-github" /> Report a Bug
          </a>
        </div>
      </div>
    </div>
  );
}
