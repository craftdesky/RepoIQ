import React, { useState, useEffect, useRef } from "react";

/**
 * Simple inline Markdown renderer — handles headings, bold, italic,
 * bullet lists, code blocks, and inline code.
 */
function renderMarkdown(md) {
  if (!md) return null;

  const lines = md.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={elements.length}>
          {inlineFormat(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={elements.length}>
          {inlineFormat(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={elements.length}>
          {inlineFormat(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^[\-\*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={elements.length}>
          {items.map((item, idx) => (
            <li key={idx}>
              {inlineFormat(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={elements.length}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/** Handle inline markdown: bold, italic, inline code */
function inlineFormat(text) {
  if (!text) return text;
  // Split on inline code, bold, italic patterns
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={parts.length}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={parts.length}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

const API_BASE = "http://localhost:5000/api";

export default function RepositorySummary({ projectMetadata, stats, metrics, repoKey, cachedSummary, onSummaryGenerated }) {
  const [summary, setSummary] = useState(cachedSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(null); // null = checking
  const hasFetched = useRef(false);

  // Check AI status on mount
  useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then((r) => r.json())
      .then((data) => setAiConfigured(data.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  // Auto-fetch summary once AI is confirmed configured (skip if cached)
  useEffect(() => {
    if (aiConfigured !== true || hasFetched.current || cachedSummary) return;
    hasFetched.current = true;
    fetchSummary();
  }, [aiConfigured]);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectMetadata, stats, metrics, repoKey })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setSummary(data.summary);
      if (onSummaryGenerated) onSummaryGenerated(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Render States ---

  // Still checking AI status
  if (aiConfigured === null) {
    return (
      <div className="feature-card">
        <div className="loading-row">
          <Spinner />
          <span>Checking AI service status…</span>
        </div>
      </div>
    );
  }

  // AI not configured
  if (aiConfigured === false) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">AI Repository Summary</h3>
        <div className="alert-warning">
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>
            Gemini API Key Required
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>
            To use AI features, add your Google Gemini API key to the backend <code>.env</code> file:
          </p>
          <pre>
            GEMINI_API_KEY=your_api_key_here
          </pre>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: "#78350f" }}>
            Get a free API key from <strong>Google AI Studio</strong> (aistudio.google.com), then restart the backend server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <h3 className="feature-card-title">AI Repository Summary</h3>
        {summary && (
          <button
            onClick={() => { hasFetched.current = false; setSummary(null); fetchSummary(); }}
            disabled={loading}
            className="btn-secondary"
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-row">
          <Spinner />
          <span>Generating repository summary…</span>
        </div>
      )}

      {error && !loading && (
        <div className="alert-error">
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>{error}</p>
          <button
            onClick={fetchSummary}
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      )}

      {summary && !loading && (
        <div className="md-render">
          {renderMarkdown(summary)}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner-icon">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
