import React from "react";

export default function FriendsList({ friends, onRemove }) {
    return (
        <div className="friends-list-section">
            <h3>
                <i className="fas fa-users" aria-hidden="true" /> Your Friends (
                {friends.length})
            </h3>
            <div className="friends-grid">
                {friends.length === 0 && (
                    <div className="empty-state">
                        No friends yet. Search for users to add!
                    </div>
                )}
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
        </div>
    );
}
