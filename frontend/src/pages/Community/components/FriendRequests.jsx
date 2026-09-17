import React from "react";

export default function FriendRequests({ requests, onAccept, onDecline }) {
    if (!requests.length) return null;

    return (
        <div className="friend-requests-section">
            <h3>
                <i className="fas fa-user-plus" aria-hidden="true" /> Friend
                Requests
            </h3>
            <div className="friend-requests-list">
                {requests.map((r) => (
                    <div key={r.id} className="friend-request-item">
                        <div className="friend-request-info">
                            <img
                                src={
                                    r.fromAvatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(r.fromName)}&background=6366F1&color=fff`
                                }
                                alt={r.fromName}
                                className="friend-request-avatar"
                            />
                            <div>
                                <div className="friend-request-name">
                                    {r.fromName}
                                </div>
                                <div className="friend-request-level">
                                    Lv.{r.fromLevel || 1}
                                </div>
                            </div>
                        </div>
                        <div className="friend-request-actions">
                            <button
                                className="btn-accept"
                                onClick={() => onAccept(r.id)}
                            >
                                <i className="fas fa-check" /> Accept
                            </button>
                            <button
                                className="btn-decline"
                                onClick={() => onDecline(r.id)}
                            >
                                <i className="fas fa-times" /> Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
