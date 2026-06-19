import React, { useState } from "react";
import DependencyGraph from "./DependencyGraph";
import "./App.css";

export default function App() {
  const [sourceType, setSourceType] = useState("local"); // 'local' | 'git'
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Detail Drilldown / Selection states
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'graph' | 'metrics' | 'cycles'

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

  // Selected file details helper
  const selectedNodeDetails = selectedNode && currentAnalysis?.graph?.nodes?.find(n => n.id === selectedNode);
  const selectedNodeImpact = selectedNode && impact?.[selectedNode];

  return (
    <div className="container">
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "300", letterSpacing: "-0.025em", margin: 0 }}>RepoIQ</h1>
        <p className="text-muted" style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>
          Static Code Analysis & Dependency Intelligence Dashboard
        </p>
      </header>

      {/* Input Selector Panel */}
      <div className="card">
        <h2 style={{ fontSize: "1.125rem", fontWeight: "600", margin: "0 0 1rem 0" }}>Start New Analysis</h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            type="button"
            style={{
              backgroundColor: sourceType === "local" ? "#374151" : "#ffffff",
              color: sourceType === "local" ? "#ffffff" : "#374151",
              border: "1px solid #d1d5db",
            }}
            onClick={() => {
              setSourceType("local");
              setInputValue("");
            }}
          >
            Local Path
          </button>
          <button
            type="button"
            style={{
              backgroundColor: sourceType === "git" ? "#374151" : "#ffffff",
              color: sourceType === "git" ? "#ffffff" : "#374151",
              border: "1px solid #d1d5db",
            }}
            onClick={() => {
              setSourceType("git");
              setInputValue("");
            }}
          >
            GitHub Repository
          </button>
        </div>

        <form onSubmit={handleAnalyze} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            required
            placeholder={
              sourceType === "local"
                ? "Enter absolute folder path (e.g. d:/RepoIQ/testRepo)"
                : "Enter public repository URL (e.g. https://github.com/craftdesky/RepoIQ)"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: "4px", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
      </div>

      {currentAnalysis && (
        <div>
          {/* Tabs bar */}
          <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
            {["overview", "graph", "metrics", "cycles"].map((tab) => (
              <button
                key={tab}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid #374151" : "2px solid transparent",
                  borderRadius: 0,
                  color: activeTab === tab ? "#111827" : "#6b7280",
                  padding: "0.5rem 0.25rem",
                  fontWeight: activeTab === tab ? "600" : "400",
                  cursor: "pointer",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {/* Quick stats */}
              <div className="card">
                <h3 className="title" style={{ fontSize: "1.125rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>Project Structure</h3>
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
                    <strong style={{ fontSize: "1.5rem", color: (cycles?.length || 0) > 0 ? "#b91c1c" : "inherit" }}>
                      {cycles?.length || 0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* COCOMO summary */}
              <div className="card">
                <h3 className="title" style={{ fontSize: "1.125rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>COCOMO Estimates</h3>
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

              {/* General Health card */}
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <h3 className="title" style={{ fontSize: "1.125rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem", margin: 0 }}>Halstead Repository Summary</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOCABULARY</span>
                    <span>{metrics?.halstead?.summary?.vocabulary || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOLUME</span>
                    <span>{metrics?.halstead?.summary?.volume || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DIFFICULTY</span>
                    <span>{metrics?.halstead?.summary?.difficulty || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ESTIMATED DEFECTS</span>
                    <span>{metrics?.halstead?.summary?.defects || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Graph Explorer */}
          {activeTab === "graph" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 0 }}>Click on any file node to inspect its incoming/outgoing dependencies and impact analysis scope.</p>
                <DependencyGraph graphData={currentAnalysis.graph} onSelectNode={setSelectedNode} />
              </div>
              <div className="card" style={{ margin: 0, height: "400px", overflowY: "auto" }}>
                {selectedNode ? (
                  <div>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 1rem 0", wordBreak: "break-all", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
                      {selectedNode.split("/").pop()}
                    </h3>
                    <div style={{ fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div>
                        <span className="text-muted">Full Path:</span>
                        <div style={{ wordBreak: "break-all", fontSize: "0.75rem", backgroundColor: "#f9fafb", padding: "0.25rem", border: "1px solid #e5e7eb", marginTop: "0.125rem" }}>
                          {selectedNode}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted" style={{ display: "block" }}>Impact Scope:</span>
                        <span style={{
                          fontWeight: "600",
                          color: selectedNodeImpact?.impactScope === "high" ? "#b91c1c" : "inherit"
                        }}>
                          {selectedNodeImpact?.impactScope?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted" style={{ display: "block" }}>Direct Dependents Count:</span>
                        <strong>{selectedNodeImpact?.directDependents?.length || 0}</strong>
                      </div>
                      <div>
                        <span className="text-muted" style={{ display: "block" }}>Total Impacted Files (Transitive):</span>
                        <strong>{selectedNodeImpact?.affectedCount || 0}</strong>
                      </div>
                      {selectedNodeImpact?.affectedFiles?.length > 0 && (
                        <div>
                          <span className="text-muted">Files affected if changed:</span>
                          <ul style={{ paddingLeft: "1.25rem", margin: "0.25rem 0", fontSize: "0.75rem", maxHeight: "100px", overflowY: "auto" }}>
                            {selectedNodeImpact.affectedFiles.map((file, idx) => (
                              <li key={idx} style={{ wordBreak: "break-all" }}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: "0.875rem" }}>
                    Select a node to inspect details
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Detailed Metrics List */}
          {activeTab === "metrics" && (
            <div className="card">
              <h3 className="title" style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>File metrics detail</h3>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Complexity (Highest Function)</th>
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
                          <td style={{ wordBreak: "break-all", fontWeight: "500" }}>{node.id}</td>
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

          {/* Tab 4: Circular Dependencies */}
          {activeTab === "cycles" && (
            <div className="card">
              <h3 className="title" style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>Circular Dependencies</h3>
              {cycles && cycles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "0.75rem", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: "4px", fontSize: "0.875rem" }}>
                    Warning: {cycles.length} dependency cycles detected. These cycles can affect maintainability and bundling size.
                  </div>
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                    {cycles.map((cycle, index) => (
                      <li
                        key={index}
                        style={{
                          padding: "0.75rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          marginBottom: "0.5rem",
                          backgroundColor: "#f9fafb",
                          fontSize: "0.875rem",
                        }}
                      >
                        <strong>Cycle #{index + 1}:</strong>
                        <div style={{ marginTop: "0.25rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#374151" }}>
                          {Array.isArray(cycle) ? cycle.join(" → ") : (cycle.path ? cycle.path.join(" → ") : "")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted" style={{ fontSize: "0.875rem" }}>No circular dependencies detected. Excellent!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
