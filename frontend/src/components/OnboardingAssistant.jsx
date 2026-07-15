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
        <pre key={elements.length}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith("### ")) { elements.push(<h4 key={elements.length}>{inlineFormat(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith("## ")) { elements.push(<h3 key={elements.length}>{inlineFormat(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith("# ")) { elements.push(<h2 key={elements.length}>{inlineFormat(line.slice(2))}</h2>); i++; continue; }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(
        <ol key={elements.length}>
          {items.map((item, idx) => <li key={idx}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }
    if (/^[\-\*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={elements.length}>
          {items.map((item, idx) => <li key={idx}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    elements.push(<p key={elements.length}>{inlineFormat(line)}</p>);
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
      <div className="feature-card">
        <h3 className="feature-card-title">Onboarding Assistant</h3>
        <div className="alert-warning" style={{ marginTop: "1rem" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0" }}>
            Add your API key to <code>backend/.env</code>:
          </p>
          <pre>
            GEMINI_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }



  return (
    <div className="feature-card">
      <h3 className="feature-card-title">Onboarding Assistant</h3>
      <p className="feature-card-subtitle">
        Tell us about yourself and we'll generate a personalized guide to help you navigate this codebase.
      </p>

      {/* Form */}
      <form onSubmit={handleGenerate}>
        <div className="stat-grid stat-grid-3" style={{ marginBottom: "1.25rem" }}>
          {/* Experience */}
          <div>
            <label className="form-label">Experience Level</label>
            <select value={experience} onChange={e => setExperience(e.target.value)} className="form-control">
              {EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="form-label">Onboarding Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="form-control">
              {GOAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Tech Focus */}
          <div>
            <label className="form-label">Primary Tech Focus</label>
            <select value={techFocus} onChange={e => setTechFocus(e.target.value)} className="form-control">
              {TECH_FOCUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || aiConfigured === null}
          className="btn-primary"
        >
          {loading && <Spinner />}
          {loading ? "Generating Guide…" : "Generate Onboarding Guide"}
        </button>
      </form>

      {/* Divider */}
      {(guide || error || loading) && (
        <hr className="divider" />
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-row">
          <Spinner />
          <span>Generating your personalized guide with Gemini…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert-error">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {guide && !loading && (
        <div className="md-render">
          {renderMarkdown(guide)}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner-icon">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

