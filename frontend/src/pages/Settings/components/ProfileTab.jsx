import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { uploadAvatar, uploadCover } from "../../../services/avatarService.js";
import ProfilePreviewBanner from "./ProfilePreviewBanner.jsx";
import FavoriteAnimeTagInput from "./FavoriteAnimeTagInput.jsx";

export default function ProfileTab() {
    const { updateDisplayName } = useAuth();
    const { showToast } = useToast();

    const [profile, setProfile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("userProfile") || "{}");
        } catch {
            return {};
        }
    });

    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

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

    // ─── Avatar upload (compressed automatically) ─────────
    const handleAvatar = async (file) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image too large (max 5MB)", "error");
            return;
        }

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp",
        ];
        if (!allowed.includes(file.type)) {
            showToast("Please select an image (JPEG, PNG, GIF, WebP)", "error");
            return;
        }

        setUploadingAvatar(true);
        showToast("Compressing and uploading...", "info", 2000);

        try {
            // avatarService.uploadAvatar() compresses to ≤200KB, then POSTs
            const res = await uploadAvatar(file);
            console.log("✅ Avatar uploaded:", res);

            update({ avatar: res.avatarUrl });
            showToast("Avatar updated!", "success");

            // Refresh sidebar avatar instantly
            if (typeof window.updateSidebarUserInfo === "function") {
                window.updateSidebarUserInfo();
            }
            window.dispatchEvent(new CustomEvent("syncSchedule"));
        } catch (err) {
            console.error("❌ Avatar upload failed:", err);
            showToast(err.message || "Avatar upload failed", "error");
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ─── Cover upload (compressed automatically) ──────────
    const handleCover = async (file) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image too large (max 5MB)", "error");
            return;
        }

        setUploadingCover(true);
        showToast("Compressing cover...", "info", 1500);

        try {
            // uploadCover() compresses to ≤500KB, returns data URL
            const dataUrl = await uploadCover(file);
            update({ cover: dataUrl });
            showToast("Cover updated!", "success");
            window.dispatchEvent(new CustomEvent("syncSchedule"));
        } catch (err) {
            console.error("❌ Cover upload failed:", err);
            showToast(err.message || "Cover upload failed", "error");
        } finally {
            setUploadingCover(false);
        }
    };

    // ─── Reset avatar ─────────────────────────────────────
    const resetAvatar = () => {
        const name = profile.name || profile.username || "User";
        const def = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name,
        )}&background=6a5acd&color=fff&bold=true&size=200`;
        update({ avatar: def });
        showToast("Avatar reset", "info");
        if (typeof window.updateSidebarUserInfo === "function") {
            window.updateSidebarUserInfo();
        }
    };

    // ─── Save ─────────────────────────────────────────────
    const save = async () => {
        setSaving(true);
        try {
            persist(profile);
            showToast("Profile saved!", "success");
        } finally {
            setSaving(false);
        }
    };

    // ─── Reset all profile fields ─────────────────────────
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
                                const f = e.target.files?.[0];
                                if (f) handleAvatar(f);
                                e.target.value = "";
                            }}
                        />
                        <div
                            className="file-input-btn"
                            style={{ opacity: uploadingAvatar ? 0.6 : 1 }}
                        >
                            <i
                                className={`fas ${
                                    uploadingAvatar
                                        ? "fa-spinner fa-spin"
                                        : "fa-upload"
                                }`}
                            />{" "}
                            {uploadingAvatar ? "Uploading..." : "Choose Image"}
                        </div>
                    </div>
                    <small
                        style={{
                            display: "block",
                            marginTop: 6,
                            color: "rgba(248,250,252,0.4)",
                            fontSize: "0.75rem",
                        }}
                    >
                        Automatically compressed to fit 200KB
                    </small>
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
                    <i className="fas fa-id-card" aria-hidden="true" /> Profile
                    Details
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
                                const f = e.target.files?.[0];
                                if (f) handleCover(f);
                                e.target.value = "";
                            }}
                        />
                        <div
                            className="file-input-btn"
                            style={{ opacity: uploadingCover ? 0.6 : 1 }}
                        >
                            <i
                                className={`fas ${
                                    uploadingCover
                                        ? "fa-spinner fa-spin"
                                        : "fa-upload"
                                }`}
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
                    <i className="fas fa-share-alt" aria-hidden="true" /> Social
                    Links
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
                                    social: {
                                        ...(profile.social || {}),
                                        [s.k]: e.target.value,
                                    },
                                })
                            }
                            placeholder={s.p}
                        />
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════
          SAVE / RESET
         ═══════════════════════════════════════════════ */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                    className="btn btn-primary"
                    onClick={save}
                    disabled={saving}
                >
                    <i className="fas fa-save" />{" "}
                    {saving ? "Saving..." : "Save Profile"}
                </button>
                <button className="btn btn-secondary" onClick={resetProfile}>
                    <i className="fas fa-undo" /> Reset to Defaults
                </button>
            </div>
        </div>
    );
}
