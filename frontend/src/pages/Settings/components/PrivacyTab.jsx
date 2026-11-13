import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext.jsx";
import { useSync } from "../../../context/SyncContext.jsx";
import ClaimUsernameModal from "../../../components/profile/ClaimUsernameModal";

export default function PrivacyTab() {
  const { showToast } = useToast();
  const { syncToCloud } = useSync();

  const [claimOpen, setClaimOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
    setProfile(p);
  }, []);

  const updateVisibility = (key, val) => {
    const nextVis = { ...(profile.profileVisibility || {}), [key]: val };
    const nextProfile = { ...profile, profileVisibility: nextVis };
    setProfile(nextProfile);
    localStorage.setItem("userProfile", JSON.stringify(nextProfile));
  };

  const clearAllProfileCache = () => {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("anipulse_profile_cache_")) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await syncToCloud();
      if (ok) {
        clearAllProfileCache();
        showToast("Privacy settings saved to database", "success");
      } else {
        showToast("Failed to save settings. Please try again.", "error");
      }
    } catch (err) {
      showToast("Failed to save settings. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const BLOCKS = [
    { key: "stats", label: "Overall Stats & XP" },
    { key: "top8", label: "Favourites" },
    { key: "currentlyWatching", label: "Currently Watching" },
    { key: "completedList", label: "Recently Completed" },
    { key: "achievements", label: "Achievements" },
    { key: "recentDiscussions", label: "Community Posts" },
    { key: "joinDate", label: "Join Date" },
  ];

  const publicSlug = profile.publicUsername || profile.usernameLower;
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/u/${publicSlug}/profile`;

  return (
    <div className="settings-tab-content active" id="tab-privacy">
      <div className="settings-group">
        <h3>
          <i className="fas fa-link" /> Public Profile Link
        </h3>
        {publicSlug ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="text"
              className="admin-input"
              disabled
              value={publicUrl}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--r-sm)",
                color: "var(--text-primary)",
              }}
            />
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 20px",
              }}
            >
              Open
            </a>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              You haven't claimed a public username yet.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setClaimOpen(true)}
            >
              Claim Username
            </button>
          </div>
        )}
      </div>

      <div className="settings-group">
        <h3>
          <i className="fas fa-eye" /> Profile Visibility
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          Control what people see when they visit your profile.
        </p>

        {BLOCKS.map((b) => (
          <div
            key={b.key}
            className="settings-toggle-row"
            style={{ marginBottom: 16 }}
          >
            <div>
              <strong
                style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}
              >
                {b.label}
              </strong>
            </div>
            <select
              className="admin-input"
              style={{
                width: 150,
                padding: "10px 14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--r-sm)",
                color: "var(--text-primary)",
              }}
              value={(profile.profileVisibility || {})[b.key] || "public"}
              onChange={(e) => updateVisibility(b.key, e.target.value)}
            >
              <option value="public">Everyone</option>
              <option value="followers">Followers Only</option>
              <option value="private">Only Me</option>
            </select>
          </div>
        ))}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}
        >
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save" /> Save Privacy Settings
              </>
            )}
          </button>
        </div>
      </div>

      <ClaimUsernameModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onSuccess={async (uname) => {
          const nextProfile = {
            ...profile,
            publicUsername: uname,
            usernameLower: uname,
          };
          setProfile(nextProfile);
          localStorage.setItem("userProfile", JSON.stringify(nextProfile));

          await syncToCloud();
          showToast("Username claimed and synced to all devices!", "success");
        }}
      />
    </div>
  );
}
