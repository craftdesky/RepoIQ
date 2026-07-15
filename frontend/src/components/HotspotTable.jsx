import React from "react";

const getScoreColorText = (score) => {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#ea580c';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
};

export default function HotspotTable({ files = [], onRowClick }) {
  return (
    <div className="feature-card">
      <h3 className="feature-card-title">Hotspot Table</h3>
      <p className="feature-card-subtitle">Click a row to highlight the file in the graph.</p>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Score</th>
              <th>File</th>
              <th>Reason Tags</th>
              <th style={{ width: "200px" }}>Contributions (C/I/K)</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  <span className="text-muted">No hotspots available.</span>
                </td>
              </tr>
            )}

            {files.map((f) => (
              <tr key={f.id} onClick={() => onRowClick && onRowClick(f.id)}>
                <td style={{ fontWeight: 700, color: getScoreColorText(f.hotspotScore) }}>
                  {f.hotspotScore}
                </td>
                <td className="mono" style={{ wordBreak: "break-all" }}>
                  {f.id}
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {(f.reasonTags || []).map((tag, i) => (
                      <span key={i} className="text-muted" style={{ display: "inline-block", padding: "2px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {`${(f.contributions?.coupling || 0).toFixed(1)} / ${(f.contributions?.impact || 0).toFixed(1)} / ${(f.contributions?.complexity || 0).toFixed(1)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
