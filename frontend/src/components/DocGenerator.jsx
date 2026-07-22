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

const SECTIONS = [
  { id: "architecture", label: "Architecture & Modules", filename: "ARCHITECTURE_DOCS.md" },
  { id: "dependencies", label: "Dependency & Flow Analysis", filename: "DEPENDENCY_FLOW_DOCS.md" },
  { id: "setup", label: "Quick-Start & Setup Guide", filename: "SETUP_GUIDE.md" },
  { id: "api", label: "API & Integration Map", filename: "API_INTEGRATION_MAP.md" },
  { id: "readme", label: "Project Brief & README", filename: "README_AUTO.md" }
];

export default function DocGenerator({ projectMetadata, stats, metrics, graph, repoKey, cachedDocs, onDocsGenerated }) {
  const [activeSection, setActiveSection] = useState("architecture");
  const [docs, setDocs] = useState(cachedDocs || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => setAiConfigured(d.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  async function generateDoc(sectionId) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionId,
          projectMetadata,
          stats,
          metrics,
          graph,
          repoKey
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate docs (${res.status})`);
      }
      const data = await res.json();
      const updated = { ...docs, [sectionId]: data.markdown };
      setDocs(updated);
      if (onDocsGenerated) onDocsGenerated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown(sectionId) {
    const content = docs[sectionId];
    if (!content) return;
    const currentSec = SECTIONS.find(s => s.id === sectionId);
    const filename = currentSec ? currentSec.filename : `${sectionId}.md`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (aiConfigured === false) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">Documentation generator</h3>
        <div className="alert-warning">
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>
            Add your API key to <code>backend/.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  const currentMarkdown = docs[activeSection];

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <div>
          <h3 className="feature-card-title" style={{ margin: 0 }}>Documentation generator</h3>
          <p className="feature-card-subtitle">
            Generate publication-quality Markdown documentation tailored to your codebase structure.
          </p>
        </div>
        {currentMarkdown && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => downloadMarkdown(activeSection)}
              className="btn-primary"
            >
              ↓ Download Markdown
            </button>
            <button
              onClick={() => generateDoc(activeSection)}
              disabled={loading}
              className="btn-secondary"
            >
              ↻ Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
        {SECTIONS.map(sec => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveSection(sec.id);
              setError(null);
            }}
            className={activeSection === sec.id ? "btn-primary" : "btn-secondary"}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-row" style={{ padding: "3rem 0", justifyContent: "center" }}>
          <Spinner />
          <span>Generating comprehensive Markdown documentation…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert-error">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Empty State / Prompt to Generate */}
      {!currentMarkdown && !loading && !error && (
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#37352F" }}>
            No documentation generated yet for this section
          </h4>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: "#6b7280", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            Click generate below to let AI analyze your codebase structure and build complete technical documentation.
          </p>
          <button
            onClick={() => generateDoc(activeSection)}
            className="btn-primary"
          >
            Generate Documentation
          </button>
        </div>
      )}

      {/* Rendered Markdown */}
      {currentMarkdown && !loading && (
        <div className="md-render">
          {renderMarkdown(currentMarkdown)}
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

