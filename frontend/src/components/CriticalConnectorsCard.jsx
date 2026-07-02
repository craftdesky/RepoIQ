import React from "react";

export default function CriticalConnectorsCard({ connectors }) {
  if (!connectors) return null;

  const summary = connectors.summary || {};
  const topAP = (connectors.articulationPoints || []).slice(0, 3);
  const topBridges = (connectors.bridges || []).slice(0, 3);

  return (
    <div className="card">
      <h3 className="title">Critical Connectors</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>NODES</span>
          <strong style={{ fontSize: "1.25rem" }}>{summary.nodeCount || 0}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ARTICULATION POINTS</span>
          <strong style={{ fontSize: "1.25rem", color: "#ef4444" }}>{summary.articulationCount || 0}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>BRIDGES</span>
          <strong style={{ fontSize: "1.25rem", color: "#f97316" }}>{summary.bridgeCount || 0}</strong>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0" }}>Top Articulation Points</h4>
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {topAP.map((a) => (
            <li key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#2563eb", wordBreak: "break-all" }}>{a.id.split("/").pop()}</span>
              <strong>{a.percentAffected}%</strong>
            </li>
          ))}
          {topAP.length === 0 && <li style={{ color: "#6b7280" }}>No articulation points detected</li>}
        </ul>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0" }}>Top Bridges</h4>
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {topBridges.map((b, i) => (
            <li key={`${b.from}-${b.to}-${i}`} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#2563eb", wordBreak: "break-all" }}>{b.from.split("/").pop()} → {b.to.split("/").pop()}</span>
              <strong>bridge</strong>
            </li>
          ))}
          {topBridges.length === 0 && <li style={{ color: "#6b7280" }}>No bridges detected</li>}
        </ul>
      </div>
    </div>
  );
}
