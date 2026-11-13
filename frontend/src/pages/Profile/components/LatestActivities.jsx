import React from "react";

function timeAgo(dateString) {
  if (!dateString) return "Just now";

  let date;
  if (typeof dateString === "string") {
    const formattedString =
      dateString.includes(" ") && !dateString.includes("T")
        ? dateString.replace(" ", "T")
        : dateString;
    date = new Date(formattedString);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}

export default function LatestActivities({ activities, name }) {
  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Latest Activities</h2>
      <div className="activityCardWrapper">
        {!activities || activities.length === 0 ? (
          <div className="emptyStateCard small">
            <p>No recent activities.</p>
          </div>
        ) : (
          <div className="activityList">
            {activities.map((act, i) => (
              <div key={i} className="activityItem">
                <div className="activityIcon">
                  <i className="fas fa-check" />
                </div>
                <div className="activityContent">
                  <div className="activityText">
                    <strong>{name}</strong> completed{" "}
                    <span className="highlight">{act.title}</span>
                  </div>
                </div>
                <div className="activityMeta">
                  <div className="activityTime">
                    {timeAgo(act.completedAt || act.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
