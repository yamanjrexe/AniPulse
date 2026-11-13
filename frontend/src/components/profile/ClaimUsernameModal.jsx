import React, { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { profileService } from "../../services/profileService";
import { useToast } from "../../context/ToastContext.jsx";

export default function ClaimUsernameModal({ open, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return showToast(
        "Must be 3-20 lowercase letters, numbers, or underscores.",
        "error",
      );
    }
    setSubmitting(true);
    try {
      await profileService.claimUsername(username);
      showToast("Username claimed successfully!", "success");
      onSuccess(username);
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Claim Your Username">
      <p style={{ marginBottom: 20, color: "var(--text-muted)" }}>
        Choose a unique username for your public profile link
        (ani-pulse.netlify.app/u/username). This cannot be changed later.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-muted)" }}>@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="yourname"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--r-sm)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Claiming..." : "Claim Username"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
