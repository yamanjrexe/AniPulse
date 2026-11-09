import React, { useState, useEffect, useMemo } from "react";
import { adminService } from "../../../services/adminService.js";

const ACTION_LABELS = {
  UPDATE_USER: "Updated User Data",
  UPDATE_USER_STATS: "Updated User Stats",
  CHANGE_ROLE: "Changed User Role",
  BAN_USER: "Banned User",
  UNBAN_USER: "Unbanned User",
  DELETE_USER: "Deleted User",
  DELETE_DISCUSSION: "Deleted Discussion",
  SEND_ANNOUNCEMENT: "Sent Announcement",
  NOTIFY_USER: "Sent Notification",
};

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getUsers(),
      adminService.getLogs(),
      adminService.getDiscussions(),
    ])
      .then(([statsData, usersData, logsData, discData]) => {
        setStats(statsData);
        setUsers(usersData.users || []);
        setRecentLogs((logsData.logs || []).slice(0, 3)); // Only show last 3
        setDiscussions((discData.discussions || []).slice(0, 4));
      })
      .catch((err) => {
        console.error("Failed to load dashboard data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.uid] = u;
    });
    return map;
  }, [users]);

  const renderLogDetails = (log) => {
    if (!log.details) return null;
    const d = log.details;
    const changes = [];

    if (log.action === "UPDATE_USER" || log.action === "UPDATE_USER_STATS") {
      if (d.totalXP !== undefined)
        changes.push(`XP: ${d.totalXP.toLocaleString()}`);
      if (d.level !== undefined) changes.push(`Lv: ${d.level}`);
      if (d.title) changes.push(`Title: ${d.title}`);
      if (d.role) changes.push(`Role: ${d.role.toUpperCase()}`);

      if (changes.length === 0) return null;

      return (
        <div className="log-details-grid">
          {changes.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      );
    }

    if (log.action === "CHANGE_ROLE") {
      return (
        <div className="log-details-text">
          Changed role to <strong>{d.newRole?.toUpperCase()}</strong>
        </div>
      );
    }
    if (log.action === "SEND_ANNOUNCEMENT") {
      return (
        <div className="log-details-text">
          Announcement: <strong>"{d.title}"</strong>
        </div>
      );
    }
    if (log.action === "NOTIFY_USER") {
      return (
        <div className="log-details-text">
          Notification: <strong>"{d.title}"</strong>
        </div>
      );
    }
    if (log.action === "DELETE_DISCUSSION") {
      return (
        <div className="log-details-text">
          Deleted Discussion ID: <strong>{log.targetId}</strong>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: 400 }}>
        <i className="fas fa-spinner fa-spin" /> Loading dashboard...
      </div>
    );
  }

  const roleCounts = users.reduce(
    (acc, u) => {
      const role = u.role || "member";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    },
    { member: 0, moderator: 0, admin: 0 },
  );

  const totalRoleUsers = users.length || 1;
  const topUsers = [...users].sort((a, b) => b.totalXP - a.totalXP).slice(0, 4);
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <i className="fas fa-users" />
          <div>
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-tv" style={{ color: "var(--brand-yellow)" }} />
          <div>
            <div className="admin-stat-value">
              {stats.totalAnime?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Anime Tracked</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-clock" style={{ color: "var(--success)" }} />
          <div>
            <div className="admin-stat-value">
              {stats.totalHours?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Hours Watched</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-comments" style={{ color: "#60A5FA" }} />
          <div>
            <div className="admin-stat-value">{stats.totalDiscussions}</div>
            <div className="admin-stat-label">Discussions</div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-col">
          <div className="admin-panel">
            <h3 className="admin-panel-title">
              <i className="fas fa-crown" style={{ color: "#FFD700" }} /> Top
              Users by XP
            </h3>
            {topUsers.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fas fa-users-slash" />
                <p>Top users will appear once the community grows.</p>
              </div>
            ) : (
              <div className="recent-users-list">
                {topUsers.map((u, i) => (
                  <div key={u.uid} className="recent-user-row">
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background:
                          i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32",
                        color: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <img
                      src={u.avatar}
                      alt=""
                      className="admin-user-avatar"
                      style={{ width: 36, height: 36 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="admin-user-name"
                        style={{
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}
                      </div>
                      <div
                        className="admin-user-email"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {u.totalXP?.toLocaleString()} XP
                      </div>
                    </div>
                    <span
                      className="badge badge-warning"
                      style={{ fontSize: "0.65rem" }}
                    >
                      Lv. {u.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-panel">
            <h3 className="admin-panel-title">
              <i className="fas fa-users-cog" /> Role Distribution
            </h3>
            {users.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fas fa-chart-pie" />
                <p>Cannot calculate role distribution without users.</p>
              </div>
            ) : (
              <div className="role-distribution">
                <div className="role-bar-group">
                  <div className="role-label">
                    <span>
                      <i
                        className="fas fa-shield-halved"
                        style={{ color: "var(--brand-yellow)" }}
                      />{" "}
                      Admins
                    </span>
                    <span>{roleCounts.admin}</span>
                  </div>
                  <div className="role-track">
                    <div
                      className="role-fill admin"
                      style={{
                        width: `${(roleCounts.admin / totalRoleUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="role-bar-group">
                  <div className="role-label">
                    <span>
                      <i
                        className="fas fa-user-tie"
                        style={{ color: "#60A5FA" }}
                      />{" "}
                      Moderators
                    </span>
                    <span>{roleCounts.moderator}</span>
                  </div>
                  <div className="role-track">
                    <div
                      className="role-fill mod"
                      style={{
                        width: `${(roleCounts.moderator / totalRoleUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="role-bar-group">
                  <div className="role-label">
                    <span>
                      <i
                        className="fas fa-user"
                        style={{ color: "var(--text-secondary)" }}
                      />{" "}
                      Members
                    </span>
                    <span>{roleCounts.member}</span>
                  </div>
                  <div className="role-track">
                    <div
                      className="role-fill member"
                      style={{
                        width: `${(roleCounts.member / totalRoleUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                className="admin-panel-title"
                style={{ margin: 0, border: 0, padding: 0 }}
              >
                <i className="fas fa-history" /> Recent Actions
              </h3>
              <button
                className="admin-btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={() => onNavigate("logs")}
              >
                View Logs
              </button>
            </div>
            {recentLogs.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fas fa-clipboard-list" />
                <p>Admin actions will be logged here for auditing.</p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {recentLogs.map((log) => {
                  let icon = "fa-edit";
                  let iconColor = "var(--text-muted)";
                  let iconBg = "var(--bg-surface)";

                  if (log.action.includes("DELETE")) {
                    icon = "fa-trash";
                    iconColor = "var(--brand-red)";
                    iconBg = "rgba(249, 4, 21, 0.1)";
                  } else if (log.action.includes("BAN")) {
                    icon = "fa-ban";
                    iconColor = "var(--brand-red)";
                    iconBg = "rgba(249, 4, 21, 0.1)";
                  } else if (log.action.includes("UNBAN")) {
                    icon = "fa-check";
                    iconColor = "var(--success)";
                    iconBg = "rgba(34, 197, 94, 0.1)";
                  } else if (log.action.includes("ROLE") || log.details?.role) {
                    icon = "fa-user-tag";
                    iconColor = "#60A5FA";
                    iconBg = "rgba(96, 165, 250, 0.1)";
                  } else if (log.action.includes("ANNOUNCEMENT")) {
                    icon = "fa-bullhorn";
                    iconColor = "var(--brand-yellow)";
                    iconBg = "rgba(252, 231, 6, 0.1)";
                  }

                  const targetUser = userMap[log.targetId];
                  const adminUser = userMap[log.adminId];
                  const displayAction =
                    ACTION_LABELS[log.action] || log.action.replace(/_/g, " ");

                  return (
                    <div
                      key={log.id}
                      className="admin-log-card"
                      style={{ padding: "12px 16px" }}
                    >
                      <div
                        className="log-icon"
                        style={{
                          color: iconColor,
                          background: iconBg,
                          width: 32,
                          height: 32,
                          fontSize: 13,
                        }}
                      >
                        <i className={`fas ${icon}`} />
                      </div>

                      <div className="log-content">
                        <div className="log-header" style={{ marginBottom: 4 }}>
                          <span
                            className="log-action"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {displayAction}
                          </span>
                          <span
                            className="log-time"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {renderLogDetails(log)}

                        <div
                          className="log-footer"
                          style={{ paddingTop: 8, marginTop: 4, gap: 12 }}
                        >
                          <div
                            className="log-user-info"
                            style={{ fontSize: "0.7rem" }}
                          >
                            <span className="log-label">Target:</span>
                            {targetUser ? (
                              <span className="log-user-badge">
                                <img src={targetUser.avatar} alt="" />
                                {targetUser.name}
                              </span>
                            ) : (
                              <span className="log-id">
                                {log.targetId.substring(0, 8)}...
                              </span>
                            )}
                          </div>

                          <div
                            className="log-user-info"
                            style={{ fontSize: "0.7rem" }}
                          >
                            <span className="log-label">Admin:</span>
                            {adminUser ? (
                              <span className="log-user-badge">
                                <img src={adminUser.avatar} alt="" />
                                {adminUser.name}
                              </span>
                            ) : (
                              <span className="log-id">
                                {log.adminId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="admin-col">
          <div className="admin-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                className="admin-panel-title"
                style={{ margin: 0, border: 0, padding: 0 }}
              >
                <i className="fas fa-user-plus" /> Recent Signups
              </h3>
              <button
                className="admin-btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={() => onNavigate("users")}
              >
                View All
              </button>
            </div>
            {recentUsers.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fas fa-user-clock" />
                <p>Recent registrations will appear here.</p>
              </div>
            ) : (
              <div className="recent-users-list">
                {recentUsers.map((u) => (
                  <div key={u.uid} className="recent-user-row">
                    <img
                      src={u.avatar}
                      alt=""
                      className="admin-user-avatar"
                      style={{ width: 36, height: 36 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="admin-user-name"
                        style={{
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}
                      </div>
                      <div
                        className="admin-user-email"
                        style={{
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                className="admin-panel-title"
                style={{ margin: 0, border: 0, padding: 0 }}
              >
                <i className="fas fa-comments" /> Recent Discussions
              </h3>
              <button
                className="admin-btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={() => onNavigate("discussions")}
              >
                Moderate
              </button>
            </div>
            {discussions.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fas fa-comment-slash" />
                <p>The community hasn't started any discussions yet.</p>
              </div>
            ) : (
              <div className="recent-users-list">
                {discussions.map((d) => (
                  <div key={d.id} className="recent-user-row">
                    <img
                      src={d.authorAvatar}
                      alt=""
                      className="admin-user-avatar"
                      style={{ width: 36, height: 36 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="admin-user-name"
                        style={{
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {d.title}
                      </div>
                      <div
                        className="admin-user-email"
                        style={{ fontSize: "0.75rem" }}
                      >
                        by {d.authorName}
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        fontSize: "0.65rem",
                        background: "var(--bg-surface)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {d.replyCount || 0} replies
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-panel">
            <h3 className="admin-panel-title">
              <i className="fas fa-bolt" /> Quick Actions
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                className="admin-btn-secondary"
                style={{ justifyContent: "flex-start", padding: "14px" }}
                onClick={() => onNavigate("announce")}
              >
                <i
                  className="fas fa-bullhorn"
                  style={{
                    color: "var(--brand-yellow)",
                    width: 24,
                    fontSize: 16,
                  }}
                />
                <span style={{ fontSize: "0.9rem" }}>
                  Send Global Announcement
                </span>
              </button>
              <button
                className="admin-btn-secondary"
                style={{ justifyContent: "flex-start", padding: "14px" }}
                onClick={() => onNavigate("users")}
              >
                <i
                  className="fas fa-users-cog"
                  style={{ color: "var(--success)", width: 24, fontSize: 16 }}
                />
                <span style={{ fontSize: "0.9rem" }}>Manage Users & Roles</span>
              </button>
              <button
                className="admin-btn-secondary"
                style={{ justifyContent: "flex-start", padding: "14px" }}
                onClick={() => onNavigate("discussions")}
              >
                <i
                  className="fas fa-comments"
                  style={{ color: "#60A5FA", width: 24, fontSize: 16 }}
                />
                <span style={{ fontSize: "0.9rem" }}>Moderate Community</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
