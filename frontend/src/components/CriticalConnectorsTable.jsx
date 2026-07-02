import React from "react";

export default function CriticalConnectorsTable({ connectors, onRowClick }) {
  if (!connectors) return null;

  const ap = connectors.articulationPoints || [];
  const bet = connectors.betweenness || [];

  return (
    <div className="card">
      <h3 className="title">Critical Connectors — Details</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>File</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Affected %</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Betweenness</th>
            </tr>
          </thead>
          <tbody>
            {ap.map((a) => {
              const bscore = (bet.find((b) => b.id === a.id) || {}).score || 0;
              return (
                <tr key={a.id} onClick={() => onRowClick && onRowClick(a.id)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
                  <td style={{ padding: "0.5rem", borderTop: "1px solid #f3f4f6", wordBreak: "break-all" }}>{a.id}</td>
                  <td style={{ padding: "0.5rem", borderTop: "1px solid #f3f4f6", textAlign: "right" }}>{a.percentAffected}%</td>
                  <td style={{ padding: "0.5rem", borderTop: "1px solid #f3f4f6", textAlign: "right" }}>{bscore.toFixed(2)}</td>
                </tr>
              );
            })}
            {ap.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "0.75rem", color: "#6b7280" }}>No articulation points found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
