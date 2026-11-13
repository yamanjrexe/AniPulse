import React from "react";
import { Link } from "react-router-dom";

export default function RecentDiscussions({ discussions }) {
  return (
    <div className="profileSection">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h2 className="sectionHeading">Community Posts</h2>
        <Link to="/community?tab=discussions" className="viewAllLink">
          View all
        </Link>
      </div>

      {!discussions || discussions.length === 0 ? (
        <div className="emptyStateCard small">
          <p>No community posts yet.</p>
        </div>
      ) : (
        <div className="discussionList">
          {discussions.map((d) => (
            <Link
              to={`/community?tab=discussions`}
              key={d.id}
              className="discussionItem"
            >
              <div className="discTitle">{d.title}</div>
              <div className="discMeta">
                <i className="fas fa-comment" /> {d.replyCount || 0} replies
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
