import React from "react";

export default function FriendsList({ friends, onRemove }) {
  return (
    <div className="friends-list-section">
      <h3>
        <i className="fas fa-users" aria-hidden="true" /> Your Friends (
        {friends.length})
      </h3>

      {friends.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            background: "var(--bg-card)",
            border: "1px dashed var(--border-default)",
            borderRadius: "var(--r-md)",
            textAlign: "center",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <i
              className="fas fa-user-friends"
              style={{
                fontSize: "24px",
                color: "var(--brand-yellow)",
                opacity: 0.8,
              }}
            />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              marginBottom: "8px",
              color: "var(--text-primary)",
            }}
          >
            No friends yet
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              maxWidth: "300px",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Search for other anime fans using the search bar above and send them
            a friend request.
          </p>
        </div>
      ) : (
        <div className="friends-grid">
          {friends.map((f) => {
            let displayName = f.name || f.username || "User";
            if (
              !displayName ||
              displayName === "User" ||
              displayName === "Anime Fan"
            ) {
              const m = f.avatar?.match(/name=([^&]+)/);
              if (m) displayName = decodeURIComponent(m[1]);
            }
            const avatarUrl =
              f.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;

            return (
              <div
                key={f.uid}
                className="friend-card"
                onClick={() => window.openUserProfile?.(f.uid)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={avatarUrl}
                  className="friend-avatar"
                  alt={displayName}
                />
                <div className="friend-info">
                  <div className="friend-name">{displayName}</div>
                  <div className="friend-level">
                    {f.title || "Newbie"} • Lv.{f.level || 1}
                  </div>
                </div>
                <button
                  className="remove-friend-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(f.uid);
                  }}
                  aria-label="Remove friend"
                >
                  <i className="fas fa-user-minus" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
