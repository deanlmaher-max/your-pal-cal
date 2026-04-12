import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey Dean! 👋 I'm Your Pal Cal — your smart calendar companion! Tell me what to schedule, ask about your day, or tap the mic!" }
  ]);
  const [loading, setLoading] = useState(false);

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
    <div style={{ fontFamily: "sans-serif", maxWidth: 430, margin: "0 auto", padding: 20 }}>
      <h1 style={{ color: "#2563eb" }}>📅 Your Pal Cal</h1>
      <div style={{ height: 400, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ background: m.role === "user" ? "#2563eb" : "#f3f4f6", color: m.role === "user" ? "white" : "black", padding: "8px 14px", borderRadius: 20, display: "inline-block", fontSize: 15 }}>
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
  );
}
