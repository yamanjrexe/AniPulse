import React, { useState, useEffect, useMemo } from "react";
import { adminService } from "../../../services/adminService.js";
import { useToast } from "../../../context/ToastContext.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import PosterImage from "../../../components/ui/PosterImage.jsx";
import { LEVELS, getLevelFromXP } from "../../../services/levelSystem.js";

const ITEMS_PER_PAGE = 10;

const ROLE_BADGES = {
  admin: {
    label: "ADMIN",
    color: "var(--brand-yellow)",
    bg: "rgba(252, 231, 6, 0.15)",
    border: "rgba(252, 231, 6, 0.3)",
  },
  moderator: {
    label: "MOD",
    color: "#60A5FA",
    bg: "rgba(96, 165, 250, 0.15)",
    border: "rgba(96, 165, 250, 0.3)",
  },
  member: {
    label: "MEMBER",
    color: "var(--text-muted)",
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
  },
};

function AdminUserDetail({ user, onClose, onRefresh, onUpdateLocal }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editStats, setEditStats] = useState({
    totalXP: user.totalXP || 0,
    level: user.level || 1,
    title: user.title || "Newbie",
    role: user.role || "member",
  });
  const [savingStats, setSavingStats] = useState(false);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  useEffect(() => {
    adminService
      .getUserAnime(user.uid)
      .then((res) => setAnimeList(res.animeList || []))
      .catch(() => showToast("Failed to load anime", "error"))
      .finally(() => setLoading(false));
  }, [user.uid, showToast]);

  const handleLevelChange = (e) => {
    const newLevel = parseInt(e.target.value, 10);
    const levelData = LEVELS.find((l) => l.level === newLevel);
    if (levelData) {
      setEditStats((prev) => ({
        ...prev,
        level: levelData.level,
        totalXP: levelData.xpRequired,
        title: levelData.title,
      }));
    }
  };

  const handleXPChange = (val) => {
    const xp = val === "" ? 0 : parseInt(val, 10);
    const levelData = getLevelFromXP(xp);
    setEditStats((prev) => ({
      ...prev,
      totalXP: xp,
      level: levelData.level,
      title: levelData.title,
    }));
  };

  const addXP = (amount) => {
    handleXPChange(editStats.totalXP + amount);
  };

  const handleSaveStats = async () => {
    if (
      editStats.totalXP === user.totalXP &&
      editStats.level === user.level &&
      editStats.title === user.title &&
      editStats.role === user.role
    ) {
      showToast("No changes to save.", "info");
      onClose();
      return;
    }

    setSavingStats(true);
    try {
      const updatedData = {
        totalXP: parseInt(editStats.totalXP, 10),
        level: parseInt(editStats.level, 10),
        title: editStats.title,
        role: editStats.role,
      };

      await adminService.updateUser(user.uid, {
        ...updatedData,
        adminOverrides: {
          totalXP: updatedData.totalXP,
          level: updatedData.level,
          title: updatedData.title,
        },
      });

      onUpdateLocal({ ...user, ...updatedData });

      showToast("User data updated successfully", "success");
      onClose();
      onRefresh();
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.message || "Failed to update user", "error");
    } finally {
      setSavingStats(false);
    }
  };

  return (
    <div className="admin-drawer-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="admin-drawer-header">
          <div className="admin-drawer-user">
            <img src={user.avatar} alt="" className="admin-drawer-avatar" />
            <div>
              <h2>{user.name}</h2>
              <p>
                {user.email} · Level {user.level}
              </p>
            </div>
          </div>
          <button className="admin-drawer-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Manage User
          </button>
          <button
            className={`admin-tab ${activeTab === "anime" ? "active" : ""}`}
            onClick={() => setActiveTab("anime")}
          >
            View Anime List ({animeList.length})
          </button>
        </div>

        <div className="admin-drawer-body">
          {activeTab === "overview" && (
            <div className="admin-profile-edit">
              <div className="admin-info-box">
                <span>Account Details</span>
                <div className="admin-info-grid">
                  <div className="admin-info-item">
                    <span>Anime Watched</span>
                    <strong>{user.totalAnime || 0}</strong>
                  </div>
                  <div className="admin-info-item">
                    <span>Hours Watched</span>
                    <strong>{user.totalHours || 0}</strong>
                  </div>
                  <div className="admin-info-item">
                    <span>Joined Date</span>
                    <strong>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </strong>
                  </div>
                  <div className="admin-info-item">
                    <span>Last Login</span>
                    <strong>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-form-box">
                <h4>Permissions & Progression</h4>

                <div className="admin-form-group">
                  <label>Account Role</label>
                  <select
                    className="admin-input"
                    value={editStats.role}
                    onChange={(e) =>
                      setEditStats({ ...editStats, role: e.target.value })
                    }
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Level (1-50)</label>
                  <select
                    className="admin-input"
                    value={editStats.level}
                    onChange={handleLevelChange}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.level} value={l.level}>
                        Level {l.level} - {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Total XP</label>
                  <div className="admin-xp-group">
                    <input
                      className="admin-input"
                      type="number"
                      value={editStats.totalXP}
                      onChange={(e) => handleXPChange(e.target.value)}
                    />
                    <button
                      className="admin-btn-secondary"
                      type="button"
                      onClick={() => addXP(1000)}
                    >
                      +1K
                    </button>
                    <button
                      className="admin-btn-secondary"
                      type="button"
                      onClick={() => addXP(-1000)}
                    >
                      -1K
                    </button>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Title</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={editStats.title}
                    onChange={(e) =>
                      setEditStats({ ...editStats, title: e.target.value })
                    }
                  />
                </div>

                <button
                  className="admin-btn-primary"
                  onClick={handleSaveStats}
                  disabled={savingStats}
                >
                  {savingStats ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "anime" && (
            <div className="admin-anime-section">
              {loading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin" /> Loading anime...
                </div>
              ) : animeList.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fas fa-folder-open" />
                  <h3>No Anime Found</h3>
                  <p>This user has not added any anime to their list yet.</p>
                </div>
              ) : (
                <div className="admin-anime-grid">
                  {animeList.map((anime) => (
                    <div key={anime.id} className="admin-anime-card">
                      <PosterImage anime={anime} alt={anime.title} />
                      <div className="admin-anime-info">
                        <div className="admin-anime-title" title={anime.title}>
                          {anime.title}
                        </div>
                        <div
                          className="admin-anime-meta"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{anime.userStatus}</span>
                          <span>
                            {anime.score ? `${anime.score}/10` : "Unrated"}
                          </span>
                        </div>
                        <div
                          className="admin-anime-meta"
                          style={{ color: "var(--brand-yellow)" }}
                        >
                          Progress: {anime.progress || 0} /{" "}
                          {anime.episodes || "?"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [banTarget, setBanTarget] = useState(null);

  const load = async (searchQuery = search) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(searchQuery);
      setUsers(res.users || []);
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line
  }, [search]);

  const processedUsers = useMemo(() => {
    let result = [...users];
    if (filter === "admins") result = result.filter((u) => u.role === "admin");
    if (filter === "moderators")
      result = result.filter((u) => u.role === "moderator");
    if (filter === "banned") result = result.filter((u) => u.banned);

    result.sort((a, b) => {
      if (sortBy === "xp") return b.totalXP - a.totalXP;
      if (sortBy === "level") return b.level - a.level;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [users, filter, sortBy]);

  const totalPages = Math.ceil(processedUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = processedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleUpdateLocal = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === updatedUser.uid ? { ...u, ...updatedUser } : u,
      ),
    );
  };

  const handleBanConfirm = async () => {
    if (!banTarget) return;
    try {
      await adminService.banUser(banTarget);

      // ⚡ INSTANT UI
      setUsers((prev) =>
        prev.map((u) => (u.uid === banTarget ? { ...u, banned: true } : u)),
      );

      showToast("User banned", "success");
      setBanTarget(null);
      // load(); // Optional background refresh
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUnban = async (uid) => {
    try {
      await adminService.unbanUser(uid);

      // ⚡ INSTANT UI
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, banned: false } : u)),
      );

      showToast("User unbanned", "success");
      // load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteUser(deleteTarget);

      // ⚡ INSTANT UI
      setUsers((prev) => prev.filter((u) => u.uid !== deleteTarget));

      showToast("User deleted", "success");
      setDeleteTarget(null);
      // load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Users</option>
          <option value="admins">Admins</option>
          <option value="moderators">Moderators</option>
          <option value="banned">Banned</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="xp">Sort: Highest XP</option>
          <option value="level">Sort: Highest Level</option>
        </select>
      </div>

      {loading && users.length === 0 ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin" /> Loading users...
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="admin-empty-state">
          <i className="fas fa-users-slash" />
          <h3>No Users Found</h3>
          <p>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div
          className="admin-user-list"
          style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}
        >
          {paginatedUsers.map((u) => {
            const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.member;
            return (
              <div key={u.uid} className="admin-user-row">
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="admin-user-avatar"
                  onClick={() => setSelectedUser(u)}
                  style={{ cursor: "pointer" }}
                />
                <div
                  className="admin-user-info"
                  onClick={() => setSelectedUser(u)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="admin-user-name">
                    {u.name}
                    <span
                      style={{
                        fontSize: "0.55rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 800,
                        color: roleBadge.color,
                        background: roleBadge.bg,
                        border: `1px solid ${roleBadge.border}`,
                      }}
                    >
                      {roleBadge.label}
                    </span>
                    {u.banned && (
                      <span className="admin-badge-banned">BANNED</span>
                    )}
                  </div>
                  <div className="admin-user-email">{u.email}</div>
                  <div className="admin-user-stats">
                    Lv.{u.level} · {u.totalXP?.toLocaleString()} XP ·{" "}
                    {u.totalAnime} anime
                  </div>
                </div>
                <div className="admin-user-actions">
                  <button
                    className="admin-btn-secondary"
                    onClick={() => setSelectedUser(u)}
                  >
                    <i className="fas fa-cog" /> Manage
                  </button>
                  {u.banned ? (
                    <button
                      className="admin-btn-success"
                      onClick={() => handleUnban(u.uid)}
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      className="admin-btn-warning"
                      onClick={() => setBanTarget(u.uid)}
                    >
                      Ban
                    </button>
                  )}
                  <button
                    className="admin-btn-danger"
                    onClick={() => setDeleteTarget(u.uid)}
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="admin-btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selectedUser && (
        <AdminUserDetail
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={load}
          onUpdateLocal={handleUpdateLocal}
        />
      )}

      <ConfirmDialog
        open={!!banTarget}
        message="Are you sure you want to ban this user? They will immediately lose access to the app."
        confirmLabel="Ban User"
        onConfirm={handleBanConfirm}
        onCancel={() => setBanTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message="Permanently delete this user and all their data? This cannot be undone."
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
