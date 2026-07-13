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
        <pre key={elements.length} style={{ backgroundColor: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", borderRadius: "6px", padding: "1rem", fontSize: "0.8125rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", overflowX: "auto", margin: "0.75rem 0" }}>
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
      <div style={cardStyle}>
        <h3 style={titleStyle}>Documentation generator</h3>
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "1rem 1.25rem", marginTop: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>
            Add your API key to <code style={{ backgroundColor: "#fef3c7", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>backend/.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  const currentMarkdown = docs[activeSection];

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ ...titleStyle, margin: 0 }}>Documentation generator</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#6b7280" }}>
            Generate publication-quality Markdown documentation tailored to your codebase structure.
          </p>
        </div>
        {currentMarkdown && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => downloadMarkdown(activeSection)}
              style={downloadBtnStyle}
            >
              ↓ Download Markdown
            </button>
            <button
              onClick={() => generateDoc(activeSection)}
              disabled={loading}
              style={regenerateBtnStyle}
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
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: activeSection === sec.id ? "1px solid #232322" : "1px solid #d1d5db",
              backgroundColor: activeSection === sec.id ? "#232322" : "#fff",
              color: activeSection === sec.id ? "#fff" : "#374151",
              fontSize: "0.8125rem",
              fontWeight: activeSection === sec.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "3rem 0", color: "#6b7280", justifyContent: "center" }}>
          <Spinner />
          <span style={{ fontSize: "0.875rem" }}>Generating comprehensive Markdown documentation with Gemini…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>{error}</p>
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
            Click generate below to let Gemini analyze your codebase structure and build complete technical documentation.
          </p>
          <button
            onClick={() => generateDoc(activeSection)}
            style={{
              backgroundColor: "#232322",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Generate Documentation
          </button>
        </div>
      )}

      {/* Rendered Markdown */}
      {currentMarkdown && !loading && (
        <div style={{ lineHeight: 1.7, backgroundColor: "#fff", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
          {renderMarkdown(currentMarkdown)}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const cardStyle = { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem" };
const titleStyle = { margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "#37352F" };

const downloadBtnStyle = {
  backgroundColor: "#232322",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "0.4rem 0.875rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer"
};

const regenerateBtnStyle = {
  background: "none",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  padding: "0.4rem 0.875rem",
  fontSize: "0.75rem",
  color: "#6b7280",
  cursor: "pointer"
};
