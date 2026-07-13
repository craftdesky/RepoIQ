import React, { useState, useEffect } from "react";

// ── Reusable inline markdown renderer ──────────────────────────────────────
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
      parts.push(
        <code key={parts.length} style={{ backgroundColor: "#f5f5f4", padding: "0.125rem 0.375rem", borderRadius: "3px", fontSize: "0.8125rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
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
        <pre key={elements.length} style={{ backgroundColor: "#f5f5f4", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "1rem", fontSize: "0.8125rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", overflowX: "auto", margin: "0.75rem 0" }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith("### ")) { elements.push(<h4 key={elements.length} style={{ margin: "1.25rem 0 0.4rem", fontSize: "0.9375rem", fontWeight: 600, color: "#37352F" }}>{inlineFormat(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith("## ")) { elements.push(<h3 key={elements.length} style={{ margin: "1.5rem 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "#37352F" }}>{inlineFormat(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith("# ")) { elements.push(<h2 key={elements.length} style={{ margin: "1.5rem 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "#37352F" }}>{inlineFormat(line.slice(2))}</h2>); i++; continue; }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(
        <ol key={elements.length} style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", lineHeight: 1.7 }}>
          {items.map((item, idx) => <li key={idx} style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "0.25rem" }}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }
    if (/^[\-\*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={elements.length} style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", lineHeight: 1.7 }}>
          {items.map((item, idx) => <li key={idx} style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "0.25rem" }}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    elements.push(<p key={elements.length} style={{ margin: "0.5rem 0", fontSize: "0.875rem", lineHeight: 1.7, color: "#374151" }}>{inlineFormat(line)}</p>);
    i++;
  }
  return elements;
}

// ── Constants ──────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

const EXPERIENCE_OPTIONS = ["Junior", "Mid-Level", "Senior"];
const GOAL_OPTIONS = ["General Exploration", "Adding a Feature", "Fixing a Bug", "Refactoring / Optimization"];
const TECH_FOCUS_OPTIONS = ["No Preference", "React / Frontend", "Node.js / Backend", "Full-Stack", "Build / CI/CD", "Database / Data Layer"];

// ── Component ──────────────────────────────────────────────────────────────
export default function OnboardingAssistant({ projectMetadata, stats, metrics, repoKey, cachedGuide, onGuideGenerated }) {
  const [experience, setExperience] = useState("Junior");
  const [goal, setGoal] = useState("General Exploration");
  const [techFocus, setTechFocus] = useState("No Preference");

  const [guide, setGuide] = useState(cachedGuide || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => setAiConfigured(d.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGuide(null);
    try {
      const res = await fetch(`${API_BASE}/ai/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, goal, techFocus, projectMetadata, stats, metrics, repoKey })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setGuide(data.guide);
      if (onGuideGenerated) onGuideGenerated(data.guide);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── AI not configured ────────────────────────────────────────────────────
  if (aiConfigured === false) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>Onboarding Assistant</h3>
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "1rem 1.25rem", marginTop: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>
            Add your API key to <code style={{ backgroundColor: "#fef3c7", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>backend/.env</code>:
          </p>
          <pre style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a", borderRadius: "4px", padding: "0.75rem", fontSize: "0.8125rem", fontFamily: "ui-monospace, monospace", marginTop: "0.5rem", color: "#78350f" }}>
            GEMINI_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }

  const selectStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "0.875rem",
    color: "#37352F",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    paddingRight: "2rem"
  };

  const labelStyle = { fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.375rem" };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>Onboarding Assistant</h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 1.5rem" }}>
        Tell us about yourself and we'll generate a personalized guide to help you navigate this codebase.
      </p>

      {/* Form */}
      <form onSubmit={handleGenerate}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          {/* Experience */}
          <div>
            <label style={labelStyle}>Experience Level</label>
            <select value={experience} onChange={e => setExperience(e.target.value)} style={selectStyle}>
              {EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label style={labelStyle}>Onboarding Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} style={selectStyle}>
              {GOAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Tech Focus */}
          <div>
            <label style={labelStyle}>Primary Tech Focus</label>
            <select value={techFocus} onChange={e => setTechFocus(e.target.value)} style={selectStyle}>
              {TECH_FOCUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || aiConfigured === null}
          style={{
            backgroundColor: loading ? "#9ca3af" : "#232322",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "background-color 0.15s ease"
          }}
        >
          {loading && <Spinner />}
          {loading ? "Generating Guide…" : "Generate Onboarding Guide"}
        </button>
      </form>

      {/* Divider */}
      {(guide || error || loading) && (
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "1.5rem 0" }} />
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6b7280" }}>
          <Spinner />
          <span style={{ fontSize: "0.875rem" }}>Generating your personalized guide with Gemini…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {guide && !loading && (
        <div style={{ lineHeight: 1.7 }}>
          {renderMarkdown(guide)}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1.5rem"
};

const titleStyle = {
  margin: "0 0 0.5rem",
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "#37352F"
};
