import React from "react";

const RELEASES = [
  {
    version: "3.1.5",
    date: "October 27th 2026",
    tag: "",
    items: [
      "Anime List: Added dynamic genre filtering and updated the Total Anime counter to reflect active filters.",
      "Streaks: Fixed sync issues, added automatic midnight recalculation, and improved cloud syncing.",
      "User Profiles: Redesigned the layout, improved responsiveness, and updated anime lists, badges, and labels.",
      "Social Links: Fixed AniList and MyAnimeList profile URLs.",
      "Settings: Updated Profile Preview to match the new Community Profile design.",
      "Danger Zone: Added Force Cloud Sync, Reset Gamification, and Clear Local Cache tools.",
    ],
  },
  {
    version: "3.1.4",
    date: "October 19th 2026",
    tag: "",
    items: [
      "Routing: Fixed navigation issues and added loading spinners.",
      "Layout: Kept the header and navigation visible while loading.",
      "Profile: Redesigned the banner, avatar, image cropper, and join date.",
      "Danger Zone: Added Firebase data clearing and a custom warning modal.",
      "Empty States: Added 'Add your first anime' prompts across lists and charts.",
      "Anime Modal: Fixed deleted anime reappearing after refresh.",
      "Backend: Added the missing /api/anime/save route.",
      "Performance: Fixed infinite rendering loops causing browser lag.",
    ],
  },
  {
    version: "3.1.3",
    date: "October 18th 2026",
    tag: "",
    items: [
      "Anime Modal: Improved keyboard navigation and auto-focus.",
      "ChatBot: Added live AniList recommendations, smart filters, poster cards, voice input, and chat history.",
      "Recent Activity: Added inline history, time filters, delete/clear controls, and cloud sync.",
      "Recent Activity: Added saved filter preferences, increased history limit to 500 entries, and fixed dark mode styling.",
    ],
  },
  {
    version: "3.1.2",
    date: "October 10th 2026",
    tag: "",
    items: [
      "AniList Sync: Added automatic two-way library syncing for additions, edits, and deletions.",
      "AniList Sync: Supported combined-season entries and capped progress to the actual episode count.",
      "AniList Sync: Added a live progress bar for queued and syncing anime.",
      "AniList Sync: Improved title matching across romaji, English, native titles, and synonyms.",
      "AniList Sync: Added Deep Re-sync to rematch anime from scratch.",
    ],
  },
  {
    version: "3.1.1",
    date: "October 9th 2026",
    tag: "",
    items: [
      "Period Stats: Preserved month and year filters across reloads and sessions.",
      "Completion Journey: Fixed the missing Most Active Year statistic.",
      "Achievements: Fixed 7-Day and 30-Day Streak badge unlocking.",
    ],
  },
  {
    version: "3.1.0",
    date: "October 3rd 2026",
    tag: "",
    items: [
      "Gamification: Rebuilt the daily XP counter from the anime library to prevent inflated totals.",
      "XP Queue: Displayed actual daily XP earnings within the daily limit.",
      "Mobile: Prevented automatic input zoom on iOS Safari.",
    ],
  },
  {
    version: "3.0.0",
    date: "September 25th 2026",
    tag: "",
    items: [
      "Design: Refreshed the design system and rebuilt page layouts.",
      "Streaks: Reworked the streak engine to use server-authoritative data.",
      "Cloud Sync: Prevented older streak data from overwriting newer progress.",
      "Modals: Applied scroll locking throughout the app.",
      "Migration: Moved AniPulse from vanilla JavaScript to React.",
    ],
  },
  {
    version: "3 Bata Part 2",
    date: "August 16th 2026",
    tag: "",
    items: [
      "ChatBot: Added the chatbot to that the site for the help of new users",
      "Dashboard: Refined the statistics page layout and presentation.",
    ],
  },
  {
    version: "3 Beta Part 1.2",
    date: "June 24th 2026",
    tag: "",
    items: [
      "Sync: Made the global sync to all device feature so users can login from any devices.",
      "Dashboard: Refine the page and made the ui/ux more users friendly.",
    ],
  },
  {
    version: "3 Beta Part 1.1",
    date: "June 24th 2026",
    tag: "",
    items: [
      "Statistics: Introduced a personalized anime-journey hero section with greeting, insights, and key stats.",
      "Leaderboard: Made a Global Leaderbord for all the users to see their ranking.",
      "Dashboard: Updated the statistics page structure and styling.",
    ],
  },
  {
    version: "2.1.0",
    date: "May 30th 2026",
    tag: "",
    items: [
      "Features: Expanded the level and rank system with more tiers and visual flair.",
      "UI: Added new themes and customization options.",
      "Performance: Optimized data loading and rendering for larger lists.",
    ],
  },
  {
    version: "2.0.0",
    date: "April 15th 2026",
    tag: "",
    items: [
      "Backend: Major overhaul with a new Express API and Firebase integration.",
      "Accounts: Introduced user accounts, authentication, and profiles.",
      "Social: Added friends, rankings, and community features.",
      "Sync: Implemented initial cloud syncing for anime data.",
    ],
  },
  {
    version: "1.0.2",
    date: "February 20th 2026",
    tag: "",
    items: [
      "Dashboard: Refined the statistics page layout and presentation.",
      "Fixes: Squashed various UI bugs and improved stability.",
    ],
  },
  {
    version: "1.0.1",
    date: "February 5th 2026",
    tag: "",
    items: [
      "Branding: Finalized the AniPulse name and visual identity.",
      "SEO: Added meta descriptions and keywords for better discoverability.",
      "Core: Minor improvements to the anime tracking logic.",
    ],
  },
  {
    version: "1.0.0",
    date: "December 31st 2025",
    tag: "",
    items: [
      "Foundation: Established AniPulse as an anime tracker dashboard.",
      "Branding: Updated the page title to AniPulse and added SEO description and keyword metadata.",
    ],
  },
];

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function parseReadableDate(input) {
  if (!input || typeof input !== "string") return null;

  const match = input
    .trim()
    .match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/);

  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month === undefined || isNaN(day) || isNaN(year)) {
    return null;
  }

  return new Date(year, month, day);
}

function daysBetween(from, to) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());

  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((end - start) / 86400000);
}

function getRelativeTag(dateStr, now = new Date()) {
  const target = parseReadableDate(dateStr);
  if (!target) return "";

  const diff = daysBetween(target, now);

  if (diff < 0) return "";
  if (diff === 0) return "Latest";
  if (diff === 1) return "1 day ago";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "1 week ago";
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 60) return "1 month ago";
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  if (diff < 730) return "1 year ago";

  return `${Math.floor(diff / 365)} years ago`;
}

export default function Changelog() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Changelog</h1>
        <p>Every shipped release, newest first.</p>
      </header>

      <div className="resources-timeline">
        {RELEASES.map((release) => {
          const tag = getRelativeTag(release.date);

          return (
            <article key={release.version} className="changelog-entry">
              <div className="changelog-meta">
                <span className="changelog-version">v{release.version}</span>

                {tag && <span className="changelog-tag">{tag}</span>}

                <span className="changelog-date">{release.date}</span>
              </div>

              <ul>
                {release.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
