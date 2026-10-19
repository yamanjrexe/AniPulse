import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { uploadAvatar, uploadCover } from "../../../services/avatarService.js";
import ProfilePreviewBanner from "./ProfilePreviewBanner.jsx";
import FavoriteAnimeTagInput from "./FavoriteAnimeTagInput.jsx";
import AvatarCropperModal from "../../../components/profile/AvatarCropperModal.jsx"; 

// Helper to convert base64 to File for the upload service
function base64ToFile(base64, filename) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function ProfileTab() {
  const { updateDisplayName } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (!existing.memberSince) {
        existing.memberSince = new Date().toISOString();
        localStorage.setItem("userProfile", JSON.stringify(existing));
      }
      return existing;
    } catch {
      return {};
    }
  });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Cropper State
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropType, setCropType] = useState("avatar");

  // ─── Persist + notify ─────────────────────────────────
  const persist = (next) => {
    localStorage.setItem("userProfile", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("syncSchedule"));
  };

  const update = (patch) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    persist(next);
  };

  // ─── Name ─────────────────────────────────────────────
  const handleName = async (newName) => {
    const clean = (newName || "").trim();
    if (!clean) return;
    update({ name: clean, username: clean });
    try {
      await updateDisplayName(clean);
      showToast(`Name updated to ${clean}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update name", "error");
    }
  };

  // ─── Handle File Select (Opens Cropper) ───────────────
  const handleAvatarSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return showToast("Image too large (max 5MB)", "error");

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropType("avatar");
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return showToast("Image too large (max 5MB)", "error");

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropType("banner");
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // ─── Handle Cropped Image (Uploads to Backend) ────────
  const handleCropConfirm = async (base64Image) => {
    setCropOpen(false);
    const file = base64ToFile(
      base64Image,
      cropType === "avatar" ? "avatar.jpg" : "cover.jpg",
    );

    if (cropType === "avatar") {
      setUploadingAvatar(true);
      showToast("Compressing and uploading avatar...", "info", 2000);
      try {
        const res = await uploadAvatar(file);
        update({ avatar: res.avatarUrl });
        showToast("Avatar updated!", "success");
        if (typeof window.updateSidebarUserInfo === "function")
          window.updateSidebarUserInfo();
        window.dispatchEvent(new CustomEvent("syncSchedule"));
      } catch (err) {
        showToast(err.message || "Avatar upload failed", "error");
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      setUploadingCover(true);
      showToast("Compressing cover...", "info", 1500);
      try {
        const dataUrl = await uploadCover(file);
        update({ cover: dataUrl });
        showToast("Cover updated!", "success");
        window.dispatchEvent(new CustomEvent("syncSchedule"));
      } catch (err) {
        showToast(err.message || "Cover upload failed", "error");
      } finally {
        setUploadingCover(false);
      }
    }
  };

  // ─── Reset avatar ─────────────────────────────────────
  const resetAvatar = () => {
    const name = profile.name || profile.username || "User";
    const def = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6a5acd&color=fff&bold=true&size=200`;
    update({ avatar: def });
    showToast("Avatar reset", "info");
    if (typeof window.updateSidebarUserInfo === "function")
      window.updateSidebarUserInfo();
  };

  const save = async () => {
    setSaving(true);
    try {
      persist(profile);
      showToast("Profile saved!", "success");
    } finally {
      setSaving(false);
    }
  };

  const resetProfile = () => {
    if (!window.confirm("Reset profile details to defaults?")) return;
    const { memberSince } = profile;
    const clean = { memberSince };
    setProfile(clean);
    persist(clean);
    showToast("Reset to defaults", "info");
  };

  return (
    <div className="settings-tab-content active" id="tab-profile">
      <ProfilePreviewBanner profile={profile} />

      {/* ═══════════════════════════════════════════════
                BASIC INFO
            ═══════════════════════════════════════════════ */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-user" aria-hidden="true" /> Basic Info
        </h3>

        <div className="settings-item">
          <label htmlFor="usernameInput">Display Name</label>
          <input
            id="usernameInput"
            type="text"
            value={profile.name || ""}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={(e) => handleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            placeholder="Enter your display name"
            autoComplete="off"
            maxLength={40}
          />
        </div>

        <div className="settings-item">
          <label htmlFor="avatarInput">Profile Photo</label>
          <div className="file-input-wrapper">
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={(e) => {
                handleAvatarSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              className="file-input-btn"
              style={{ opacity: uploadingAvatar ? 0.6 : 1 }}
            >
              <i
                className={`fas ${uploadingAvatar ? "fa-spinner fa-spin" : "fa-upload"}`}
              />{" "}
              {uploadingAvatar ? "Uploading..." : "Choose Image"}
            </div>
          </div>
        </div>

        <div className="settings-item">
          <button className="btn btn-secondary" onClick={resetAvatar}>
            <i className="fas fa-undo" /> Reset to Default Avatar
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
                PROFILE DETAILS
            ═══════════════════════════════════════════════ */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-id-card" aria-hidden="true" /> Profile Details
        </h3>

        <div className="settings-item">
          <label htmlFor="coverInput">Cover Image</label>
          <div className="file-input-wrapper">
            <input
              id="coverInput"
              type="file"
              accept="image/*"
              disabled={uploadingCover}
              onChange={(e) => {
                handleCoverSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              className="file-input-btn"
              style={{ opacity: uploadingCover ? 0.6 : 1 }}
            >
              <i
                className={`fas ${uploadingCover ? "fa-spinner fa-spin" : "fa-upload"}`}
              />{" "}
              {uploadingCover ? "Uploading..." : "Choose Cover"}
            </div>
          </div>
          {profile.cover && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => update({ cover: null })}
            >
              <i className="fas fa-times" /> Remove Cover
            </button>
          )}
        </div>

        <div className="settings-item">
          <label htmlFor="profileBio">Bio</label>
          <textarea
            id="profileBio"
            rows={3}
            maxLength={200}
            value={profile.bio || ""}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
          <small>{profile.bio?.length || 0} / 200</small>
        </div>

        <div className="settings-item">
          <label htmlFor="profileStatus">Custom Status</label>
          <input
            id="profileStatus"
            type="text"
            maxLength={60}
            value={profile.status || ""}
            onChange={(e) => update({ status: e.target.value })}
            placeholder="e.g., Currently watching Frieren"
          />
        </div>

        <div className="settings-item">
          <label>Favorite Anime</label>
          <FavoriteAnimeTagInput
            value={profile.favoriteAnime || []}
            onChange={(ids) => update({ favoriteAnime: ids })}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
                SOCIAL LINKS
            ═══════════════════════════════════════════════ */}
      <div className="settings-group">
        <h3>
          <i className="fas fa-share-alt" aria-hidden="true" /> Social Links
        </h3>

        {[
          { k: "anilist", l: "AniList", p: "Your AniList username" },
          {
            k: "myanimelist",
            l: "MyAnimeList",
            p: "Your MyAnimeList username",
          },
          { k: "twitter", l: "Twitter", p: "@username" },
          { k: "instagram", l: "Instagram", p: "@username" },
        ].map((s) => (
          <div key={s.k} className="settings-item">
            <label htmlFor={`social-${s.k}`}>{s.l}</label>
            <input
              id={`social-${s.k}`}
              type="text"
              value={profile.social?.[s.k] || ""}
              onChange={(e) =>
                update({
                  social: { ...(profile.social || {}), [s.k]: e.target.value },
                })
              }
              placeholder={s.p}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <i className="fas fa-save" /> {saving ? "Saving..." : "Save Profile"}
        </button>
        <button className="btn btn-secondary" onClick={resetProfile}>
          <i className="fas fa-undo" /> Reset to Defaults
        </button>
      </div>

      {/* --- CROPPER MODAL --- */}
      <AvatarCropperModal
        open={cropOpen}
        imageUrl={cropImage}
        aspectRatio={cropType === "avatar" ? 1 : 3}
        outputWidth={cropType === "avatar" ? 250 : 1200}
        outputHeight={cropType === "avatar" ? 250 : 400}
        isCircular={cropType === "avatar"}
        title={
          cropType === "avatar" ? "Update Profile Picture" : "Update Banner"
        }
        onCancel={() => setCropOpen(false)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
