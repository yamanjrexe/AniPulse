import React, { useState, useEffect } from "react";
import { firebase } from "../../../firebaseClient.js";
import { api } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { useLevel } from "../../../context/LevelContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { compressImage } from "../../../services/avatarService.js";
import DiscussionThread from "./DiscussionThread.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

export default function DiscussionsTab() {
  const { user } = useAuth();
  const { animeData } = useAnime();
  const { level } = useLevel();
  const { showToast } = useToast();

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [attachStats, setAttachStats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeThread) return;

    const unsubscribe = firebase
      .firestore()
      .collection("discussions")
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
          setThreads(data);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          showToast("Failed to load discussions", "error");
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [activeThread, showToast]);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (image) {
        const res = await api.post("/upload/discussion-image", { image });
        imageUrl = res.url;
      }

      // Calculate stats for the ENTIRE anime library
      const totalAnime = animeData.length;
      const totalEpisodes = animeData.reduce((acc, a) => {
        const eps =
          a.userStatus === "Completed" ? a.episodes || 0 : a.progress || 0;
        return acc + eps;
      }, 0);
      const totalMinutes = animeData.reduce((acc, a) => {
        const eps =
          a.userStatus === "Completed" ? a.episodes || 0 : a.progress || 0;
        return acc + eps * (a.duration || 20);
      }, 0);
      const totalHours = Math.round(totalMinutes / 60);

      const stats = attachStats
        ? {
            level,
            totalAnime,
            totalEpisodes,
            totalHours,
          }
        : null;

      await api.post("/discussions", { title, content, imageUrl, stats });

      setTitle("");
      setContent("");
      setImage(null);
      setAttachStats(false);
      setShowCreate(false);
      showToast("Discussion posted!", "success");
    } catch (err) {
      showToast(err.message || "Failed to post", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/discussions/${deleteTarget}`);
      showToast("Discussion deleted", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (activeThread) {
    return (
      <DiscussionThread
        thread={activeThread}
        onBack={() => setActiveThread(null)}
        onThreadDeleted={() => setActiveThread(null)}
      />
    );
  }

  return (
    <div className="discussions-tab">
      <div className="discussions-header">
        <h3>
          <i className="fas fa-comments" /> Anime Discussions
        </h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          <i className="fas fa-plus" /> New Post
        </button>
      </div>

      {showCreate && (
        <div className="create-post-card">
          <input
            type="text"
            placeholder="Discussion Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
          />
          <textarea
            placeholder="What do you want to discuss? Ask for help, share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          {image && (
            <div className="preview-attachment">
              <img src={image} alt="preview" />
              <button onClick={() => setImage(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
          )}

          <div className="post-actions">
            <div className="post-actions-left">
              <label className="btn btn-secondary add-img-btn">
                <i className="fas fa-image" /> Add Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      setImage(await compressImage(file, 1000, 1200, 1200));
                  }}
                />
              </label>

              <label className="stats-toggle-pill">
                <input
                  type="checkbox"
                  checked={attachStats}
                  onChange={(e) => setAttachStats(e.target.checked)}
                />
                <i className="fas fa-chart-bar"></i>
                <span>Attach Stats</span>
              </label>
            </div>

            <button
              className="btn btn-primary"
              onClick={handlePost}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "Posting..." : "Post Discussion"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin" /> Loading discussions...
        </div>
      ) : threads.length === 0 ? (
        <div className="coming-soon-card">
          <i className="fas fa-comments" />
          <h3>No discussions yet</h3>
          <p>Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="thread-list">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="thread-card"
              onClick={() => setActiveThread(thread)}
            >
              <div className="thread-card-header">
                <img src={thread.authorAvatar} alt="avatar" />
                <span>{thread.authorName}</span>
                <span className="thread-time">
                  {new Date(thread.createdAt).toLocaleDateString()}
                </span>
                {user?.uid === thread.authorId && (
                  <button
                    className="delete-action-btn feed-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(thread.id);
                    }}
                    title="Delete"
                  >
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
              <h4>{thread.title}</h4>
              <p>{thread.content.substring(0, 150)}...</p>
              <div className="thread-card-footer">
                <span>
                  <i className="fas fa-comment" /> {thread.replyCount} Replies
                </span>
                {thread.imageUrl && (
                  <span>
                    <i className="fas fa-image" /> Image
                  </span>
                )}
                {thread.stats && (
                  <span>
                    <i className="fas fa-chart-bar" /> Stats Attached
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message="Are you sure you want to permanently delete this entire discussion and all its replies?"
        confirmLabel="Delete Discussion"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
