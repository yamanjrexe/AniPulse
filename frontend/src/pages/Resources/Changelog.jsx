import React from "react";
import { version } from "react-dom";

const RELEASES = [
  {
    version: "4.0.0",
    date: "October 2026",
    tag: "Coming soon",
    items: [

    ],
  },
  {
    version: "3.0.0",
    date: "September 2026",
    tag: "Latest",
    items: [
      "Complete design system refresh — every page rebuilt from scratch",
      "New Analytics suite: Overview, Period Stats, Library, Ratings, and Journey",
      "Rewritten streak engine — server-authoritative and consistent across devices",
      "Cloud sync now rejects backwards streak overwrites",
      "Modal scroll lock applied across the entire app",
      "JSON import — merge new entries or overwrite existing ones from the FAB",
      "Migrated from vanilla JavaScript to React",
    ],
  },
];

export default function Changelog() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Changelog</h1>
        <p>Every shipped release, newest first.</p>
      </header>

      <div className="resources-timeline">
        {RELEASES.map((r) => (
          <article key={r.version} className="changelog-entry">
            <div className="changelog-meta">
              <span className="changelog-version">v{r.version}</span>
              {r.tag && <span className="changelog-tag">{r.tag}</span>}
              <span className="changelog-date">{r.date}</span>
            </div>
            <ul>
              {r.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
