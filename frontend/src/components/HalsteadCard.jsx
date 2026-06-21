import React from "react";

export default function HalsteadCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="card">
      <h3 className="title">Halstead Repository Summary</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOCABULARY</span>
          <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{summary.vocabulary || 0}</span>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>VOLUME</span>
          <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{summary.volume || 0}</span>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>DIFFICULTY</span>
          <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{summary.difficulty || 0}</span>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>ESTIMATED DEFECTS</span>
          <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>{summary.defects || 0}</span>
        </div>
      </div>
    </div>
  );
}
