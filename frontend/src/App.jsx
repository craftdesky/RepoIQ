import React, { useState } from "react";
import DependencyGraph from "./DependencyGraph";
import "./App.css";

export default function App() {
  const [sourceType, setSourceType] = useState("local"); // 'local' | 'git'
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [repoContext, setRepoContext] = useState({ name: "", link: "" });

  // Detail Drilldown / Selection states
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'metrics' | 'cycles' | 'impact'

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);

    const endpoint =
      sourceType === "local"
        ? "http://localhost:5000/api/analyze/local"
        : "http://localhost:5000/api/analyze/git";

    const payload =
      sourceType === "local"
        ? { repoPath: inputValue.trim() }
        : { gitUrl: inputValue.trim() };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "An error occurred during analysis.");
      }

      setData(resData);
      
      // Extract a name for the top ribbon
      let repoName = inputValue.trim().split(/[/\\]/).pop() || "Repository";
      if (sourceType === "git" && repoName.endsWith('.git')) {
        repoName = repoName.slice(0, -4);
      }
      setRepoContext({ name: repoName, link: inputValue.trim() });
      setActiveTab("overview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentAnalysis = data?.analysis;
  const metrics = currentAnalysis?.metrics;
  const stats = currentAnalysis?.stats;
  const cycles = currentAnalysis?.cycles;
  const impact = currentAnalysis?.impact;
  const selectedNodeImpact = selectedNode && impact?.[selectedNode];

  const handleReturnToLanding = () => {
    setData(null);
    setInputValue("");
    setSelectedNode(null);
  };

  // --- LANDING PAGE ---
  if (!data) {
    return (
      <div className="landing-container">
        <div className="landing-content">
          <h1 className="hero-title">RepoIQ</h1>
          
          <div className="source-toggles">
            <button
              type="button"
              className={`toggle-btn ${sourceType === 'local' ? 'active' : ''}`}
              onClick={() => { setSourceType("local"); setInputValue(""); setError(null); }}
            >
              Local Path
            </button>
            <button
              type="button"
              className={`toggle-btn ${sourceType === 'git' ? 'active' : ''}`}
              onClick={() => { setSourceType("git"); setInputValue(""); setError(null); }}
            >
              GitHub Repository
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="analyze-form">
            <input
              type="text"
              required
              className="analyze-input"
              placeholder={
                sourceType === "local"
                  ? "Enter absolute folder path (e.g. d:/RepoIQ/testRepo)"
                  : "Enter public repository URL (e.g. https://github.com/craftdesky/RepoIQ)"
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="hero-description">
            <p>
              RepoIQ is a codebase intelligence platform that performs static analysis on repository structure, 
              extracting module dependencies, tracking architectural cycles, and indexing complexity metrics 
              to deliver a comprehensive representation of software architecture.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PAGE ---
  return (
    <div className="dashboard-container">
      {/* Top Ribbon */}
      <header className="top-ribbon">
        <div className="ribbon-left">
          <button className="back-btn" onClick={handleReturnToLanding} aria-label="Go back" title="Return to Landing Page">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="repo-info">
            <h2 className="repo-name">{repoContext.name}</h2>
            <span className="repo-link">{repoContext.link}</span>
          </div>
        </div>
        <div className="ribbon-right">
          <button className="hamburger-btn" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Graph Section (Always Visible) */}
        <section className="graph-section card">
          <div className="graph-header">
            <h3 className="section-title">Dependency Graph</h3>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              Click on a node to load its impact analysis.
            </span>
          </div>
          <div className="graph-container">
            <DependencyGraph 
              graphData={currentAnalysis.graph} 
              onSelectNode={(nodeId) => {
                setSelectedNode(nodeId);
                setActiveTab("impact");
              }} 
            />
          </div>
        </section>

        {/* Feature Buttons Block */}
        <nav className="feature-nav">
          <button
            className={`feature-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Repository Overview
          </button>
          <button
            className={`feature-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics Explorer
          </button>
          <button
            className={`feature-btn ${activeTab === 'cycles' ? 'active' : ''}`}
            onClick={() => setActiveTab('cycles')}
          >
            Circular Dependencies
            {cycles && cycles.length > 0 && <span className="badge badge-error">{cycles.length}</span>}
          </button>
          <button
            className={`feature-btn ${activeTab === 'impact' ? 'active' : ''}`}
            onClick={() => setActiveTab('impact')}
          >
            Impact Analysis
            {selectedNode && <span className="badge badge-info">Active</span>}
          </button>
        </nav>

        {/* Active Feature Content */}
        <section className="feature-content">
          
          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <div className="card">
                <h3 className="title">Project Structure</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL FILES</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.nodeCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DEPENDENCY LINKS</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.edgeCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ISOLATED FILES</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.isolatedCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>CIRCULAR CYCLES</span>
                    <strong style={{ fontSize: "1.5rem", color: (cycles?.length || 0) > 0 ? "#ef4444" : "inherit" }}>
                      {cycles?.length || 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="title">COCOMO Estimates</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>EFFORT ESTIMATE</span>
                    <strong style={{ fontSize: "1.25rem" }}>{metrics?.cocomo?.summary?.effortPersonMonths || 0} PM</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DEV TIME</span>
                    <strong style={{ fontSize: "1.25rem" }}>{metrics?.cocomo?.summary?.developmentTimeMonths || 0} Mos</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>EST. TEAM SIZE</span>
                    <strong style={{ fontSize: "1.25rem" }}>{metrics?.cocomo?.summary?.averageTeamSize || 0} Devs</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>KILOLINES OF CODE</span>
                    <strong style={{ fontSize: "1.25rem" }}>{metrics?.cocomo?.summary?.kloc || 0} KLOC</strong>
                  </div>
                </div>
              </div>

              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <h3 className="title">Halstead Repository Summary</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOCABULARY</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{metrics?.halstead?.summary?.vocabulary || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOLUME</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{metrics?.halstead?.summary?.volume || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DIFFICULTY</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{metrics?.halstead?.summary?.difficulty || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ESTIMATED DEFECTS</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{metrics?.halstead?.summary?.defects || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Metrics */}
          {activeTab === "metrics" && (
            <div className="card">
              <h3 className="title">Detailed Metrics Explorer</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
                A comprehensive breakdown of cyclomatic complexity, lines of code, and Halstead difficulty per file.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Complexity (Highest Fn)</th>
                      <th>Lines (LOC)</th>
                      <th>Halstead Difficulty</th>
                      <th>Comment Density</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAnalysis.graph.nodes.map((node) => {
                      const fileComplexity = metrics?.cyclomaticComplexity?.files?.find(f => f.file === node.id);
                      const fileHalstead = metrics?.halstead?.files?.find(f => f.file === node.id);
                      const fileComments = metrics?.commentDensity?.files?.find(f => f.file === node.id);

                      return (
                        <tr key={node.id}>
                          <td style={{ wordBreak: "break-all", fontWeight: "500", color: "#2563eb" }}>{node.id}</td>
                          <td>{fileComplexity?.metrics?.summary?.highestComplexity || 1}</td>
                          <td>{node.lineCount || 0}</td>
                          <td>{fileHalstead?.metrics?.difficulty || 0}</td>
                          <td>{fileComments?.metrics?.commentDensity ? `${(fileComments.metrics.commentDensity * 100).toFixed(0)}%` : "0%"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Cycles */}
          {activeTab === "cycles" && (
            <div className="card">
              <h3 className="title">Circular Dependencies</h3>
              {cycles && cycles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "1rem", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "0.875rem" }}>
                    <strong>Warning:</strong> {cycles.length} dependency cycles detected. Architectural cycles increase coupling and can negatively impact code maintainability.
                  </div>
                  <ul className="cycle-list">
                    {cycles.map((cycle, index) => (
                      <li key={index} className="cycle-item">
                        <strong style={{ color: "#374151" }}>Cycle #{index + 1}</strong>
                        <div className="cycle-path">
                          {Array.isArray(cycle) ? cycle.join(" → ") : (cycle.path ? cycle.path.join(" → ") : "")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem" }}>Clean Architecture</h4>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>No circular dependencies detected in the project.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Impact */}
          {activeTab === "impact" && (
            <div className="card">
              <h3 className="title">Change Impact Analysis</h3>
              {!selectedNode ? (
                <p className="text-muted" style={{ fontSize: "0.875rem", padding: "2rem", textAlign: "center", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                  Select a node from the Dependency Graph above to view its impact analysis.
                </p>
              ) : (
                <div>
                  <h4 style={{ fontSize: "1.125rem", margin: "0 0 1rem 0", color: "#2563eb", wordBreak: "break-all" }}>
                    {selectedNode}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                    <div style={{ padding: "1rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>IMPACT SCOPE</span>
                      <span style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        color: selectedNodeImpact?.impactScope === "high" ? "#ef4444" : 
                               selectedNodeImpact?.impactScope === "medium" ? "#eab308" : "#22c55e"
                      }}>
                        {selectedNodeImpact?.impactScope?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>DIRECT DEPENDENTS</span>
                      <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{selectedNodeImpact?.directDependents?.length || 0}</span>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>TOTAL AFFECTED FILES</span>
                      <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{selectedNodeImpact?.affectedCount || 0}</span>
                    </div>
                  </div>

                  {selectedNodeImpact?.affectedFiles?.length > 0 && (
                    <div>
                      <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", color: "#374151" }}>Files affected by changes to this module:</h5>
                      <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "0.5rem" }}>
                        <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                          {selectedNodeImpact.affectedFiles.map((file, idx) => (
                            <li key={idx} style={{ padding: "0.5rem", borderBottom: idx < selectedNodeImpact.affectedFiles.length - 1 ? "1px solid #f3f4f6" : "none", wordBreak: "break-all" }}>
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
