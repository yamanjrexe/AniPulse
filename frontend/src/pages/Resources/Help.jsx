import React from "react";
import { Link } from "react-router-dom";

const FAQ = [
  {
    q: "How do I add an anime?",
    a: "Open the floating action button (bottom-right), choose Add Anime, search by title, pick the result, adjust episodes/status, then save.",
  },
  {
    q: "Why is my streak different on another device?",
    a: "Streaks sync from the server on first load. Give the page a second to finish loading before editing anything.",
  },
  {
    q: "How do I import my MyAnimeList list?",
    a: "Export your MAL list as JSON in the same shape as our exports, then use Import Anime from the FAB menu.",
  },
  {
    q: "What is the daily XP limit?",
    a: "1,500 XP per calendar day. Anything above that goes into a queue and is automatically applied after the daily reset.",
  },
  {
    q: "Can I undo a deletion?",
    a: "Not yet. Once you delete an anime it's gone — including its XP contribution. Use the export in Danger Zone as a safety net.",
  },
  {
    q: "How do I change my avatar?",
    a: "Settings → Profile → Upload your photo. It's compressed to under 200 KB automatically.",
  },
  {
    q: "The leaderboard shows the wrong numbers for me",
    a: "Your own row derives from your current library. If it looks off, refresh the page or open the leaderboard fresh from the Community tab.",
  },
  {
    q: "How do I report a bug?",
    a: "Open a thread in Community → Discussions with a short description and, if possible, a screenshot.",
  },
];

export default function Help() {
  return (
    <div className="resources-page">
      <header className="resources-header">
        <span className="section-tag">Resources</span>
        <h1>Help Center</h1>
        <p>Quick answers to the most common questions.</p>
      </header>

      <div className="resources-faq">
        {FAQ.map((item) => (
          <details key={item.q} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <div className="resources-cta">
        <h2>Didn't find your answer?</h2>
        <p>
          Head over to the community and ask — someone will get back to you.
        </p>
        <Link to="/community?tab=discussions" className="btn btn-primary">
          <i className="fas fa-comments" /> Ask in Community
        </Link>
      </div>
    </div>
  );
}
