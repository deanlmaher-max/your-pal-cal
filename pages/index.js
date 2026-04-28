/**
 * YOUR PAL CAL — pages/index.js
 * Voice-first AI scheduling assistant
 * Stack: Next.js · Google Calendar API · Anthropic Claude API
 *
 * ENV VARS REQUIRED (Vercel):
 *   ANTHROPIC_API_KEY          — Anthropic key (server-side only)
 *   GOOGLE_CLIENT_ID           — OAuth 2.0 client ID
 *   GOOGLE_CLIENT_SECRET       — OAuth 2.0 client secret
 *   GOOGLE_REDIRECT_URI        — e.g. https://yourpalcal.com/api/auth/callback
 *   NEXTAUTH_SECRET            — random secret for session encryption
 *   NEXTAUTH_URL               — canonical URL of the app
 *
 * DEPENDENCIES (add to package.json):
 *   next, react, react-dom
 *   next-auth
 *   @anthropic-ai/sdk
 *   googleapis
 *   date-fns
 */

// ─── pages/index.js ──────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "../styles/Home.module.css";

// ─── helpers ─────────────────────────────────────────────────────────────────

const scrollToBottom = (el) => {
  if (el) el.scrollTop = el.scrollHeight;
};

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

// ─── AttachmentPicker ─────────────────────────────────────────────────────────

function AttachmentPicker({ onAttach }) {
  const fileRef = useRef();
  return (
    <div className={styles.attachPicker}>
      <button
        className={styles.attachBtn}
        title="Attach file"
        onClick={() => fileRef.current.click()}
      >
        📎
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onAttach(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── VoiceButton ──────────────────────────────────────────────────────────────

function VoiceButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return (
    <button
      className={`${styles.voiceBtn} ${listening ? styles.voiceBtnActive : ""}`}
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onTouchStart={startListening}
      onTouchEnd={stopListening}
      disabled={disabled}
      title={listening ? "Listening…" : "Hold to speak"}
    >
      {listening ? "🔴" : "🎙️"}
    </button>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ event }) {
  if (!event) return null;
  return (
    <div className={styles.eventCard}>
      <div className={styles.eventCardTitle}>{event.summary || "Event"}</div>
      {event.start && (
        <div className={styles.eventCardTime}>
          {formatDate(event.start.dateTime || event.start.date)}{" "}
          {event.start.dateTime ? `· ${formatTime(event.start.dateTime)}` : ""}
          {event.end?.dateTime ? ` → ${formatTime(event.end.dateTime)}` : ""}
        </div>
      )}
      {event.location && (
        <div className={styles.eventCardMeta}>📍 {event.location}</div>
      )}
      {event.description && (
        <div className={styles.eventCardDesc}>{event.description}</div>
      )}
      {event.attachments?.length > 0 && (
        <div className={styles.eventCardMeta}>
          📎 {event.attachments.length} attachment(s)
        </div>
      )}
    </div>
  );
}

// ─── Message ──────────────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`${styles.msgRow} ${isUser ? styles.msgUser : styles.msgAssistant}`}>
      {!isUser && <div className={styles.avatar}>🗓</div>}
      <div className={styles.bubble}>
        {msg.content && <p>{msg.content}</p>}
        {msg.event && <EventCard event={msg.event} />}
        {msg.attachment && (
          <div className={styles.attachPreview}>
            {msg.attachment.type?.startsWith("image/") ? (
              <img src={msg.attachment.url} alt={msg.attachment.name} />
            ) : (
              <span>📎 {msg.attachment.name}</span>
            )}
          </div>
        )}
        <span className={styles.ts}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {isUser && <div className={styles.avatarUser}>👤</div>}
    </div>
  );
}

// ─── UpcomingEvents sidebar ───────────────────────────────────────────────────

