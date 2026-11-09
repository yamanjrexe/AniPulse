import React, { useState } from "react";
import { adminService } from "../../../services/adminService.js";
import { useToast } from "../../../context/ToastContext.jsx";

export default function AdminAnnouncements() {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (
      !window.confirm(
        "Send this announcement to all users? They will receive a notification.",
      )
    )
      return;

    setSending(true);
    try {
      const res = await adminService.sendAnnouncement(title, message);
      showToast(`Announcement sent to ${res.count} users!`, "success");
      setTitle("");
      setMessage("");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-announcements" style={{ maxWidth: "600px" }}>
      <form onSubmit={handleSend}>
        <div className="admin-form-group">
          <label>Announcement Title</label>
          <input
            className="admin-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Update Released!"
            required
          />
        </div>
        <div className="admin-form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="admin-btn-primary"
          style={{ width: "100%", padding: "14px" }}
          disabled={sending}
        >
          {sending ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Sending...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane" /> Send Announcement
            </>
          )}
        </button>
      </form>
    </div>
  );
}
