
import React from "react";

export const RELEASES = [
  // {
  //   version: "3.3.0",
  //   date: "Late November 2026",
  //   tag: "The Final Chapter",
  //   items: [
  //     "Final major release. AniPulse is now feature-complete.",
  //     "Maintenance Mode: Critical bugs, security issues, and UI/UX problems will still be fixed.",
  //     "Thank you for being part of the AniPulse journey!",
  //   ],
  // },
  {
  version: "3.2.3",
  date: "November 7th 2026",
  tag: "",
  items: [
    "Community: Rebuilt Discussions into a real-time chat board with image uploads, stat sharing, post/reply moderation, and unread notifications.",
    "Currently Watching: Redesigned cards with cinematic 16:9 layouts, episode badges, progress counters, image progress bars, and quick anime removal with confirmation.",
    "Watchlist & Top Rated: Standardized card sizes and grid layouts for a cleaner, consistent appearance.",
    "Dashboard: Added a dynamic counter badge to Recent Activity that updates with the active filter.",
    "UI/UX: Fixed horizontal scrolling in the Add Anime search modal and improved text truncation."
  ],
},
  {
    version: "3.2.2",
    date: "November 5th 2026",
    tag: "",
    items: [
      "Community: Replaced the unused Feed tab with Spotlight for improved privacy.",
      "Spotlight: Added an autoplaying cinematic slider featuring the top 6 globally trending anime, with blurred banners, high-res posters, full synopses, and smart season badges (S2, S3).",
      "Spotlight: Added a paginated 40-anime grid powered by real-time AniList data, with skeleton loaders.",
      "Landing Page: Redesigned with a premium dark theme, interactive app mockup with realistic charts and stats, and new How It Works and FAQ sections.",
    ],
  },
  {
    version: "3.2.1",
    date: "November 4th 2026",
    tag: "",
    items: [
      "Recap: Redesigned monthly and yearly recaps as interactive stories.",
      "Recap: Added mobile swipe navigation.",
      "Recap: Added TMDB posters for your top 3 rated anime.",
      "Recap: Animated watch time, episode, and active-day counts.",
      "Recap: Added slide text and icon animations.",
      "Settings: Added Compact View for smaller anime cards.",
      "Settings: Added Reduce Motion to disable animations and transitions.",
      "Settings: Added a Level Roadmap showing upcoming unlocks and XP targets.",
    ],
  },
  {
    version: "3.2.0",
    date: "November 1st 2026",
    tag: "",
    items: [
      "Security: Restricted database access and blocked unauthorized API use.",
      "Security: Added Firebase App Check to block bots and protect API quotas.",
      "Security: Required email verification for new accounts.",
      "Security: Protected the TMDB poster proxy from API abuse.",
      "Security: Added server validation for XP and leaderboard data.",
      "Security: Added Firebase admin authorization groundwork.",
      "System: Synced frontend and backend Level/XP calculations.",
      "Performance: Improved profile loading and data syncing.",
    ],
  },
  {
    version: "3.1.6",
    date: "October 30th 2026",
    tag: "",
    items: [
      "Posters: Made TMDB the primary source for textless English artwork.",
      "Posters: Added genre and country checks to filter out non-anime matches.",
      "Posters: Fall back to AniList covers when TMDB posters fail.",
      "Performance: Batched poster requests to avoid TMDB rate limits.",
      "Posters: Applied custom URLs to your top 8 rated anime.",
      "Anime Modal: Added a live poster preview to Add/Edit.",
    ],
  },
  {
    version: "3.1.5",
    date: "October 27th 2026",
    tag: "",
    items: [
      "Anime List: Added genre filters and filter-aware counts.",
      "Streaks: Fixed syncing and added midnight recalculation.",
      "Profiles: Redesigned layout, responsiveness, lists, and badges.",
      "Profiles: Fixed AniList and MyAnimeList links.",
      "Settings: Updated Profile Preview to match Community Profiles.",
      "Danger Zone: Added cloud sync, gamification reset, and cache tools.",
    ],
  },
  {
    version: "3.1.4",
    date: "October 19th 2026",
    tag: "",
    items: [
      "Routing: Fixed navigation and added loading indicators.",
      "Layout: Kept the header and navigation visible during loading.",
      "Profile: Updated banner, avatar, cropper, and join date.",
      "Danger Zone: Added cloud data clearing with a warning.",
      "Empty States: Added prompts for empty lists and charts.",
      "Anime Modal: Fixed deleted anime returning after refresh.",
      "Backend: Added the missing anime save route.",
      "Performance: Fixed rendering loops that caused lag.",
    ],
  },
  {
    version: "3.1.3",
    date: "October 18th 2026",
    tag: "",
    items: [
      "Anime Modal: Improved keyboard navigation and focus.",
      "ChatBot: Added AniList recommendations, filters, poster cards, voice input, and history.",
      "Recent Activity: Added history, time filters, delete controls, and cloud sync.",
      "Recent Activity: Saved filters, raised history limit to 500, and fixed dark mode.",
    ],
  },
  {
    version: "3.1.2",
    date: "October 10th 2026",
    tag: "",
    items: [
      "AniList Sync: Added two-way syncing for anime additions, edits, and deletions.",
      "AniList Sync: Supported combined seasons and valid episode limits.",
      "AniList Sync: Added sync progress tracking.",
      "AniList Sync: Improved matching across alternate titles.",
      "AniList Sync: Added Deep Re-sync for full rematching.",
    ],
  },
  {
    version: "3.1.1",
    date: "October 9th 2026",
    tag: "",
    items: [
      "Period Stats: Saved month and year filters between sessions.",
      "Completion Journey: Restored the Most Active Year stat.",
      "Achievements: Fixed 7- and 30-day streak badges.",
    ],
  },
  {
    version: "3.1.0",
    date: "October 3rd 2026",
    tag: "",
    items: [
      "Gamification: Recalculated daily XP from your anime library.",
      "XP Queue: Showed daily XP within the earning limit.",
      "Mobile: Prevented input zoom on iOS Safari.",
    ],
  },
  {
    version: "3.0.0",
    date: "September 25th 2026",
    tag: "",
    items: [
      "Design: Updated the design system and page layouts.",
      "Streaks: Switched to server-verified data.",
      "Cloud Sync: Prevented old streak data from overwriting progress.",
      "Modals: Added scroll locking across the app.",
      "Migration: Rebuilt AniPulse with React.",
    ],
  },
  {
    version: "3 Beta Part 2",
    date: "August 16th 2026",
    tag: "",
    items: [
      "ChatBot: Added an assistant to help new users.",
      "Dashboard: Improved the statistics page layout.",
    ],
  },
  {
    version: "3 Beta Part 1.2",
    date: "June 24th 2026",
    tag: "",
    items: [
      "Sync: Added cross-device account syncing.",
      "Dashboard: Improved the UI and usability.",
    ],
  },
  {
    version: "3 Beta Part 1.1",
    date: "June 24th 2026",
    tag: "",
    items: [
      "Statistics: Added a personalized hero with insights and key stats.",
      "Leaderboard: Added global user rankings.",
      "Dashboard: Updated statistics layout and styling.",
    ],
  },
  {
    version: "2.1.0",
    date: "May 30th 2026",
    tag: "",
    items: [
      "Gamification: Expanded level and rank tiers.",
      "UI: Added themes and customization options.",
      "Performance: Improved loading for large anime lists.",
    ],
  },
  {
    version: "2.0.0",
    date: "April 15th 2026",
    tag: "",
    items: [
      "Backend: Added an Express API and Firebase.",
      "Accounts: Added authentication and user profiles.",
      "Social: Added friends, rankings, and community features.",
      "Sync: Added cloud syncing for anime data.",
    ],
  },
  {
    version: "1.0.2",
    date: "February 20th 2026",
    tag: "",
    items: [
      "Dashboard: Improved statistics layout.",
      "Fixes: Improved UI stability and fixed bugs.",
    ],
  },
  {
    version: "1.0.1",
    date: "February 5th 2026",
    tag: "",
    items: [
      "Branding: Finalized the AniPulse name and identity.",
      "SEO: Added meta descriptions and keywords.",
      "Core: Improved anime tracking.",
    ],
  },
  {
    version: "1.0.0",
    date: "December 31st 2025",
    tag: "",
    items: [
      "Foundation: Launched AniPulse as an anime tracker.",
      "Branding: Set the AniPulse title and SEO metadata.",
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
