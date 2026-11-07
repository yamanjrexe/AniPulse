import React, { useState, useEffect, useRef } from "react";
import { firebase } from "../../../firebaseClient.js";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { compressImage } from "../../../services/avatarService.js";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

export default function DiscussionThread({ thread, onBack, onThreadDeleted }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);

  const [deleteThreadConfirm, setDeleteThreadConfirm] = useState(false);
  const [deleteReplyTarget, setDeleteReplyTarget] = useState(null);

  const endRef = useRef(null);

  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection("discussions")
      .doc(thread.id)
      .collection("replies")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        const msgs = [];
        snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
        setReplies(msgs);
        setTimeout(
          () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      });
    return () => unsubscribe();
  }, [thread.id]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1000, 1200, 1200);
      setImage(compressed);
    } catch (err) {
      showToast("Image compression failed", "error");
    }
  };

  const submitReply = async () => {
    if (!content.trim() && !image) return;
    setSending(true);
    try {
      let imageUrl = null;
      if (image) {
        const res = await api.post("/upload/discussion-image", { image });
        imageUrl = res.url;
      }
      await api.post(`/discussions/${thread.id}/reply`, { content, imageUrl });
      setContent("");
      setImage(null);
    } catch (err) {
      showToast(err.message || "Failed to post reply", "error");
    } finally {
      setSending(false);
    }
  };

  const executeDeleteThread = async () => {
    setDeleteThreadConfirm(false);
    try {
      await api.del(`/discussions/${thread.id}`);
      showToast("Discussion deleted", "success");
      onThreadDeleted();
    } catch (err) {
      showToast(err.message || "Failed to delete discussion", "error");
    }
  };

  const executeDeleteReply = async () => {
    if (!deleteReplyTarget) return;
    try {
      await api.del(`/discussions/${thread.id}/replies/${deleteReplyTarget}`);
      showToast("Reply deleted", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete reply", "error");
    } finally {
      setDeleteReplyTarget(null);
    }
  };

  return (
    <div className="discussion-thread">
      <button
        className="btn btn-secondary"
        onClick={onBack}
        style={{ marginBottom: 16 }}
      >
        <i className="fas fa-arrow-left" /> Back to Discussions
      </button>

      <div className="thread-original-post">
        <div className="thread-header">
          <img src={thread.authorAvatar} alt="avatar" />
          <div>
            <strong>{thread.authorName}</strong>
            <span className="thread-time">
              {new Date(thread.createdAt).toLocaleString()}
            </span>
          </div>
          {user?.uid === thread.authorId && (
            <button
              className="delete-action-btn"
              onClick={() => setDeleteThreadConfirm(true)}
              title="Delete Post"
            >
              <i className="fas fa-trash" />
            </button>
          )}
        </div>
        <h2>{thread.title}</h2>
        <p className="thread-content">{thread.content}</p>
        {thread.imageUrl && (
          <img src={thread.imageUrl} alt="attachment" className="thread-img" />
        )}

        {/* NEW STATS CARD DISPLAY */}
        {thread.stats && (
          <div className="thread-stats-card">
            <div className="stat-box">
              <span className="stat-label">Level</span>
              <span className="stat-value">{thread.stats.level}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Anime</span>
              <span className="stat-value">{thread.stats.totalAnime}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Episodes</span>
              <span className="stat-value">{thread.stats.totalEpisodes}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hours</span>
              <span className="stat-value">{thread.stats.totalHours}</span>
            </div>
          </div>
        )}
      </div>

      <div className="thread-replies">
        {replies.map((reply) => (
          <div key={reply.id} className="reply-item">
            <img
              src={reply.authorAvatar}
              alt="avatar"
              className="reply-avatar"
            />
            <div className="reply-body">
              <div className="reply-header">
                <strong>{reply.authorName}</strong>
                <div className="reply-meta">
                  <span>
                    {new Date(reply.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {(user?.uid === reply.authorId ||
                    user?.uid === thread.authorId) && (
                    <button
                      className="delete-action-btn"
                      onClick={() => setDeleteReplyTarget(reply.id)}
                      title="Delete Reply"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  )}
                </div>
              </div>
              <p>{reply.content}</p>
              {reply.imageUrl && (
                <img
                  src={reply.imageUrl}
                  alt="attachment"
                  className="reply-img"
                />
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="thread-input-area">
        {image && (
          <div className="preview-attachment">
            <img src={image} alt="preview" />
            <button onClick={() => setImage(null)}>
              <i className="fas fa-times" />
            </button>
          </div>
        )}
        <div className="input-row">
          <label className="attach-btn">
            <i className="fas fa-image" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Reply to this discussion..."
            onKeyDown={(e) => e.key === "Enter" && submitReply()}
          />
          <button
            className="btn btn-primary"
            onClick={submitReply}
            disabled={sending || (!content.trim() && !image)}
          >
            {sending ? <i className="fas fa-spinner fa-spin" /> : "Send"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteThreadConfirm}
        message="Are you sure you want to permanently delete this entire discussion and all its replies?"
        confirmLabel="Delete Discussion"
        onConfirm={executeDeleteThread}
        onCancel={() => setDeleteThreadConfirm(false)}
      />

      <ConfirmDialog
        open={!!deleteReplyTarget}
        message="Are you sure you want to delete this reply?"
        confirmLabel="Delete Reply"
        onConfirm={executeDeleteReply}
        onCancel={() => setDeleteReplyTarget(null)}
      />
    </div>
  );
}
