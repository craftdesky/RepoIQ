import React, { useState, useMemo } from "react";

export default function PathExplorer({ graph, onSelectNode, selectedNode }) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const nodes = useMemo(() => {
    return graph && Array.isArray(graph.nodes) ? graph.nodes : [];
  }, [graph]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !target) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("http://localhost:5000/api/paths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          graph,
          startId: source,
          targetId: target,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPath = (pathArray) => {
    return (
      <div className="cycle-path" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
        {pathArray.map((nodeId, idx) => (
          <React.Fragment key={`${nodeId}-${idx}`}>
            <span
              onClick={() => onSelectNode(nodeId)}
              style={{
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                backgroundColor: selectedNode === nodeId ? "#bfdbfe" : "#f3f4f6",
                borderRadius: "4px",
                border: selectedNode === nodeId ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                color: "#1e3a8a",
                fontWeight: "500",
                fontSize: "0.875rem",
                transition: "all 0.2s"
              }}
            >
              {nodeId.split("/").pop()}
            </span>
            {idx < pathArray.length - 1 && (
              <span style={{ color: "#9ca3af" }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <h3 className="title">Dependency Path Explorer</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Discover how two files or modules are connected. Select a source and a target to trace the dependency path between them.
      </p>

      <form onSubmit={handleSearch} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end", marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Source File</label>
          <select 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "#fff" }}
            required
          >
            <option value="" disabled>Select a file...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Target File</label>
          <select 
            value={target} 
            onChange={(e) => setTarget(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "#fff" }}
            required
          >
            <option value="" disabled>Select a file...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
          </select>
        </div>

        <button type="submit" className="analyze-btn" disabled={loading || !source || !target}>
          {loading ? "Searching..." : "Find Paths"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {results.pathCount === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: "6px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>No dependency path found between these files.</p>
            </div>
          ) : (
            <>
              {results.shortestPath && (
                <div style={{ padding: "1.25rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#166534", fontSize: "1rem" }}>Shortest Path (Length: {results.shortestPath.length})</h4>
                  {renderPath(results.shortestPath.path)}
                </div>
              )}

              {results.paths && results.paths.length > 1 && (
                <div>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "1rem" }}>Alternative Paths ({results.paths.length - 1} found)</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {results.paths.filter(p => !results.shortestPath || p.path.join() !== results.shortestPath.path.join()).map((p, idx) => (
                      <li key={idx} style={{ padding: "1rem", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>PATH LENGTH: {p.length}</div>
                        {renderPath(p.path)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
