import React from "react";

const RELEASES = [
  {
    version: "3.1.1",
    date: "October 9th 2026",
    tag: "",
    items: [
      "Period Stats now remembers month/year filter across reloads and sessions",
      "Completion Journey now shows Most Active Year — was rendering blank",
      "Achievements: 7-Day and 30-Day Streak badges now unlock correctly — IDs were mismatched",
    ],
  },
  {
    version: "3.1.0",
    date: "October 3rd 2026",
    tag: "",
    items: [
      "Daily XP counter is now rebuilt from your library on every load — no inflated numbers",
      "XP Queue card shows real earnings for today, capped at the true daily limit",
      "Mobile input zoom disabled on iOS Safari — form controls render at 16px on small screens",
    ],
  },
  {
    version: "3.0.0",
    date: "September 25th 2026",
    tag: "",
    items: [
      "Complete design system refresh — every page rebuilt from scratch",
      "Rewritten streak engine — server-authoritative and consistent across devices",
      "Cloud sync now rejects backwards streak overwrites",
      "Modal scroll lock applied across the entire app",
      "Migrated from vanilla JavaScript to React",
    ],
  },
];;

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

  const m = input
    .trim()
    .match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/);

  if (!m) return null;

  const month = MONTHS[m[1].toLowerCase()];
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);

  if (month === undefined || isNaN(day) || isNaN(year)) return null;

  return new Date(year, month, day);
}

function daysBetween(from, to) {
  const msA = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const msB = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((msB - msA) / 86400000);
}

function getRelativeTag(dateStr, now = new Date()) {
  const target = parseReadableDate(dateStr);
  if (!target) return "";

  const diff = daysBetween(target, now);

  if (diff < 0) return "Coming soon";
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
        {RELEASES.map((r) => {
          const tag = getRelativeTag(r.date);
          return (
            <article key={r.version} className="changelog-entry">
              <div className="changelog-meta">
                <span className="changelog-version">v{r.version}</span>
                {tag && <span className="changelog-tag">{tag}</span>}
                <span className="changelog-date">{r.date}</span>
              </div>
              <ul>
                {r.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
