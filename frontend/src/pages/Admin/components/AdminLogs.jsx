import React, { useState, useEffect, useMemo } from "react";
import { adminService } from "../../../services/adminService.js";
import { useToast } from "../../../context/ToastContext.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

const LOG_ACTIONS = [
  { value: "all", label: "All Actions" },
  { value: "UPDATE_USER", label: "Updated User Data" },
  { value: "UPDATE_USER_STATS", label: "Updated User Data (Legacy)" },
  { value: "BAN_USER", label: "Banned Users" },
  { value: "UNBAN_USER", label: "Unbanned Users" },
  { value: "DELETE_USER", label: "Deleted Users" },
  { value: "DELETE_DISCUSSION", label: "Deleted Discussions" },
  { value: "SEND_ANNOUNCEMENT", label: "Announcements" },
  { value: "NOTIFY_USER", label: "Direct Notifications" },
];

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

export default function AdminLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminService.getLogs(), adminService.getUsers()])
      .then(([logsRes, usersRes]) => {
        setLogs(logsRes.logs || []);
        setUsers(usersRes.users || []);
      })
      .catch((err) => console.error("Failed to load logs", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.uid] = u;
    });
    return map;
  }, [users]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filter !== "all") {
      result = result.filter((l) => l.action === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const targetName = userMap[l.targetId]?.name?.toLowerCase() || "";
        const adminName = userMap[l.adminId]?.name?.toLowerCase() || "";
        return (
          l.targetId?.toLowerCase().includes(q) ||
          l.adminId?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          targetName.includes(q) ||
          adminName.includes(q)
        );
      });
    }

    return result;
  }, [logs, filter, search, userMap]);

  const handleDeleteLog = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteLog(deleteTarget);

      // ⚡ INSTANT UI UPDATE: Remove the deleted log from state immediately
      setLogs((prev) => prev.filter((l) => l.id !== deleteTarget));

      showToast("Log deleted successfully", "success");
      setDeleteTarget(null);

      // Optional: reload in background to ensure sync
      // load();
    } catch (err) {
      showToast(err.message || "Failed to delete log", "error");
    }
  };

  const renderDetails = (log) => {
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

  if (loading)
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin" /> Loading logs...
      </div>
    );

  return (
    <div className="admin-logs">
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by user, admin, or action..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {LOG_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <div
          className="admin-empty-state"
          style={{
            background: "var(--bg-card)",
            borderRadius: 16,
            border: "1px solid var(--border-default)",
            padding: "60px 20px",
          }}
        >
          <i className="fas fa-clipboard-list" />
          <h3>No Logs Found</h3>
          <p>No admin actions match your current filter or search.</p>
        </div>
      ) : (
        <div className="admin-user-list">
          {filteredLogs.map((log) => {
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
              <div key={log.id} className="admin-log-card">
                <div
                  className="log-icon"
                  style={{ color: iconColor, background: iconBg }}
                >
                  <i className={`fas ${icon}`} />
                </div>

                <div className="log-content">
                  <div className="log-header">
                    <span className="log-action">{displayAction}</span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="log-time">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        className="admin-btn-danger"
                        style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                        onClick={() => setDeleteTarget(log.id)}
                        title="Delete this log"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>

                  {renderDetails(log)}

                  <div className="log-footer">
                    <div className="log-user-info">
                      <span className="log-label">Target:</span>
                      {targetUser ? (
                        <span className="log-user-badge">
                          <img src={targetUser.avatar} alt="" />
                          {targetUser.name}
                        </span>
                      ) : (
                        <span className="log-id">{log.targetId}</span>
                      )}
                    </div>

                    <div className="log-user-info">
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

      <ConfirmDialog
        open={!!deleteTarget}
        message="Are you sure you want to permanently delete this audit log? This cannot be undone."
        confirmLabel="Delete Log"
        onConfirm={handleDeleteLog}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
