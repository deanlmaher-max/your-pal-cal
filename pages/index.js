import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [tab, setTab] = useState("schedule");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey Dean! 👋 I'm Your Pal Cal — your smart calendar companion! Tell me what to schedule, ask about your day, or tap the mic!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [media, setMedia] = useState([]);
  const [research, setResearch] = useState([]);
  const [people, setPeople] = useState([]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 430, margin: "0 auto", padding: 16, backgroundColor: "#f5f3ef", minHeight: "100vh" }}>
      <h1 style={{ color: "#2563eb", fontSize: 28, marginBottom: 8 }}>📅 Your Pal Cal</h1>
      
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
        {["schedule", "notes", "media", "research", "people"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "#2563eb" : "transparent",
              color: tab === t ? "white" : "#6b7280",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold"
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div>
          <div style={{ height: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: "white" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
                <span style={{ background: m.role === "user" ? "#2563eb" : "#f3f4f6", color: m.role === "user" ? "white" : "black", padding: "8px 14px", borderRadius: 20, display: "inline-block", fontSize: 15, maxWidth: "85%" }}>
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div style={{ color: "#9ca3af" }}>Your Pal Cal is thinking...</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Schedule something or ask..."
              style={{ flex: 1, padding: "12px 16px", borderRadius: 20, border: "1.5px solid #e5e7eb", fontSize: 15 }}
            />
            <button onClick={send} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 20, padding: "12px 20px", fontSize: 15, cursor: "pointer" }}>
              Send
            </button>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
          <textarea placeholder="Add a note..." style={{ width: "100%", height: 200, padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15 }} />
          <button style={{ marginTop: 12, background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>Save Note</button>
          <div style={{ marginTop: 16 }}>
            {notes.map((n, i) => (
              <div key={i} style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                {n}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "media" && (
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
          <button style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", marginBottom: 12 }}>📸 Upload Photo</button>
          <button style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", marginLeft: 8 }}>🎥 Record Video</button>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {media.map((m, i) => (
              <div key={i} style={{ background: "#f3f4f6", height: 120, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                Media {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "research" && (
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
          <input placeholder="Search or research..." style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15, marginBottom: 12 }} />
          <button style={{ background: "#2563eb", color: "white", border: "
