import React, { useState, useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useSync } from "../../../context/SyncContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

function timeAgo(ts) {
  if (!ts) return "Just now";
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return d.toLocaleDateString();
}

const ICONS = {
  added: { cls: "added", icon: "plus" },
  completed: { cls: "completed", icon: "check" },
  watching: { cls: "watching", icon: "play" },
  edited: { cls: "edited", icon: "edit" },
  deleted: { cls: "deleted", icon: "trash" },
};

export default function RecentActivity() {
  const { activityLog, setActivityLog } = useAnime();
  const { syncToCloud } = useSync();
  const { showToast } = useToast();

  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const filteredLog = useMemo(() => {
    const now = new Date();
    return activityLog.filter((a) => {
      if (!a.timestamp) return true;
      const d = new Date(a.timestamp);

      if (filter === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (filter === "7days") {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (filter === "this_month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (filter === "last_month") {
        let lm = now.getMonth() - 1;
        let ly = now.getFullYear();
        if (lm < 0) {
          lm = 11;
          ly--;
        }
        return d.getMonth() === lm && d.getFullYear() === ly;
      }
      return true; // 'all'
    });
  }, [activityLog, filter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSyncing(true);

    const newLog = activityLog.filter((a) => a.id !== deleteTarget);

    // 1. Update React State
    setActivityLog(newLog);
    // 2. Force LocalStorage update immediately so syncToCloud picks it up
    localStorage.setItem("activityLog", JSON.stringify(newLog));

    setDeleteTarget(null);

    try {
      if (syncToCloud) await syncToCloud();
      showToast("Activity deleted and synced", "success");
    } catch (err) {
      console.error(err);
      showToast("Deleted locally, but cloud sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = async () => {
    setSyncing(true);
    setClearConfirm(false);

    setActivityLog([]);
    localStorage.setItem("activityLog", JSON.stringify([]));

    try {
      if (syncToCloud) await syncToCloud();
      showToast("All history cleared and synced", "success");
    } catch (err) {
      console.error(err);
      showToast("Cleared locally, but cloud sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="dashboard-section">
      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "1rem",
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          <i className="fas fa-history" /> Recent Activity
        </h2>

        {/* Filter Dropdown */}
        <select
          className="form-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "auto",
            padding: "6px 30px 6px 12px",
            fontSize: "0.85rem",
            borderRadius: "8px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
        </select>
      </div>

      <div className="activity-card fade-in">
        <div className="activity-header">
          <div className="activity-title">Latest Changes</div>
          {activityLog.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setClearConfirm(true)}
              disabled={syncing}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
            >
              {syncing ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <i className="fas fa-trash-alt" />
              )}{" "}
              Clear All
            </button>
          )}
        </div>

        <div
          className="activity-list"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {filteredLog.length === 0 ? (
            <div
              className="no-activity"
              style={{ padding: "2rem", textAlign: "center", opacity: 0.6 }}
            >
              No activity found for this period.
            </div>
          ) : (
            filteredLog.map((a) => {
              const info = ICONS[a.action] || ICONS.edited;
              const text =
                a.action === "added"
                  ? `Added ${a.animeTitle} to your list`
                  : a.action === "completed"
                    ? `Completed ${a.animeTitle}`
                    : a.action === "watching"
                      ? `Started watching ${a.animeTitle}`
                      : a.action === "deleted"
                        ? `Removed ${a.animeTitle}`
                        : `Updated ${a.animeTitle}`;

              return (
                <div
                  key={a.id}
                  className="activity-item"
                  style={{ position: "relative", paddingRight: "40px" }}
                >
                  <div className={`activity-icon ${info.cls}`}>
                    <i className={`fas fa-${info.icon}`} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-anime">{a.animeTitle}</div>
                    <div className="activity-desc">{text}</div>
                  </div>
                  <div className="activity-time">{timeAgo(a.timestamp)}</div>

                  {/* Hover Delete Button */}
                  <button
                    className="activity-delete-btn"
                    onClick={() => setDeleteTarget(a.id)}
                    disabled={syncing}
                    title="Delete entry"
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(231, 76, 60, 0.1)",
                      border: "none",
                      borderRadius: "6px",
                      color: "#e74c3c",
                      padding: "6px 8px",
                      cursor: "pointer",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(231, 76, 60, 0.25)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(231, 76, 60, 0.1)")
                    }
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        message="Are you sure you want to permanently delete this activity? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={clearConfirm}
        message="Are you sure you want to permanently delete ALL history? This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={handleClearAll}
        onCancel={() => setClearConfirm(false)}
      />

      <style>{`
                .activity-item:hover .activity-delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
    </section>
  );
}
