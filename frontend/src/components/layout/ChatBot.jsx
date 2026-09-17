import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api.js";
import { useAnime } from "../../context/AnimeContext.jsx";

export default function ChatBot() {
    const { animeData } = useAnime();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        const toggle = () => setOpen((v) => !v);
        window.addEventListener("toggleChatBot", toggle);
        return () => window.removeEventListener("toggleChatBot", toggle);
    }, []);

    useEffect(() => {
        if (open && messages.length === 0) {
            const profile = JSON.parse(
                localStorage.getItem("userProfile") || "{}",
            );
            const name = profile.name || profile.username;
            setMessages([
                {
                    sender: "bot",
                    text: name
                        ? `Hello ${name}! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`
                        : `Hello! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`,
                },
            ]);
        }
    }, [open, messages.length]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const localAnswer = (msg) => {
        const m = msg.toLowerCase();
        const total = animeData.length;
        const completed = animeData.filter(
            (a) => a.userStatus === "Completed",
        ).length;
        if (m.includes("total anime") || m.includes("how many anime"))
            return `You have ${total} anime total (${completed} completed).`;
        if (m.includes("recommend")) {
            const plan = animeData.filter(
                (a) => a.userStatus === "Plan to Watch",
            );
            if (plan.length)
                return `Try: ${plan
                    .slice(0, 3)
                    .map((a) => a.title)
                    .join(", ")}`;
            return "Add anime to get recommendations!";
        }
        if (m.includes("hello") || m.includes("hi")) return "Hey there!";
        return null;
    };

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setMessages((m) => [...m, { sender: "user", text }]);
        setInput("");
        setSending(true);

        const local = localAnswer(text);
        if (local) {
            setTimeout(() => {
                setMessages((m) => [...m, { sender: "bot", text: local }]);
                setSending(false);
            }, 300);
            return;
        }
        try {
            const data = await api.post("/chat", { message: text });
            setMessages((m) => [
                ...m,
                {
                    sender: "bot",
                    text: data.response || "Sorry, I didn't get that.",
                },
            ]);
        } catch {
            setMessages((m) => [
                ...m,
                { sender: "bot", text: "Connection issue. Try again." },
            ]);
        } finally {
            setSending(false);
        }
    };

    if (!open) return null;

    return (
        <div id="chat-bot-container" className="open">
            <div id="chat-bot-panel">
                <div id="chat-bot-header">
                    <span>
                        <i className="fas fa-robot" /> AniPulse Bot
                    </span>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
                <div id="chat-bot-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-message ${m.sender}`}>
                            {m.text}
                        </div>
                    ))}
                    {sending && (
                        <div className="chat-message bot typing">...</div>
                    )}
                    <div ref={endRef} />
                </div>
                <div id="chat-bot-input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder="Ask me anything..."
                    />
                    <button onClick={send} disabled={sending}>
                        <i className="fas fa-paper-plane" />
                    </button>
                </div>
            </div>
        </div>
    );
}
