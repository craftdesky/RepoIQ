import React from "react";

const getRiskCategory = (score) => {
  if (score >= 80) return 'Critical Risk';
  if (score >= 60) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
};

const getScoreColor = (score) => {
  if (score >= 80) return { text: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
  if (score >= 60) return { text: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
  if (score >= 40) return { text: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
  return { text: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
};

const getRiskBadgeStyle = (category) => {
  const map = {
    'Low Risk': { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    'Medium Risk': { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    'High Risk': { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    'Critical Risk': { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  };
  const c = map[category] || map['Medium Risk'];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 14px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    lineHeight: '1.4',
  };
};

export default function HotspotCard({ hotspots }) {
  if (!hotspots) return null;

  const files = Array.isArray(hotspots.files) ? hotspots.files : (Array.isArray(hotspots) ? hotspots : []);
  const count = files.length;
  const avg = count ? Math.round(files.reduce((s, f) => s + (f.hotspotScore || 0), 0) / count) : 0;
  const critical = files.filter((f) => (f.hotspotScore || 0) >= 80).length;
  const high = files.filter((f) => (f.hotspotScore || 0) >= 60).length;

  const scoreColor = getScoreColor(avg);

  return (
    <div className="feature-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 className="feature-card-title">Hotspot Summary</h3>
      <p className="feature-card-subtitle">Average risk across analyzed files.</p>

      {/* Score Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            backgroundColor: scoreColor.bg,
            border: `2px solid ${scoreColor.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '28px', fontWeight: 800, color: scoreColor.text, lineHeight: 1 }}>
            {avg}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
              Average Score
            </span>
            <span style={getRiskBadgeStyle(getRiskCategory(avg))}>{getRiskCategory(avg)}</span>
          </div>
          <span className="text-muted" style={{ fontSize: '12px' }}>
            Scale 0–100 (higher = higher risk)
          </span>
        </div>
      </div>

      {/* Grid boxes */}
      <div className="stat-grid stat-grid-2" style={{ marginTop: 'auto', gap: '12px', paddingTop: '16px' }}>
        <div className="stat-box" style={{ padding: '12px' }}>
          <div className="stat-box-label" style={{ fontSize: '11px' }}>AVERAGE SCORE</div>
          <div className="stat-box-value" style={{ fontSize: '20px' }}>{avg}</div>
        </div>
        <div className="stat-box" style={{ padding: '12px' }}>
          <div className="stat-box-label" style={{ fontSize: '11px' }}>FILES ANALYZED</div>
          <div className="stat-box-value" style={{ fontSize: '20px' }}>{count}</div>
        </div>
        <div className="stat-box" style={{ padding: '12px', borderLeft: '3px solid #ef4444' }}>
          <div className="stat-box-label" style={{ fontSize: '11px' }}>CRITICAL (&gt;=80)</div>
          <div className="stat-box-value" style={{ color: '#ef4444', fontSize: '20px' }}>{critical}</div>
        </div>
        <div className="stat-box" style={{ padding: '12px', borderLeft: '3px solid #ea580c' }}>
          <div className="stat-box-label" style={{ fontSize: '11px' }}>HIGH (&gt;=60)</div>
          <div className="stat-box-value" style={{ color: '#ea580c', fontSize: '20px' }}>{high}</div>
        </div>
      </div>
    </div>
  );
}

export function TopHotspotsCard({ hotspots }) {
  if (!hotspots) return null;

  const files = Array.isArray(hotspots.files) ? hotspots.files : (Array.isArray(hotspots) ? hotspots : []);
  const top = files.slice(0, 5);

  return (
    <div className="feature-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 className="feature-card-title">Top Hotspots</h3>
      <p className="feature-card-subtitle">Highest risk files in the repository.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {top.map((f) => {
          const fScoreColor = getScoreColor(f.hotspotScore).text;
          return (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <span className="mono" style={{ fontSize: '13px', wordBreak: 'break-all' }}>{f.id.split("/").pop()}</span>
              <strong style={{ color: fScoreColor, fontSize: '15px', flexShrink: 0, marginLeft: '8px' }}>{f.hotspotScore}</strong>
            </div>
          );
        })}
        {top.length === 0 && <span className="text-muted" style={{ marginTop: 'auto', padding: '12px 0' }}>No hotspots detected</span>}
      </div>
    </div>
  );
}
