import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/adminService.js";
import { useToast } from "../../../context/ToastContext.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

export default function AdminDiscussions() {
  const { showToast } = useToast();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDiscussions();
      setDiscussions(res.discussions || []);
    } catch {
      showToast("Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteDiscussion(deleteTarget);

      // ⚡ INSTANT UI
      setDiscussions((prev) => prev.filter((d) => d.id !== deleteTarget));

      showToast("Discussion deleted", "success");
      setDeleteTarget(null);
      // load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin" /> Loading...
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div
        className="admin-empty-state"
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border-default)",
          padding: "60px 20px",
        }}
      >
        <i className="fas fa-comments" />
        <h3>No Discussions Yet</h3>
        <p>
          When users start posting discussions, they will appear here for
          moderation.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-discussions">
      {discussions.map((d) => (
        <div key={d.id} className="admin-discussion-row">
          <img src={d.authorAvatar} alt="" className="admin-user-avatar" />
          <div className="admin-user-info">
            <div className="admin-user-name">{d.title}</div>
            <div className="admin-user-stats">
              by {d.authorName} · {d.replyCount || 0} replies ·{" "}
              {new Date(d.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button
            className="admin-btn-danger"
            onClick={() => setDeleteTarget(d.id)}
          >
            <i className="fas fa-trash" /> Delete
          </button>
        </div>
      ))}

      <ConfirmDialog
        open={!!deleteTarget}
        message="Delete this discussion and all its replies?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
