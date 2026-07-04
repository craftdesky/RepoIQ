import React, { useMemo } from 'react';

const getScoreColor = (score) => {
  if (score <= 20) return { text: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
  if (score <= 40) return { text: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
  if (score <= 60) return { text: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
  return { text: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
};

const getBarColor = (score) => {
  if (score <= 20) return '#10b981';
  if (score <= 50) return '#f59e0b';
  return '#ef4444';
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

const getPriorityBadgeStyle = (priority) => {
  const map = {
    Critical: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    High: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    Medium: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    Low: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  };
  const c = map[priority] || map['Medium'];
  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    lineHeight: '1.5',
  };
};

const CATEGORY_LABELS = {
  complexity: 'Complexity',
  coupling: 'Coupling',
  cycles: 'Dependency Cycles',
  documentation: 'Documentation',
  maintainability: 'Maintainability',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '20px',
};

const sectionTitleStyle = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '16px',
  letterSpacing: '0.01em',
};

export default function TechnicalDebtReport({ technicalDebt }) {
  const sortedHotspots = useMemo(() => {
    if (!technicalDebt?.debtHotspots) return [];
    return [...technicalDebt.debtHotspots].sort((a, b) => b.debtScore - a.debtScore);
  }, [technicalDebt]);

  const refCandidateMap = useMemo(() => {
    if (!technicalDebt?.refactoringCandidates) return {};
    const map = {};
    technicalDebt.refactoringCandidates.forEach((c) => {
      map[c.file] = c.priority;
    });
    return map;
  }, [technicalDebt]);

  if (!technicalDebt) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.45 }}>📊</div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
          No Technical Debt Data
        </div>
        <div className="text-muted" style={{ fontSize: '13px' }}>
          Run an analysis to generate the technical debt report.
        </div>
      </div>
    );
  }

  const { summary, breakdown, riskDistribution } = technicalDebt;
  const scoreColor = getScoreColor(summary.technicalDebtScore);

  const riskCards = [
    { label: 'Low', count: riskDistribution.low, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Medium', count: riskDistribution.medium, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { label: 'High', count: riskDistribution.high, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'Critical', count: riskDistribution.critical, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Score Hero */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            backgroundColor: scoreColor.bg,
            border: `2px solid ${scoreColor.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: 800, color: scoreColor.text, lineHeight: 1 }}>
            {summary.technicalDebtScore}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Technical Debt Score
            </span>
            <span style={getRiskBadgeStyle(summary.riskCategory)}>{summary.riskCategory}</span>
          </div>
          <span className="text-muted" style={{ fontSize: '13px' }}>
            Across {summary.totalFiles} analyzed files · Scale 0–100 (lower is better)
          </span>
        </div>
      </div>

      {/* Breakdown + Risk Distribution row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Breakdown */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Debt Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(breakdown).map(([key, { score, weight }]) => {
              const barColor = getBarColor(score);
              return (
                <div key={key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '5px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                      {CATEGORY_LABELS[key] || key}
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: barColor }}>{score}</span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {Math.round(weight * 100)}% weight
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '7px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(score, 100)}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Risk Distribution</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {riskCards.map((r) => (
              <div
                key={r.label}
                style={{
                  backgroundColor: r.bg,
                  border: `1px solid ${r.border}`,
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '26px', fontWeight: 800, color: r.color, lineHeight: 1.1 }}>
                  {r.count}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: r.color, marginTop: '4px' }}>
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotspots Table */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Debt Hotspots</div>
        <div
          style={{
            maxHeight: '350px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f9fafb',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                >
                  File
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '10px 14px',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                    width: '110px',
                  }}
                >
                  Debt Score
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '10px 14px',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                    width: '110px',
                  }}
                >
                  Priority
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHotspots.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}
                  >
                    No hotspots detected.
                  </td>
                </tr>
              ) : (
                sortedHotspots.map((h, i) => {
                  const priority = refCandidateMap[h.file] || (h.debtScore > 60 ? 'Critical' : h.debtScore > 40 ? 'High' : 'Medium');
                  const sc = getScoreColor(h.debtScore);
                  return (
                    <tr
                      key={`${h.file}-${i}`}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                          fontSize: '12px',
                          color: '#1f2937',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '0',
                        }}
                        title={h.file}
                      >
                        {h.file}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: sc.text, fontSize: '13px' }}>
                          {h.debtScore}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={getPriorityBadgeStyle(priority)}>{priority}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
