import React, { useState, useEffect, useRef } from "react";

// ── Inline markdown helpers ────────────────────────────────────────────────
function inlineFormat(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(<code key={parts.length} style={inlineCodeStyle}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={parts.length}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
      i++;
      elements.push(
        <pre key={elements.length} style={codeBlockStyle}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith("### ")) { elements.push(<h4 key={elements.length} style={{ margin: "0.75rem 0 0.25rem", fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{inlineFormat(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith("## ")) { elements.push(<h3 key={elements.length} style={{ margin: "0.75rem 0 0.25rem", fontSize: "0.9375rem", fontWeight: 600, color: "#1f2937" }}>{inlineFormat(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith("# ")) { elements.push(<h2 key={elements.length} style={{ margin: "0.75rem 0 0.25rem", fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>{inlineFormat(line.slice(2))}</h2>); i++; continue; }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(<ol key={elements.length} style={listStyle}>{items.map((item, idx) => <li key={idx} style={listItemStyle}>{inlineFormat(item)}</li>)}</ol>);
      continue;
    }
    if (/^[\-\*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(<ul key={elements.length} style={listStyle}>{items.map((item, idx) => <li key={idx} style={listItemStyle}>{inlineFormat(item)}</li>)}</ul>);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    elements.push(<p key={elements.length} style={{ margin: "0.25rem 0", fontSize: "0.8125rem", lineHeight: 1.65, color: "#374151" }}>{inlineFormat(line)}</p>);
    i++;
  }
  return elements;
}

// ── Constants ──────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

const SUGGESTIONS = [
  "What are the main entry points of this application?",
  "Which files have the highest technical debt or complexity?",
  "Are there any modularity or coupling issues?",
  "Summarize the dependency structure of this codebase.",
  "What does the architecture look like?",
  "Which modules are most critical to the system?"
];

// ── Component ──────────────────────────────────────────────────────────────
export default function RepositoryChat({ projectMetadata, stats, metrics, graph, messages: messagesProp, onMessagesChange }) {
  const messages = messagesProp || [];
  function setMessages(updater) {
    const next = typeof updater === 'function' ? updater(messages) : updater;
    if (onMessagesChange) onMessagesChange(next);
  }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => setAiConfigured(d.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", parts: [{ text: text.trim() }] };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          projectMetadata,
          stats,
          metrics,
          graph
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const modelMsg = { role: "model", parts: [{ text: data.reply }] };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      const errorMsg = { role: "model", parts: [{ text: `⚠️ Error: ${err.message}` }] };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleClear() {
    if (onMessagesChange) onMessagesChange([]);
    setInput("");
  }

  // ── AI not configured ──────────────────────────────────────────────────
  if (aiConfigured === false) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>Codebase Q&A</h3>
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "1rem 1.25rem", marginTop: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>
            Add your API key to <code style={{ backgroundColor: "#fef3c7", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>backend/.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#37352F" }}>Codebase Q&A</h3>
          <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>Ask questions about the repository structure, dependencies, and architecture.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} style={clearBtnStyle}>
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

        {/* Empty state with suggestions */}
        {isEmpty && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#37352F", margin: "0 0 0.25rem" }}>Ask anything about this codebase</p>
              <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: 0 }}>Try one of the suggestions below, or type your own question.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: "600px" }}>
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s)}
                  style={suggestionChipStyle}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f3f4f6"; e.currentTarget.style.borderColor = "#9ca3af"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "0.75rem" }}>
            <div style={msg.role === "user" ? userBubbleStyle : modelBubbleStyle}>
              {msg.role === "user"
                ? <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.6 }}>{msg.parts[0].text}</p>
                : <div>{renderMarkdown(msg.parts[0].text)}</div>
              }
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ ...modelBubbleStyle, display: "flex", alignItems: "center", gap: "0.5rem", color: "#9ca3af" }}>
              <TypingDots />
              <span style={{ fontSize: "0.8125rem" }}>Thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.5rem", flexShrink: 0, backgroundColor: "#fafafa" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about the codebase…"
          disabled={loading || aiConfigured === null}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: loading || !input.trim() ? "#d1d5db" : "#232322",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "background-color 0.15s ease",
            flexShrink: 0
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Typing dots animation ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: "3px" }}>
      <style>{`@keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }`}</style>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#9ca3af",
          animation: `blink 1.4s infinite ${i * 0.2}s`
        }} />
      ))}
    </span>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const cardStyle = { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem" };
const titleStyle = { margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "#37352F" };

const userBubbleStyle = {
  backgroundColor: "#232322",
  color: "#ffffff",
  padding: "0.625rem 1rem",
  borderRadius: "12px 12px 2px 12px",
  maxWidth: "70%",
  wordBreak: "break-word"
};

const modelBubbleStyle = {
  backgroundColor: "#f3f4f6",
  color: "#1f2937",
  padding: "0.75rem 1rem",
  borderRadius: "12px 12px 12px 2px",
  maxWidth: "80%",
  wordBreak: "break-word"
};

const suggestionChipStyle = {
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: "20px",
  padding: "0.4rem 0.875rem",
  fontSize: "0.8125rem",
  color: "#374151",
  cursor: "pointer",
  transition: "all 0.15s ease",
  textAlign: "left"
};

const clearBtnStyle = {
  background: "none",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  padding: "0.325rem 0.75rem",
  fontSize: "0.75rem",
  color: "#6b7280",
  cursor: "pointer",
  transition: "all 0.15s ease"
};

const inputStyle = {
  flex: 1,
  padding: "0.5rem 0.875rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.875rem",
  color: "#37352F",
  outline: "none",
  backgroundColor: "#fff",
  transition: "border-color 0.15s ease"
};

const inlineCodeStyle = {
  backgroundColor: "#e5e7eb",
  padding: "0.1rem 0.35rem",
  borderRadius: "3px",
  fontSize: "0.75rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
};

const codeBlockStyle = {
  backgroundColor: "#1f2937",
  color: "#e5e7eb",
  border: "none",
  borderRadius: "6px",
  padding: "0.75rem 1rem",
  fontSize: "0.75rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  overflowX: "auto",
  margin: "0.5rem 0"
};

const listStyle = { margin: "0.25rem 0", paddingLeft: "1.25rem", lineHeight: 1.6 };
const listItemStyle = { fontSize: "0.8125rem", color: "#374151", marginBottom: "0.125rem" };
