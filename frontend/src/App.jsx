import React, { useState, useMemo } from "react";
import DependencyGraph from "./DependencyGraph";
import "./App.css";
import CocomoCard from "./components/CocomoCard";
import HalsteadCard from "./components/HalsteadCard";
import CyclomaticCard from "./components/CyclomaticCard";
import CouplingDensityGauge from "./components/CouplingDensityGauge";
import HealthScoreChart from "./components/HealthScoreChart";
import HotspotCard from "./components/HotspotCard";
import HotspotTable from "./components/HotspotTable";

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

  function getCouplingLabel(density) {
    const d = Number(density || 0);
    if (d <= 0.35) return "Highly Modular";
    if (d <= 0.65) return "Balanced";
    return "Highly Monolithic";
  }

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
  const impactEntries = impact ? Object.entries(impact).map(([id, data]) => ({ id, ...data })) : [];

  const [impactView, setImpactView] = useState("files"); // 'files' | 'folders'

  function getDir(id) {
    if (!id) return ".";
    const parts = id.split("/");
    parts.pop();
    return parts.length === 0 ? "." : parts.join("/");
  }

  const aggregateImpactByFolder = (entries) => {
    const map = {};
    entries.forEach((node) => {
      const dir = getDir(node.id);
      if (!map[dir]) {
        map[dir] = {
          id: dir,
          files: [],
          affectedCount: 0,
          directDependentsSet: new Set(),
          affectedFilesSet: new Set(),
          impactScope: "low",
        };
      }

      const bucket = map[dir];
      bucket.files.push(node);
      bucket.affectedCount += node.affectedCount || 0;
      (node.directDependents || []).forEach((d) => bucket.directDependentsSet.add(d));
      (node.affectedFiles || []).forEach((f) => bucket.affectedFilesSet.add(f));

      if (node.impactScope === "high") bucket.impactScope = "high";
      else if (node.impactScope === "medium" && bucket.impactScope !== "high") bucket.impactScope = "medium";
    });

    return Object.values(map).map((b) => ({
      id: b.id,
      displayName: b.id.split("/").pop() || b.id,
      files: b.files,
      affectedCount: b.affectedCount,
      directDependents: Array.from(b.directDependentsSet),
      affectedFiles: Array.from(b.affectedFilesSet),
      impactScope: b.impactScope,
    }));
  };

  const displayedImpactEntries = useMemo(() => {
    if (impactView === "files") return impactEntries;
    return aggregateImpactByFolder(impactEntries);
  }, [impactEntries, impactView]);

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
        <section className="graph-section card" style={{ padding: 0 }}>
          <div className="graph-container" style={{ border: 'none', borderRadius: '6px' }}>
            <DependencyGraph
              graphData={currentAnalysis.graph}
              hotspots={metrics?.hotspots?.files}
              highlightNode={selectedNode}
              onSelectNode={(id) => setSelectedNode(id)}
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
          <button
            className={`feature-btn ${activeTab === 'hotspots' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotspots')}
          >
            Hotspot Analysis
          </button>
        </nav>

        {/* Active Feature Content */}
        <section className="feature-content">
          
          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <div className="card">
                <h3 className="title">Repository Overview</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL FILES</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.nodeCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL FOLDERS</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.totalFolders || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL LINES OF CODE</span>
                    <strong style={{ fontSize: "1.25rem" }}>{stats?.totalLines || 0}</strong>
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
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DEPENDENCY LINKS</span>
                    <strong style={{ fontSize: "1.5rem" }}>{stats?.edgeCount || 0}</strong>
                  </div>

                  <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center" }}>
                    <div>
                      <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>COUPLING DENSITY</span>
                      <CouplingDensityGauge density={metrics?.couplingDensity?.density ?? metrics?.couplingDensity ?? 0} />
                      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        {getCouplingLabel(metrics?.couplingDensity?.density ?? metrics?.couplingDensity ?? 0)} · {((metrics?.couplingDensity?.density ?? metrics?.couplingDensity ?? 0) <= 1 ? ((metrics?.couplingDensity?.density ?? metrics?.couplingDensity ?? 0) * 100).toFixed(2) : (metrics?.couplingDensity?.density ?? metrics?.couplingDensity ?? 0).toFixed(2))}%
                      </div>
                    </div>

                    <div>
                      <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ARCHITECTURAL HEALTH SCORE</span>
                      <HealthScoreChart score={metrics?.architecturalHealth?.healthScore ?? metrics?.architecturalHealth?.score ?? 0} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Metrics */}
          {activeTab === "metrics" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <CocomoCard summary={metrics?.cocomo?.summary} />
                <HalsteadCard summary={metrics?.halstead?.summary} />
                <CyclomaticCard summary={metrics?.cyclomaticComplexity?.summary} files={metrics?.cyclomaticComplexity?.files} />
              </div>

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
            </>
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

          {/* Tab: Hotspots */}
          {activeTab === "hotspots" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <HotspotCard hotspots={metrics?.hotspots} />
              <div style={{ gridColumn: "1 / -1" }}>
                <HotspotTable files={metrics?.hotspots?.files || []} onRowClick={(id) => setSelectedNode(selectedNode === id ? null : id)} />
              </div>
            </div>
          )}

          {/* Tab: Impact */}
          {activeTab === "impact" && (
            <div className="card">
              <h3 className="title">Change Impact Analysis</h3>
              <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <p className="text-muted" style={{ fontSize: "0.875rem", margin: 0 }}>
                      Identify high-risk modules and unused garbage nodes across your codebase.
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className={`toggle-btn ${impactView === 'files' ? 'active' : ''}`} onClick={() => setImpactView('files')}>Files</button>
                      <button type="button" className={`toggle-btn ${impactView === 'folders' ? 'active' : ''}`} onClick={() => setImpactView('folders')}>Folders</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                    {/* Highest Impact */}
                    <div style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <h4 style={{ margin: "0 0 1rem 0", color: "#991b1b", fontSize: "1rem" }}>Highest Impact Modules</h4>
                      <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                        {displayedImpactEntries.sort((a, b) => b.affectedCount - a.affectedCount).slice(0, 5).map(node => (
                          <li key={node.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{ wordBreak: "break-all", paddingRight: "1rem", color: "#374151", fontWeight: "500" }}>{(impactView === 'files' ? node.id.split("/").pop() : (node.displayName || node.id.split("/").pop()))}</span>
                            <strong style={{ whiteSpace: "nowrap", color: "#b91c1c" }}>{node.affectedCount} affected</strong>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* No Impact (Garbage) */}
                    <div style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <h4 style={{ margin: "0 0 1rem 0", color: "#166534", fontSize: "1rem" }}>Zero Impact (Potential Garbage)</h4>
                      <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                        {displayedImpactEntries.filter(n => n.affectedCount === 0).slice(0, 5).map(node => (
                          <li key={node.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6", wordBreak: "break-all", color: "#374151" }}>
                            {(impactView === 'files' ? node.id.split("/").pop() : (node.displayName || node.id.split("/").pop()))}
                          </li>
                        ))}
                        {displayedImpactEntries.filter(n => n.affectedCount === 0).length === 0 && (
                          <li style={{ padding: "0.5rem 0", color: "#6b7280" }}>No zero-impact files found.</li>
                        )}
                        {displayedImpactEntries.filter(n => n.affectedCount === 0).length > 5 && (
                          <li style={{ padding: "0.5rem 0", color: "#6b7280" }}>...and {displayedImpactEntries.filter(n => n.affectedCount === 0).length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* All Nodes List */}
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#37352F" }}>All Modules</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                          <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>File Name</th>
                          <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Scope</th>
                          <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Direct Dependents</th>
                          <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Total Affected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedImpactEntries.sort((a, b) => b.affectedCount - a.affectedCount).map(node => (
                          <React.Fragment key={node.id}>
                            <tr 
                              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                              style={{ 
                                cursor: "pointer", 
                                backgroundColor: selectedNode === node.id ? "#f9fafb" : "transparent",
                                borderBottom: "1px solid #e5e7eb",
                                transition: "background-color 0.2s"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedNode === node.id ? "#f9fafb" : "#f3f4f6"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedNode === node.id ? "#f9fafb" : "transparent"}
                            >
                              <td style={{ padding: "0.75rem", wordBreak: "break-all", fontWeight: "500", color: "#374151" }}>{impactView === 'files' ? node.id : (node.displayName || node.id)}</td>
                              <td style={{ padding: "0.75rem" }}>
                                <span className={`badge ${node.impactScope === 'high' ? 'badge-error' : node.impactScope === 'medium' ? 'badge-info' : ''}`} style={{ backgroundColor: node.impactScope === 'low' ? '#dcfce7' : undefined, color: node.impactScope === 'low' ? '#166534' : undefined }}>
                                  {node.impactScope.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem", color: "#374151" }}>{node.directDependents?.length || 0}</td>
                              <td style={{ padding: "0.75rem", color: "#374151" }}>{node.affectedCount || 0}</td>
                            </tr>
                            {selectedNode === node.id && (
                              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <td colSpan={4} style={{ padding: "1.5rem" }}>
                                  {/* Detailed View Inline */}
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                                    <div style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>IMPACT SCOPE</span>
                                      <span style={{
                                        fontSize: "1.25rem",
                                        fontWeight: "600",
                                        color: node.impactScope === "high" ? "#ef4444" : 
                                               node.impactScope === "medium" ? "#eab308" : "#22c55e"
                                      }}>
                                        {node.impactScope.toUpperCase()}
                                      </span>
                                    </div>
                                    <div style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>DIRECT DEPENDENTS</span>
                                      <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{node.directDependents?.length || 0}</span>
                                    </div>
                                    <div style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>TOTAL AFFECTED FILES</span>
                                      <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{node.affectedCount || 0}</span>
                                    </div>
                                  </div>

                                  {node.affectedFiles?.length > 0 ? (
                                    <div>
                                      <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", color: "#37352F" }}>Files affected by changes to this module:</h5>
                                      <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "0.5rem", backgroundColor: "#ffffff" }}>
                                        <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                                          {node.affectedFiles.map((file, idx) => (
                                            <li key={idx} style={{ padding: "0.5rem", borderBottom: idx < node.affectedFiles.length - 1 ? "1px solid #f3f4f6" : "none", wordBreak: "break-all" }}>
                                              {file}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  ) : (
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>No other files are affected by this module.</p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
