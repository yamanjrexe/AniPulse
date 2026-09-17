import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../services/api.js";

export default function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    // ─── Load notifications ─────────────────────────────────
    const load = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        try {
            const [sysRes, reqRes] = await Promise.allSettled([
                api.get("/user/notifications"),
                api.get("/friends/requests"),
            ]);
            const sys =
                sysRes.status === "fulfilled"
                    ? sysRes.value?.notifications || []
                    : [];
            const reqs =
                reqRes.status === "fulfilled" ? reqRes.value || [] : [];
            const reqNotifs = reqs.map((r) => ({
                id: r.id,
                type: "friend_request",
                title: "New Friend Request",
                message: `${r.fromName} sent you a friend request`,
                read: false,
                createdAt: r.createdAt,
                data: {
                    fromUserId: r.from,
                    fromName: r.fromName,
                    requestId: r.id,
                },
            }));
            const all = [...sys, ...reqNotifs].filter(
                (n, i, arr) => arr.findIndex((x) => x.id === n.id) === i,
            );
            setNotifications(all);
        } catch (_) {
            /* silent */
        }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(() => {
            if (!document.hidden) load();
        }, 30000);
        return () => clearInterval(t);
    }, [load]);

    // ─── Outside click / Esc ────────────────────────────────
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e) => {
            if (buttonRef.current?.contains(e.target)) return;
            if (dropdownRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // ─── Handlers ───────────────────────────────────────────
    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((v) => !v);
    };

    const markAllRead = async () => {
        try {
            await api.post("/user/notifications/mark-read", { markAll: true });
        } catch (_) {}
        setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    };

    const accept = async (notif) => {
        try {
            await api.post(`/friends/accept/${notif.data.requestId}`, {});
        } catch (_) {}
        setNotifications((n) =>
            n.map((x) =>
                x.id === notif.id
                    ? {
                          ...x,
                          type: "friend_accepted",
                          title: "Friend Accepted",
                          message: `You are now friends with ${notif.data.fromName}!`,
                          read: true,
                      }
                    : x,
            ),
        );
    };

    const decline = async (notif) => {
        try {
            await api.post(`/friends/decline/${notif.data.requestId}`, {});
        } catch (_) {}
        setNotifications((n) => n.filter((x) => x.id !== notif.id));
    };

    const unread = notifications.filter((n) => !n.read).length;

    return (
        <div className="notification-container">
            <button
                ref={buttonRef}
                type="button"
                className={`notification-bell ${unread > 0 ? "has-notifications" : ""}`}
                aria-label="Notifications"
                aria-expanded={open}
                onClick={toggle}
            >
                <i className="fas fa-bell" aria-hidden="true" />
                {unread > 0 && (
                    <span className="notification-badge">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={dropdownRef}
                    className="notification-dropdown visible"
                    role="dialog"
                    aria-label="Notifications"
                >
                    <div className="notification-header">
                        <h3>
                            <i className="fas fa-bell" aria-hidden="true" />
                            Notifications
                        </h3>
                        <button
                            type="button"
                            className="mark-all-read"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 && (
                            <div className="notification-empty">
                                <i className="fas fa-bell-slash" />
                                <p>No notifications yet</p>
                            </div>
                        )}

                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`notification-item ${n.read ? "" : "unread"} ${
                                    n.type === "friend_accepted"
                                        ? "notification-accepted"
                                        : ""
                                }`}
                            >
                                <div className={`notification-icon ${n.type}`}>
                                    <i
                                        className={`fas ${
                                            n.type === "friend_request"
                                                ? "fa-user-plus"
                                                : "fa-user-check"
                                        }`}
                                    />
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">
                                        {n.title}
                                    </div>
                                    <div className="notification-message">
                                        {n.message}
                                    </div>
                                    {n.type === "friend_request" && (
                                        <div className="notification-actions">
                                            <button
                                                type="button"
                                                className="accept"
                                                onClick={() => accept(n)}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                type="button"
                                                className="decline"
                                                onClick={() => decline(n)}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
