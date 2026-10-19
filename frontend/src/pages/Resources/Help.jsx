import React from "react";
import { Link } from "react-router-dom";

const FAQ_GROUPS = [
  {
    category: "Basics & Navigation",
    items: [
      {
        q: "Why can't I change the title of an anime once it's added?",
        a: "Titles are locked after being added to prevent accidental changes that would break the AniList sync mapping. If you added the wrong anime, delete it and re-add it using the search bar to ensure the cover, genres, and metadata match perfectly.",
      },
      {
        q: "How do I quickly add multiple anime?",
        a: "Open the Add Anime modal. Type a name, select it from the dropdown, and press 'Enter' to save. The modal will close, and you can immediately press the '+' FAB to add the next one. Our smart keyboard navigation lets you hit 'Enter' to jump through the form without clicking.",
      },
      {
        q: "What does the 'FAB' do?",
        a: "The Floating Action Button (bottom-right) is your quick-action menu. It lets you open the ChatBot, Import a JSON file, or open the Add Anime modal from any page in the app.",
      },
    ],
  },
  {
    category: "XP, Levels & Achievements",
    items: [
      {
        q: "How does the XP system work?",
        a: "You earn XP by marking anime as 'Completed'. Longer anime (more episodes) give more XP. Your first 1,500 XP per day is applied instantly. Any extra XP goes into a queue and is automatically applied after the daily reset.",
      },
      {
        q: "Why did my XP go down after I edited an anime?",
        a: "XP is recalculated based on your total episode count and scores. If you change an anime from 'Completed' to 'Dropped', or reduce the episode count, your total XP will automatically adjust downward.",
      },
      {
        q: "Do achievements reset if I delete an anime?",
        a: "No. Achievements are permanent badges of honor. Once you unlock a milestone (e.g., 'Completed 100 Anime'), it stays unlocked on your profile forever, even if you clear your list.",
      },
    ],
  },
  {
    category: "AniList Sync & Backend",
    items: [
      {
        q: "My anime matched to the wrong version on AniList (e.g., OVA instead of TV). How do I fix it?",
        a: "Go to Settings -> Sync & Backup. Click 'Deep Re-sync'. This will wipe your existing AniList mappings and re-search every single anime using our advanced title and format-matching algorithm. It forces the system to look for the TV version if your type is set to TV.",
      },
      {
        q: "Why isn't my AniList activity feed showing my completions?",
        a: "We designed the sync to be non-spammy. When you mark an anime as 'Completed', AniPulse sends a silent status update to AniList. This updates your score and progress to 100% without generating a 'Watched Episode 12' activity post. It will only post a 'Completed' activity.",
      },
      {
        q: "I deleted an anime, but it came back after refreshing. Why?",
        a: "This happens if the cloud sync is interrupted or failed. The app will pull the old data from the Firebase database on refresh. Ensure you have a stable internet connection. If it persists, it means the delete request failed; try clearing your browser cache or check if the backend is running.",
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
          <Link to="/community?tab=discussions" className="btn btn-primary">
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
