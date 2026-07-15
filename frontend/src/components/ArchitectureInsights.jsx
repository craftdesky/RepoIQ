import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

// ── Confidence badge colors ────────────────────────────────────────────────
const CONFIDENCE_COLORS = {
  High: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  Medium: { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" },
  Low: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" }
};

// ── Layer color palette ────────────────────────────────────────────────────
const LAYER_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", tag: "#1e40af" },
  { bg: "#f0fdf4", border: "#bbf7d0", tag: "#166534" },
  { bg: "#fefce8", border: "#fde68a", tag: "#854d0e" },
  { bg: "#fdf2f8", border: "#fbcfe8", tag: "#9d174d" },
  { bg: "#f5f3ff", border: "#ddd6fe", tag: "#5b21b6" },
  { bg: "#fff7ed", border: "#fed7aa", tag: "#9a3412" },
  { bg: "#f0fdfa", border: "#99f6e4", tag: "#115e59" },
  { bg: "#faf5ff", border: "#e9d5ff", tag: "#7e22ce" }
];

export default function ArchitectureInsights({ projectMetadata, stats, graph, repoKey, cachedData, onDataGenerated }) {
  const [data, setData] = useState(cachedData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(null);
  const [expandedLayers, setExpandedLayers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => setAiConfigured(d.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/ai/architecture-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectMetadata, stats, graph, repoKey })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }
      const result = await res.json();
      setData(result);
      if (onDataGenerated) onDataGenerated(result);
      // Auto-expand the first layer
      if (result.layers && result.layers.length > 0) {
        setExpandedLayers({ [result.layers[0].name]: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleLayer(name) {
    setExpandedLayers(prev => ({ ...prev, [name]: !prev[name] }));
  }

  // ── AI not configured ──────────────────────────────────────────────────
  if (aiConfigured === false) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">Architecture Insights</h3>
        <div className="alert-warning" style={{ marginTop: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>Gemini API Key Required</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", lineHeight: 1.6 }}>
            Add your API key to <code>backend/.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  // ── Empty / Generate state ─────────────────────────────────────────────
  if (!data && !loading && !error) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">Architecture Insights</h3>
        <p className="feature-card-subtitle">
          Automatically detect architectural patterns, classify files into logical layers, and map module responsibilities.
        </p>
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏗️</div>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#37352F" }}>No analysis generated yet</h4>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: "#6b7280", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            Click below to let Gemini analyze your repository's file structure and classify its architecture.
          </p>
          <button onClick={handleGenerate} className="btn-primary">
            Generate Architecture Insights
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">Architecture Insights</h3>
        <div className="loading-row" style={{ padding: "3rem 0", justifyContent: "center" }}>
          <Spinner />
          <span style={{ fontSize: "0.875rem" }}>Analyzing repository architecture with Gemini…</span>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="feature-card">
        <h3 className="feature-card-title">Architecture Insights</h3>
        <div className="alert-error">
          <p style={{ margin: 0, fontSize: "0.875rem" }}>{error}</p>
        </div>
        <button onClick={handleGenerate} className="btn-primary">Retry</button>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────
  const { pattern, layers, responsibilities } = data;
  const conf = CONFIDENCE_COLORS[pattern?.confidence] || CONFIDENCE_COLORS.Low;

  const filteredResponsibilities = searchQuery
    ? responsibilities.filter(r =>
        r.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.responsibility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : responsibilities;

  return (
    <div className="feature-card">
      {/* Header */}
      <div className="feature-card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h3 className="feature-card-title" style={{ margin: 0 }}>Architecture Insights</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#6b7280" }}>
            AI-detected architectural patterns, layers, and module responsibilities.
          </p>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-secondary">
          ↻ Regenerate
        </button>
      </div>

      {/* ── Pattern Card ──────────────────────────────────────────────── */}
      {pattern && (
        <div style={{
          backgroundColor: "#fafafa",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.25rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#37352F" }}>
              {pattern.name}
            </h4>
            <span style={{
              display: "inline-block",
              padding: "0.2rem 0.625rem",
              borderRadius: "12px",
              fontSize: "0.6875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              backgroundColor: conf.bg,
              color: conf.text,
              border: `1px solid ${conf.border}`
            }}>
              {pattern.confidence} Confidence
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.7, color: "#374151" }}>
            {pattern.explanation}
          </p>
        </div>
      )}

      {/* ── Layers Breakdown ──────────────────────────────────────────── */}
      {layers && layers.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "#37352F", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Architectural Layers ({layers.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {layers.map((layer, idx) => {
              const color = LAYER_COLORS[idx % LAYER_COLORS.length];
              const isExpanded = expandedLayers[layer.name];
              return (
                <div key={layer.name} style={{
                  border: `1px solid ${color.border}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#fff"
                }}>
                  {/* Header row */}
                  <button
                    onClick={() => toggleLayer(layer.name)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 1rem",
                      backgroundColor: color.bg,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: color.tag,
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#37352F" }}>
                        {layer.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        ({layer.files.length} file{layer.files.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  </button>
                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${color.border}` }}>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.6 }}>
                        {layer.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {layer.files.map(f => (
                          <span key={f} style={{
                            display: "inline-block",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            backgroundColor: "#f5f5f4",
                            color: "#374151",
                            border: "1px solid #e5e7eb"
                          }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Module Responsibilities ───────────────────────────────────── */}
      {responsibilities && responsibilities.length > 0 && (
        <div>
          <div className="feature-card-header" style={{ marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#37352F", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Module Responsibilities ({responsibilities.length})
            </h4>
            <input
              type="text"
              placeholder="Search files…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ width: "200px", fontSize: "0.75rem" }}
            />
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 3fr",
              padding: "0.5rem 1rem",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "0.6875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#6b7280"
            }}>
              <span>File</span>
              <span>Role</span>
              <span>Description</span>
            </div>
            {/* Table body */}
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {filteredResponsibilities.map((r, idx) => (
                <div
                  key={r.file}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 3fr",
                    padding: "0.5rem 1rem",
                    borderBottom: idx < filteredResponsibilities.length - 1 ? "1px solid #f3f4f6" : "none",
                    fontSize: "0.8125rem",
                    alignItems: "center"
                  }}
                >
                  <span style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "0.75rem",
                    color: "#37352F",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {r.file}
                  </span>
                  <span>
                    <span style={{
                      display: "inline-block",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #e5e7eb"
                    }}>
                      {r.responsibility}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                    {r.description}
                  </span>
                </div>
              ))}
              {filteredResponsibilities.length === 0 && (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.8125rem" }}>
                  No files matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
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