function UpcomingEvents({ events, onEventClick }) {
  if (!events?.length) return null;
  return (
    <div className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Coming Up</h3>
      {events.map((ev) => (
        <div
          key={ev.id}
          className={styles.sidebarEvent}
          onClick={() => onEventClick(ev)}
        >
          <div className={styles.sidebarEventTitle}>{ev.summary}</div>
          <div className={styles.sidebarEventTime}>
            {ev.start?.dateTime
              ? `${formatDate(ev.start.dateTime)} ${formatTime(ev.start.dateTime)}`
              : formatDate(ev.start?.date)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I'm Your Pal Cal 🗓️  Ask me anything — 'Do I have time Friday at 3?' or 'Book lunch at a nice Italian place tomorrow noon.' I've got you.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch upcoming events on mount / session change
  useEffect(() => {
    if (session) fetchUpcoming();
  }, [session]);

  useEffect(() => {
    scrollToBottom(chatEndRef.current?.parentElement);
  }, [messages]);

  async function fetchUpcoming() {
    try {
      const res = await fetch("/api/calendar/upcoming");
      if (res.ok) {
        const data = await res.json();
        setUpcomingEvents(data.events || []);
      }
    } catch (_) {}
  }

  // ── send message ────────────────────────────────────────────────────────────

  async function sendMessage(text) {
    if (!text.trim() && !pendingAttachment) return;
    setLoading(true);

    const userMsg = {
      role: "user",
      content: text,
      attachment: pendingAttachment
        ? { name: pendingAttachment.name, type: pendingAttachment.type, url: URL.createObjectURL(pendingAttachment) }
        : null,
      ts: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPendingAttachment(null);

    try {
      // Build multipart if attachment present
      let body;
      if (pendingAttachment) {
        const form = new FormData();
        form.append("messages", JSON.stringify(nextMessages.map(apiShape)));
        form.append("attachment", pendingAttachment);
        body = form;
      } else {
        body = JSON.stringify({ messages: nextMessages.map(apiShape) });
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: pendingAttachment ? undefined : { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json();

      const assistantMsg = {
        role: "assistant",
        content: data.reply,
        event: data.event || null,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh sidebar if a calendar action happened
      if (data.calendarAction) fetchUpcoming();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Hmm, something went wrong. Try again?", ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function apiShape(msg) {
    return { role: msg.role, content: msg.content || "" };
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleEventClick(ev) {
    sendMessage(`Tell me about my event: "${ev.summary}" on ${formatDate(ev.start?.dateTime || ev.start?.date)}`);
    setSidebarOpen(false);
  }

  // ── auth gate ────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingDot} />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Head>
          <title>Your Pal Cal</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className={styles.landing}>
          <div className={styles.landingInner}>
            <div className={styles.landingIcon}>🗓️</div>
            <h1 className={styles.landingTitle}>Your Pal Cal</h1>
            <p className={styles.landingSubtitle}>
              Talk to your calendar. Book anything, in seconds.
            </p>
            <ul className={styles.landingFeatures}>
              <li>🎙️ Voice-first scheduling</li>
              <li>🔍 "Do I have time tomorrow at 2?"</li>
              <li>🍽️ Book restaurants & meetings</li>
              <li>📎 Attach notes, photos & voice memos</li>
            </ul>
            <button
              className={styles.signInBtn}
              onClick={() => signIn("google")}
            >
              Continue with Google
            </button>
            <p className={styles.landingDisclaimer}>
              Connects to your Google Calendar. No data stored.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── main UI ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Your Pal Cal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,300;0,600;1,300&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.app}>
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)}>
            <div className={styles.sidebarDrawer} onClick={(e) => e.stopPropagation()}>
              <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>✕</button>
              <UpcomingEvents events={upcomingEvents} onEventClick={handleEventClick} />
            </div>
          </div>
        )}

        {/* Header */}
        <header className={styles.header}>
          <button className={styles.headerCalBtn} onClick={() => setSidebarOpen(true)} title="Upcoming events">
            📅
            {upcomingEvents.length > 0 && (
              <span className={styles.badge}>{upcomingEvents.length}</span>
            )}
          </button>
          <div className={styles.headerLogo}>
            <span className={styles.headerIcon}>🗓️</span>
            <span className={styles.headerName}>Your Pal Cal</span>
          </div>
          <button
            className={styles.headerSignOut}
            onClick={() => signOut()}
            title="Sign out"
          >
            {session.user?.image ? (
              <img src={session.user.image} alt="avatar" className={styles.userAvatar} />
            ) : (
              "👤"
            )}
          </button>
        </header>

        {/* Chat area */}
        <main className={styles.chat}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}
          {loading && (
            <div className={`${styles.msgRow} ${styles.msgAssistant}`}>
              <div className={styles.avatar}>🗓</div>
              <div className={`${styles.bubble} ${styles.typingBubble}`}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        {/* Attachment preview strip */}
        {pendingAttachment && (
          <div className={styles.attachStrip}>
            <span>📎 {pendingAttachment.name}</span>
            <button onClick={() => setPendingAttachment(null)}>✕</button>
          </div>
        )}

        {/* Input bar */}
        <footer className={styles.inputBar}>
          <AttachmentPicker onAttach={setPendingAttachment} />
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your schedule…"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={loading || (!input.trim() && !pendingAttachment)}
            >
              ↑
            </button>
          </form>
          <VoiceButton
            onTranscript={(t) => { setInput(t); sendMessage(t); }}
            disabled={loading}
          />
        </footer>
      </div>
    </>
  );
}
