import React, { useState } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import { profileService } from "../../../services/profileService";
import { useToast } from "../../../context/ToastContext.jsx";

export default function ReportProfileModal({ uid, onClose }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await profileService.reportProfile(uid, reason, details);
      showToast("Report submitted. Our team will review it.", "success");
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Report Profile">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Reason for reporting</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="inappropriate">Inappropriate Content</option>
            <option value="impersonation">Impersonation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Additional Details (Optional)</label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={submitting}
          >
            Submit Report
          </button>
        </div>
      </form>
    </Modal>
  );
}
