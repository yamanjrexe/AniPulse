import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../services/api.js";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useLevel } from "../../context/LevelContext.jsx";
import { useSync } from "../../context/SyncContext.jsx";
import { anilistSync } from "../../services/anilistSync.js";
import { animeService } from "../../services/animeService.js";

const STORAGE_KEY = "chatbot:messages:v2";

function formatTimestamp(d) {
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mm} ${ampm}`;
}

function renderText(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function TypingDots() {
  return (
    <span className="typing-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

function ChatCard({ card, onOpenDetail }) {
  return (
    <button
      type="button"
      className="chat-card"
      onClick={() => onOpenDetail(card)}
      title={card.title}
    >
      {card.cover ? (
        <img src={card.cover} alt={card.title} loading="lazy" />
      ) : (
        <div className="chat-card-placeholder">
          <i className="fas fa-image" />
        </div>
      )}
      <div className="chat-card-info">
        <div className="chat-card-title">{card.title}</div>
        <div className="chat-card-meta">
          {card.format && <span>{card.format}</span>}
          {card.episodes && <span>{card.episodes} eps</span>}
          {card.score && <span>{card.score}</span>}
          {card.year && <span>{card.year}</span>}
        </div>
        {card.inList && <div className="chat-card-badge">In list</div>}
      </div>
    </button>
  );
}

function DetailModal({ card, onClose, onAdd, alreadyInList }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.get(`/chat/anime/${card.id}`);
        if (active) setDetail(data);
      } catch {
        if (active) setDetail(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [card.id]);

  return (
    <div className="chat-detail-overlay" onClick={onClose}>
      <div className="chat-detail-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="chat-detail-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="fas fa-times" />
        </button>

        <div className="chat-detail-hero">
          {card.cover && <img src={card.cover} alt={card.title} />}
          <div className="chat-detail-hero-info">
            <h3>{detail?.title || card.title}</h3>
            <div className="chat-detail-badges">
              {detail?.format && <span>{detail.format}</span>}
              {detail?.year && <span>{detail.year}</span>}
              {detail?.score && <span>{detail.score}</span>}
              {detail?.episodes && <span>{detail.episodes} eps</span>}
            </div>
            {detail?.genres?.length > 0 && (
              <div className="chat-detail-genres">
                {detail.genres.slice(0, 5).map((g) => (
                  <span key={g}>{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chat-detail-body">
          {loading && <p className="chat-detail-loading">Loading...</p>}
          {!loading && detail?.description && (
            <p className="chat-detail-desc">{detail.description}</p>
          )}
          {!loading && !detail?.description && (
            <p className="chat-detail-desc">No description available.</p>
          )}
        </div>

        <div className="chat-detail-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAdd(card, detail)}
            disabled={alreadyInList}
          >
            <i className="fas fa-plus" />{" "}
            {alreadyInList ? "Already in list" : "Add to my list"}
          </button>
          {(detail?.siteUrl || card.url) && (
            <a
              className="btn btn-secondary"
              href={detail?.siteUrl || card.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-external-link-alt" /> AniList
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const { animeData, setAnimeData, logActivity } = useAnime();
  const { awardXP, recalc } = useLevel();
  const { syncToCloud } = useSync();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const animeDataRef = useRef(animeData);

  useEffect(() => {
    animeDataRef.current = animeData;
  }, [animeData]);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener("toggleChatBot", toggle);
    return () => window.removeEventListener("toggleChatBot", toggle);
  }, []);

  useEffect(() => {
    if (!open && recognitionRef.current) {
      recognitionRef.current.abort();
      setListening(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;

    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const name = profile.name || profile.username;
    const hasAnime = animeData.length > 0;
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: name
          ? `Hello ${name}! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`
          : `Hello! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`,
        quickReplies: hasAnime
          ? ["Recommend me", "My stats", "What's trending?", "Top 10 anime"]
          : [
              "Recommend me",
              "Top 10 anime",
              "What's trending?",
              "Seasonal anime",
            ],
        ts: Date.now(),
      },
    ]);
  }, [open, messages.length, animeData.length]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (detailCard) setDetailCard(null);
        else if (showClearConfirm) setShowClearConfirm(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailCard, showClearConfirm]);

  const addAnimeToList = useCallback(
    (card, detailData) => {
      const list = animeDataRef.current;
      const titleLower = (card.title || "").toLowerCase();
      const exists = list.some(
        (a) => (a.title || "").toLowerCase() === titleLower,
      );
      if (exists) {
        setMessages((m) => [
          ...m,
          {
            id: Date.now(),
            sender: "bot",
            text: `**${card.title}** is already in your list.`,
            ts: Date.now(),
          },
        ]);
        return;
      }

      const nowTimestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const newId = animeService.getNextAvailableId(list);
      const type =
        detailData?.format === "MOVIE"
          ? "Movie"
          : detailData?.format === "TV_SHORT"
            ? "TV_SHORT"
            : detailData?.format === "OVA"
              ? "OVA"
              : detailData?.format === "ONA"
                ? "ONA"
                : detailData?.format === "SPECIAL"
                  ? "Special"
                  : "TV";

      const newAnime = {
        id: newId,
        title: detailData?.title || card.title,
        type,
        episodes: detailData?.episodes || card.episodes || 1,
        duration: detailData?.duration || 20,
        userStatus: "Plan to Watch",
        progress: 0,
        score: null,
        cover: detailData?.cover || card.cover || "",
        genres: detailData?.genres || card.genres || [],
        finishDate: null,
        actualFinishDate: null,
        anilistId: card.id || null,
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      };

      setAnimeData((prev) => [...prev, newAnime]);
      try {
        awardXP(newAnime, { oldAnime: null });
      } catch (_) {}
      logActivity("added", newAnime.title);

      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          sender: "bot",
          text: `Added **${newAnime.title}** to your list as **Plan to Watch**.`,
          ts: Date.now(),
        },
      ]);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("animeUpdate"));
        syncToCloud?.().catch(() => {});
        anilistSync.syncAnime(newAnime, "upsert").catch(() => {});
      }, 50);

      setTimeout(() => recalc?.(), 100);
    },
    [setAnimeData, logActivity, awardXP, recalc, syncToCloud],
  );

  const removeAnimeFromList = useCallback(
    (animeId) => {
      const target = animeDataRef.current.find((a) => a.id === animeId);
      if (!target) return;
      setAnimeData((prev) => prev.filter((a) => a.id !== animeId));
      logActivity("deleted", target.title);
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          sender: "bot",
          text: `Removed **${target.title}** from your list.`,
          ts: Date.now(),
        },
      ]);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("animeUpdate"));
        syncToCloud?.().catch(() => {});
        anilistSync
          .syncAnime({ id: animeId, title: target.title }, "delete")
          .catch(() => {});
      }, 50);
    },
    [setAnimeData, logActivity, syncToCloud],
  );

  const updateAnime = useCallback(
    (animeId, patch) => {
      const target = animeDataRef.current.find((a) => a.id === animeId);
      if (!target) return;
      const updated = {
        ...target,
        ...patch,
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      };
      setAnimeData((prev) => prev.map((a) => (a.id === animeId ? updated : a)));
      try {
        awardXP(updated, { oldAnime: target });
      } catch (_) {}
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          sender: "bot",
          text: `Updated **${updated.title}** - status: **${updated.userStatus}**.`,
          ts: Date.now(),
        },
      ]);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("animeUpdate"));
        syncToCloud?.().catch(() => {});
        anilistSync.syncAnime(updated, "upsert").catch(() => {});
      }, 50);
      setTimeout(() => recalc?.(), 100);
    },
    [setAnimeData, awardXP, recalc, syncToCloud],
  );

  const executeActions = useCallback(
    (actions) => {
      if (!Array.isArray(actions)) return;
      for (const a of actions) {
        if (!a || !a.type) continue;
        if (a.type === "addAnime" && a.anime) {
          addAnimeToList(a.anime, null);
        } else if (a.type === "removeAnime" && a.animeId != null) {
          removeAnimeFromList(a.animeId);
        } else if (a.type === "updateAnime" && a.animeId != null) {
          updateAnime(a.animeId, a.patch || {});
        }
      }
    },
    [addAnimeToList, removeAnimeFromList, updateAnime],
  );

  const send = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || sending) return;

      setMessages((m) => [
        ...m,
        { id: Date.now(), sender: "user", text, ts: Date.now() },
      ]);
      setInput("");
      setSending(true);

      try {
        const data = await api.post("/chat", { message: text });
        const botMsg = {
          id: Date.now() + Math.random(),
          sender: "bot",
          text: data.text || data.response || "Sorry, I didn't get that.",
          cards: Array.isArray(data.cards) ? data.cards : [],
          quickReplies: Array.isArray(data.quickReplies)
            ? data.quickReplies
            : [],
          ts: Date.now(),
        };
        setMessages((m) => [...m, botMsg]);
        if (Array.isArray(data.actions) && data.actions.length) {
          setTimeout(() => executeActions(data.actions), 200);
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: Date.now(),
            sender: "bot",
            text: "Connection issue. Try again.",
            ts: Date.now(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, executeActions],
  );

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          sender: "bot",
          text: "Voice input isn't supported in this browser.",
          ts: Date.now(),
        },
      ]);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (e) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        const transcript = final || interim;
        if (transcript) {
          setInput(transcript);
        }
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setListening(false);
        if (e.error === "not-allowed") {
          setMessages((m) => [
            ...m,
            {
              id: Date.now(),
              sender: "bot",
              text: "Microphone access was denied. Please allow microphone permissions in your browser settings.",
              ts: Date.now(),
            },
          ]);
        }
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setListening(false);
    }
  }, [listening]);

  const copyMessage = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {}
  }, []);

  const clearChat = useCallback(async () => {
    setMessages([]);
    try {
      await api.delete("/chat/session");
    } catch (_) {}
    setShowClearConfirm(false);
  }, []);

  const isTitleInList = useCallback(
    (title) => {
      const t = (title || "").toLowerCase();
      return animeData.some((a) => (a.title || "").toLowerCase() === t);
    },
    [animeData],
  );

  if (!open) return null;

  return (
    <div id="chat-bot-container" className="open">
      <div id="chat-bot-panel">
        <div id="chat-bot-header">
          <span>
            <img
              src="/icon/icon-72.png"
              alt="AniPulse Bot"
              className="chat-bot-icon"
            />
            AniPulse Bot
          </span>
          <div className="chat-header-actions">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              title="Clear chat"
              aria-label="Clear chat"
            >
              <i className="fas fa-trash-alt" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div id="chat-bot-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-message ${m.sender}`}>
              {m.text && <div className="chat-text">{renderText(m.text)}</div>}
              {m.cards && m.cards.length > 0 && (
                <div className="chat-cards">
                  {m.cards.map((c, j) => (
                    <ChatCard
                      key={`${m.id}-${j}`}
                      card={c}
                      onOpenDetail={setDetailCard}
                    />
                  ))}
                </div>
              )}
              {m.quickReplies && m.quickReplies.length > 0 && (
                <div className="chat-quick-replies">
                  {m.quickReplies.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => send(qr)}
                      disabled={sending}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              <div className="chat-message-footer">
                <span className="chat-time">
                  {formatTimestamp(new Date(m.ts || Date.now()))}
                </span>
                {m.sender === "bot" && m.text && (
                  <button
                    type="button"
                    className="chat-copy"
                    onClick={() => copyMessage(m.text)}
                    title="Copy"
                  >
                    <i className="fas fa-copy" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-message bot typing">
              <TypingDots />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div id="chat-bot-input-area">
          <button
            type="button"
            className={`chat-voice-btn ${listening ? "listening" : ""}`}
            onClick={startVoice}
            title={listening ? "Stop listening" : "Voice input"}
            disabled={sending}
          >
            <i
              className={`fas ${listening ? "fa-stop-circle" : "fa-microphone"}`}
            />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={listening ? "Listening..." : "Ask me anything..."}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={sending || !input.trim()}
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>

        {showClearConfirm && (
          <div
            className="chat-confirm-overlay"
            onClick={() => setShowClearConfirm(false)}
          >
            <div className="chat-confirm" onClick={(e) => e.stopPropagation()}>
              <p>Clear all chat messages?</p>
              <div className="chat-confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={clearChat}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {detailCard && (
        <DetailModal
          card={detailCard}
          onClose={() => setDetailCard(null)}
          onAdd={(c, d) => {
            addAnimeToList(c, d);
            setDetailCard(null);
          }}
          alreadyInList={isTitleInList(detailCard.title)}
        />
      )}
    </div>
  );
}
