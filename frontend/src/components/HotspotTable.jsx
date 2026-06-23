import React from "react";

export default function HotspotTable({ files = [], onRowClick }) {
  return (
    <div className="card">
      <h3 className="title">Hotspot Table</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Click a row to highlight the file in the graph.</p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>Score</th>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>File</th>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>Reason Tags</th>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>Contributions (C/I/K)</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "1rem", color: "#6b7280" }}>No hotspots available.</td>
              </tr>
            )}

            {files.map((f) => (
              <tr key={f.id} onClick={() => onRowClick && onRowClick(f.id)} style={{ cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem", fontWeight: 700 }}>{f.hotspotScore}</td>
                <td style={{ padding: "0.75rem", wordBreak: "break-all", color: "#2563eb" }}>{f.id}</td>
                <td style={{ padding: "0.75rem" }}>{(f.reasonTags || []).join(", ")}</td>
                <td style={{ padding: "0.75rem" }}>{`${(f.contributions?.coupling || 0).toFixed(1)} / ${(f.contributions?.impact || 0).toFixed(1)} / ${(f.contributions?.complexity || 0).toFixed(1)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
