import React from "react";

export default function HotspotSettings({ config, onChange, onReanalyze, loading }) {
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
    <div className="feature-card" style={{ display: "flex", flexDirection: "column" }}>
      <h3 className="feature-card-title">Hotspot Settings</h3>
      <p className="feature-card-subtitle">
        Tune weights & thresholds for scoring.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "12px 0" }}>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>Coupling weight</span>
          <input type="number" step="0.05" className="form-control" value={config.weights?.coupling ?? 0.35} onChange={(e) => handleNumberChange("weights.coupling", e.target.value)} />
        </label>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>Impact weight</span>
          <input type="number" step="0.05" className="form-control" value={config.weights?.impact ?? 0.35} onChange={(e) => handleNumberChange("weights.impact", e.target.value)} />
        </label>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>Complexity weight</span>
          <input type="number" step="0.05" className="form-control" value={config.weights?.complexity ?? 0.25} onChange={(e) => handleNumberChange("weights.complexity", e.target.value)} />
        </label>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>Cycle penalty</span>
          <input type="number" step="0.05" className="form-control" value={config.weights?.cycle ?? 0.05} onChange={(e) => handleNumberChange("weights.cycle", e.target.value)} />
        </label>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>High threshold</span>
          <input type="number" step="0.05" className="form-control" value={config.thresholds?.high ?? 0.6} onChange={(e) => handleNumberChange("thresholds.high", e.target.value)} />
        </label>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "12px" }}>
          <span>Critical threshold</span>
          <input type="number" step="0.05" className="form-control" value={config.thresholds?.critical ?? 0.8} onChange={(e) => handleNumberChange("thresholds.critical", e.target.value)} />
        </label>
      </div>

      {onReanalyze && (
        <div style={{ marginTop: "auto", paddingTop: "16px" }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onReanalyze}
            disabled={loading}
          >
            {loading ? "Re-running..." : "Re-run Analysis"}
          </button>
        </div>
      )}
    </div>
  );
}
