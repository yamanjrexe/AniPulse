import React from "react";

 export const RELEASES = [
  // {
  //   version: "3.3.0",
  //   date: "Late November 2026",
  //   tag: "The Final Chapter",
  //   items: [
  //     "Welcome to the final major milestone of AniPulse.",
  //     "The project is now officially feature-complete. Moving forward, no new features or major releases will be added.",
  //     "Maintenance Mode: The site is not abandoned. Any critical bugs, security vulnerabilities, or UI/UX issues that arise will still be actively patched and fixed.",
  //     "Thank you to everyone who used AniPulse to track, visualize, and celebrate their anime journey. It has been an incredible ride.",
  //   ],
  // },
  {
    version: "3.2.1",
    date: "November 4th 2026",
    tag: "",
    items: [
      "Recap: Completely redesigned the Monthly and Yearly Recaps to feel like an interactive, premium story experience.",
      "Recap: Added full mobile swipe support so you can easily swipe left and right to navigate through your stats.",
      "Recap: Integrated high-quality TMDB anime posters for your Top, 2nd, and 3rd highest-rated anime, replacing the plain text.",
      "Recap: Added smooth, animated counting numbers for your total hours watched, episodes completed, and active days.",
      "Recap: Implemented dynamic entry animations for text and icons, making every slide feel alive as it loads.",
      "Settings: Added a 'Compact View' toggle to shrink anime cards, allowing you to fit more posters on your dashboard.",
      "Settings: Added a 'Reduce Motion' toggle for accessibility, allowing you to disable page transitions, popups, and animations globally.",
      "Experience: Added a dynamic 'Level Roadmap' to the settings tab, showing you exactly which titles and XP thresholds you can unlock next.",
    ],
  },
  {
    version: "3.2.0",
    date: "November 1st 2026",
    tag: "",
    items: [
      "Security: Completely locked down the database to prevent unauthorized scripts, direct API abuse, and data scraping.",
      "Security: Integrated Google Fraud Defense (App Check) to block malicious bots and protect API quotas.",
      "Security: Enforced email verification for new accounts to prevent spam and fake profiles.",
      "Security: Protected the TMDB poster proxy to prevent external abuse of our API limits.",
      "Security: Added robust backend validation to the XP and Leaderboard system to prevent stat manipulation and cheating.",
      "Security: Built a secure admin authorization foundation using Firebase Custom Claims for future moderation tools.",
      "System: Unified the Level and XP calculation logic between the frontend and backend for perfect accuracy and zero desync.",
      "Performance: Optimized backend routes and data fetching for faster profile loads and smoother syncing.",
    ],
  },
  {
    version: "3.1.6",
    date: "October 30th 2026",
    tag: "",
    items: [
      "Posters: Integrated TMDB as the primary poster provider for high-quality, textless, and English artwork.",
      "Posters: Implemented strict genre and country validation to ensure only accurate anime matches are returned, blocking live-action shows and western cartoons.",
      "Posters: Replaced the 'No Poster' placeholder with a seamless fallback system that instantly restores AniList covers if TMDB fails.",
      "Performance: Added a smart batching queue to fetch posters efficiently without triggering TMDB API rate limits.",
      "Customization: Custom poster URLs are now fully respected for the Top 8 highest-rated anime in your list.",
      "Anime Modal: Added a live floating poster preview on the left side of the Add/Edit modal that updates instantly upon selection.",
    ],
  },
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
