import React, { useState, useEffect } from "react";
import { adminService } from "../../../services/adminService";
import { useToast } from "../../../context/ToastContext.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

export default function AdminReports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    adminService
      .getReports()
      .then((res) => setReports(res.reports || []))
      .catch(() => showToast("Failed to load reports", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDismiss = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.dismissReport(deleteTarget);
      showToast("Report dismissed", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading)
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin" /> Loading reports...
      </div>
    );

  return (
    <div className="admin-reports">
      {reports.length === 0 ? (
        <div
          className="admin-empty-state"
          style={{
            background: "var(--bg-card)",
            borderRadius: 16,
            border: "1px solid var(--border-default)",
            padding: "60px 20px",
          }}
        >
          <i className="fas fa-flag" />
          <h3>No Active Reports</h3>
          <p>The community is peaceful right now.</p>
        </div>
      ) : (
        <div className="admin-user-list">
          {reports.map((report) => (
            <div
              key={report.id}
              className="admin-user-row"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--brand-red)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="fas fa-flag" />
                  </div>
                  <div>
                    <div
                      className="admin-user-name"
                      style={{ fontSize: "1rem" }}
                    >
                      Reported by {report.reporterName}
                    </div>
                    <div className="admin-user-stats">
                      Target:{" "}
                      <span
                        style={{
                          color: "var(--brand-yellow)",
                          fontWeight: 600,
                        }}
                      >
                        {report.targetName}
                      </span>{" "}
                      (@{report.targetUsername})
                    </div>
                  </div>
                </div>
                <button
                  className="admin-btn-danger"
                  onClick={() => setDeleteTarget(report.id)}
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                >
                  <i className="fas fa-check" /> Dismiss
                </button>
              </div>

              <div
                style={{
                  width: "100%",
                  background: "var(--bg-surface)",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--brand-red)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Reason: {report.reason}
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}
                >
                  {report.details || "No additional details provided."}
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  width: "100%",
                  textAlign: "right",
                }}
              >
                {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message="Are you sure you want to dismiss this report?"
        confirmLabel="Dismiss"
        onConfirm={handleDismiss}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
