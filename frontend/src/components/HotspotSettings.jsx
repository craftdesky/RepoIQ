import React from "react";

export default function HotspotSettings({ config, onChange }) {
  const handleNumberChange = (key, value) => {
    const next = Number(value);
    const numericValue = Number.isFinite(next) ? next : 0;

    if (key.startsWith("weights.")) {
      const subKey = key.split(".")[1];
      onChange({
        weights: {
          ...(config.weights || {}),
          [subKey]: numericValue,
        },
      });
      return;
    }

    if (key.startsWith("thresholds.")) {
      const subKey = key.split(".")[1];
      onChange({
        thresholds: {
          ...(config.thresholds || {}),
          [subKey]: numericValue,
        },
      });
      return;
    }

    onChange({ [key]: numericValue });
  };

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <h3 className="title">Hotspot Settings</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        Tune the hotspot model and immediately recalculate the scores.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>Coupling weight</span>
          <input type="number" step="0.05" value={config.weights?.coupling ?? 0.35} onChange={(e) => handleNumberChange("weights.coupling", e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>Impact weight</span>
          <input type="number" step="0.05" value={config.weights?.impact ?? 0.35} onChange={(e) => handleNumberChange("weights.impact", e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>Complexity weight</span>
          <input type="number" step="0.05" value={config.weights?.complexity ?? 0.25} onChange={(e) => handleNumberChange("weights.complexity", e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>Cycle penalty</span>
          <input type="number" step="0.05" value={config.weights?.cycle ?? 0.05} onChange={(e) => handleNumberChange("weights.cycle", e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>High threshold</span>
          <input type="number" step="0.05" value={config.thresholds?.high ?? 0.6} onChange={(e) => handleNumberChange("thresholds.high", e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
          <span>Critical threshold</span>
          <input type="number" step="0.05" value={config.thresholds?.critical ?? 0.8} onChange={(e) => handleNumberChange("thresholds.critical", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
