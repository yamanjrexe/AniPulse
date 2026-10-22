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

  const [filter, setFilter] = useState(() => {
    return localStorage.getItem("activityFilter") || "all";
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilter(val);
    localStorage.setItem("activityFilter", val);
  };

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
      return true;
    });
  }, [activityLog, filter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSyncing(true);

    const newLog = activityLog.filter((a) => a.id !== deleteTarget);

    setActivityLog(newLog);
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

  const hasNoHistoryAtAll = activityLog.length === 0;
  const hasNoFilteredHistory = filteredLog.length === 0;

  return (
    <section className="dashboard-section">
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>
        <i className="fas fa-history" /> Recent Activity
      </h2>

      <div className="activity-card fade-in">
        <div
          className="activity-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div className="activity-title">Latest Changes</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              className="activity-filter-select"
              value={filter}
              onChange={handleFilterChange}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            {activityLog.length > 0 && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setClearConfirm(true)}
                disabled={syncing}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                {syncing ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  <i className="fas fa-trash-alt" />
                )}{" "}
                Clear
              </button>
            )}
          </div>
        </div>

        <div
          className="activity-list"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {hasNoFilteredHistory ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                textAlign: "center",
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
                  className={`fas ${hasNoHistoryAtAll ? "fa-history" : "fa-search"}`}
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
                {hasNoHistoryAtAll ? "No activity yet" : "No matching activity"}
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
                {hasNoHistoryAtAll
                  ? "Add, edit, or complete an anime to start building your history."
                  : "Try changing your filter to see older activity."}
              </p>
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
                  style={{ position: "relative", paddingRight: "45px" }}
                >
                  <div className={`activity-icon ${info.cls}`}>
                    <i className={`fas fa-${info.icon}`} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-anime">{a.animeTitle}</div>
                    <div className="activity-desc">{text}</div>
                  </div>
                  <div className="activity-time">{timeAgo(a.timestamp)}</div>

                  <button
                    className="activity-delete-btn"
                    onClick={() => setDeleteTarget(a.id)}
                    disabled={syncing}
                    title="Delete entry"
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
                
                .activity-delete-btn {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(231, 76, 60, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: #e74c3c;
                    padding: 6px 8px;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s, background 0.2s;
                }

                .activity-delete-btn:hover {
                    background: rgba(231, 76, 60, 0.25);
                }

                .activity-filter-select {
                    width: auto;
                    padding: 4px 28px 4px 10px;
                    font-size: 0.75rem;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    cursor: pointer;
                    outline: none;
                }

                .activity-filter-select option {
                    background-color: #1a1a1a;
                    color: #ffffff;
                }
            `}</style>
    </section>
  );
}
