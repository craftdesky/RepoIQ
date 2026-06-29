import React, { useState, useMemo } from 'react';

export default function FolderGraphView({ folderGraph }) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [sortBy, setSortBy] = useState("fileCount");

  if (!folderGraph || !folderGraph.nodes) {
    return <div className="text-muted">No folder graph data available.</div>;
  }

  const { nodes, edges } = folderGraph;

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      if (sortBy === "fileCount") return b.fileCount - a.fileCount;
      if (sortBy === "totalLines") return b.totalLines - a.totalLines;
      if (sortBy === "coupling") return (b.externalOutgoing + b.externalIncoming) - (a.externalOutgoing + a.externalIncoming);
      return a.id.localeCompare(b.id);
    });
  }, [nodes, sortBy]);

  const selectedOutgoing = useMemo(() => {
    if (!selectedFolder) return [];
    return edges.filter(e => e.from === selectedFolder).sort((a, b) => b.weight - a.weight);
  }, [edges, selectedFolder]);

  const selectedIncoming = useMemo(() => {
    if (!selectedFolder) return [];
    return edges.filter(e => e.to === selectedFolder).sort((a, b) => b.weight - a.weight);
  }, [edges, selectedFolder]);

  const selectedNode = nodes.find(n => n.id === selectedFolder);

  return (
    <div className="card">
      <h3 className="title">Architecture (Folders)</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        A macro-level view of how directories depend on each other. Select a folder to inspect its inter-folder coupling.
      </p>

      {/* Sort controls */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "500" }}>SORT BY:</span>
        {["fileCount", "totalLines", "coupling", "name"].map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              border: sortBy === key ? "1px solid #2563eb" : "1px solid #d1d5db",
              backgroundColor: sortBy === key ? "#eff6ff" : "#fff",
              color: sortBy === key ? "#2563eb" : "#374151",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontWeight: sortBy === key ? "600" : "400"
            }}
          >
            {key === "fileCount" ? "Files" : key === "totalLines" ? "Lines" : key === "coupling" ? "Coupling" : "Name"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem" }}>
        {/* Left: Folder List */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", maxHeight: "600px", overflowY: "auto" }}>
          {sortedNodes.map(folder => (
            <div
              key={folder.id}
              onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
              style={{
                padding: "0.75rem",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                backgroundColor: selectedFolder === folder.id ? "#eff6ff" : "transparent",
                transition: "background-color 0.15s"
              }}
              onMouseEnter={(e) => { if (selectedFolder !== folder.id) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
              onMouseLeave={(e) => { if (selectedFolder !== folder.id) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ fontWeight: "500", fontSize: "0.875rem", color: "#111827", wordBreak: "break-all" }}>
                {folder.id}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.75rem", color: "#6b7280" }}>
                <span>{folder.fileCount} files</span>
                <span>{folder.totalLines} lines</span>
                <span style={{ color: (folder.externalOutgoing + folder.externalIncoming) > 0 ? "#ea580c" : "#6b7280" }}>
                  {folder.externalOutgoing + folder.externalIncoming} links
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail Panel */}
        <div>
          {selectedNode ? (
            <div>
              {/* Folder Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", textAlign: "center" }}>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.7rem", marginBottom: "0.15rem" }}>FILES</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{selectedNode.fileCount}</span>
                </div>
                <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", textAlign: "center" }}>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.7rem", marginBottom: "0.15rem" }}>LINES</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{selectedNode.totalLines}</span>
                </div>
                <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", textAlign: "center" }}>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.7rem", marginBottom: "0.15rem" }}>INTERNAL</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>{selectedNode.internalLinks}</span>
                </div>
                <div style={{ padding: "0.75rem", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "6px", textAlign: "center" }}>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.7rem", marginBottom: "0.15rem" }}>OUTGOING</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "600", color: "#ea580c" }}>{selectedNode.externalOutgoing}</span>
                </div>
                <div style={{ padding: "0.75rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", textAlign: "center" }}>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.7rem", marginBottom: "0.15rem" }}>INCOMING</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "600", color: "#2563eb" }}>{selectedNode.externalIncoming}</span>
                </div>
              </div>

              {/* Depends On */}
              <DependencySection
                title="Depends On (Outgoing)"
                edges={selectedOutgoing}
                direction="to"
                emptyMsg="This folder has no outgoing dependencies."
                headerColor="#ea580c"
                headerBg="#fff7ed"
                borderColor="#fed7aa"
              />

              {/* Depended By */}
              <DependencySection
                title="Depended By (Incoming)"
                edges={selectedIncoming}
                direction="from"
                emptyMsg="No other folders depend on this one."
                headerColor="#2563eb"
                headerBg="#eff6ff"
                borderColor="#bfdbfe"
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#9ca3af", fontSize: "0.875rem" }}>
              Select a folder from the list to inspect its dependencies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DependencySection({ title, edges, direction, emptyMsg, headerColor, headerBg, borderColor }) {
  const [expandedEdge, setExpandedEdge] = useState(null);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", color: "#37352F" }}>{title}</h4>
      {edges.length > 0 ? (
        <div style={{ border: `1px solid ${borderColor}`, borderRadius: "6px" }}>
          <div style={{ padding: "0.5rem 0.75rem", backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}`, borderTopLeftRadius: "5px", borderTopRightRadius: "5px", display: "grid", gridTemplateColumns: "1fr 80px 80px", fontWeight: "600", fontSize: "0.75rem", color: headerColor }}>
            <span>FOLDER</span>
            <span style={{ textAlign: "center" }}>STRENGTH</span>
            <span style={{ textAlign: "center" }}>FILES</span>
          </div>
          {edges.map((edge, idx) => {
            const targetFolder = direction === "to" ? edge.to : edge.from;
            const isExpanded = expandedEdge === idx;
            return (
              <React.Fragment key={idx}>
                <div
                  onClick={() => setExpandedEdge(isExpanded ? null : idx)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderBottom: idx < edges.length - 1 || isExpanded ? `1px solid ${borderColor}` : "none",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 80px",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    backgroundColor: isExpanded ? "#f9fafb" : "transparent",
                    transition: "background-color 0.15s"
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span style={{ wordBreak: "break-all", color: "#374151" }}>{targetFolder}</span>
                  <span style={{ textAlign: "center", fontWeight: "600", color: headerColor }}>{edge.weight}</span>
                  <span style={{ textAlign: "center", color: "#6b7280" }}>{edge.files.length}</span>
                </div>
                {isExpanded && (
                  <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", borderBottom: idx < edges.length - 1 ? `1px solid ${borderColor}` : "none" }}>
                    <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.8rem" }}>
                      {edge.files.map((f, fi) => (
                        <li key={fi} style={{ padding: "0.25rem 0", color: "#4b5563", wordBreak: "break-all" }}>
                          <span style={{ color: "#9ca3af" }}>{f.from}</span>
                          <span style={{ margin: "0 0.5rem", color: "#d1d5db" }}>→</span>
                          <span>{f.to}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>{emptyMsg}</p>
      )}
    </div>
  );
}
