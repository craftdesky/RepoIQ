import React from "react";

export default function CyclomaticCard({ summary, files }) {
  if (!summary) return null;

  const avg = summary.averageComplexity || 0;
  const totalFuncs = summary.functionCount || 0;
  const totalComplexity = summary.totalComplexity || 0;

  let highest = 0;
  if (Array.isArray(files) && files.length > 0) {
    highest = files.reduce((m, f) => {
      const v = (f.metrics && f.metrics.summary && f.metrics.summary.highestComplexity) || 0;
      return Math.max(m, v);
    }, 0);
  }

  return (
    <div className="card">
      <h3 className="title">Cyclomatic Complexity</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>AVERAGE CC</span>
          <strong style={{ fontSize: "1.25rem" }}>{avg}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL FUNCTIONS</span>
          <strong style={{ fontSize: "1.25rem" }}>{totalFuncs}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>TOTAL COMPLEXITY</span>
          <strong style={{ fontSize: "1.25rem" }}>{totalComplexity}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.75rem", display: "block" }}>HIGHEST FN CC</span>
          <strong style={{ fontSize: "1.25rem" }}>{highest}</strong>
        </div>
      </div>
    </div>
  );
}
