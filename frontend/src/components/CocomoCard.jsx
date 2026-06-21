import React from "react";

export default function CocomoCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="card">
      <h3 className="title">COCOMO Estimates</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>EFFORT ESTIMATE</span>
          <strong style={{ fontSize: "1.25rem" }}>{summary.effortPersonMonths || 0} PM</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DEV TIME</span>
          <strong style={{ fontSize: "1.25rem" }}>{summary.developmentTimeMonths || 0} Mos</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>EST. TEAM SIZE</span>
          <strong style={{ fontSize: "1.25rem" }}>{summary.averageTeamSize || 0} Devs</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>KILOLINES OF CODE</span>
          <strong style={{ fontSize: "1.25rem" }}>{summary.kloc || 0} KLOC</strong>
        </div>
      </div>
    </div>
  );
}
