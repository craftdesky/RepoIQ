import React from "react";

export default function HotspotCard({ hotspots }) {
  if (!hotspots) return null;

  const files = Array.isArray(hotspots.files) ? hotspots.files : (Array.isArray(hotspots) ? hotspots : []);
  const count = files.length;
  const avg = count ? Math.round(files.reduce((s, f) => s + (f.hotspotScore || 0), 0) / count) : 0;
  const critical = files.filter((f) => (f.hotspotScore || 0) >= 80).length;
  const high = files.filter((f) => (f.hotspotScore || 0) >= 60).length;

  const top = files.slice(0, 5);

  return (
    <div className="card">
      <h3 className="title">Hotspot Summary</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>AVERAGE SCORE</span>
          <strong style={{ fontSize: "1.25rem" }}>{avg}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>FILES ANALYZED</span>
          <strong style={{ fontSize: "1.25rem" }}>{count}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>{'CRITICAL (>=80)'}</span>
          <strong style={{ fontSize: "1.25rem", color: "#ef4444" }}>{critical}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>{'HIGH (>=60)'}</span>
          <strong style={{ fontSize: "1.25rem", color: "#f97316" }}>{high}</strong>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0" }}>Top Hotspots</h4>
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {top.map((f) => (
            <li key={f.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#2563eb", wordBreak: "break-all" }}>{f.id.split("/").pop()}</span>
              <strong>{f.hotspotScore}</strong>
            </li>
          ))}
          {top.length === 0 && <li style={{ color: "#6b7280" }}>No hotspots detected</li>}
        </ul>
      </div>
    </div>
  );
}
