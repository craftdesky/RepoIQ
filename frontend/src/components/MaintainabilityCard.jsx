import React, { useState, useMemo } from 'react';

const LEVEL_COLORS = {
  excellent: '#232322',
  good: '#52514E',
  concerning: '#878682',
  critical: '#B5B3AD',
};

function getScoreColor(score) {
  if (score >= 70) return '#232322';
  if (score >= 50) return '#52514E';
  if (score >= 35) return '#878682';
  return '#B5B3AD';
}

function getHeaderColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#3b82f6';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

const LEVEL_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  concerning: 'Concerning',
  critical: 'Critical',
};

function MaintainabilityCard({ maintainability }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const sortedFiles = useMemo(() => {
    if (!maintainability?.files) return [];
    return [...maintainability.files].sort(
      (a, b) => a.maintainabilityIndex - b.maintainabilityIndex
    );
  }, [maintainability]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return sortedFiles;
    const q = searchQuery.toLowerCase();
    return sortedFiles.filter((f) => f.file.toLowerCase().includes(q));
  }, [sortedFiles, searchQuery]);

  if (!maintainability) {
    return <div className="text-muted">No maintainability data available.</div>;
  }

  const { summary } = maintainability;
  const { distribution } = summary;
  const total = summary.totalFiles || 1;

  return (
    <div className="feature-card">
      {/* ── TOP SECTION ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: '1.25rem',
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1,
            color: getHeaderColor(summary.averageMaintainability),
          }}
        >
          {summary.averageMaintainability.toFixed(1)}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: getHeaderColor(summary.averageMaintainability) }}>
            {summary.category}
          </span>
          <span className="text-muted" style={{ fontSize: 13 }}>
            {summary.totalFiles} file{summary.totalFiles !== 1 ? 's' : ''} analyzed
          </span>
        </div>
      </div>

      {/* ── DISTRIBUTION SECTION ── */}
      <div
        style={{
          display: 'flex',
          borderRadius: 6,
          overflow: 'hidden',
          height: 28,
          marginBottom: 8,
        }}
      >
        {['excellent', 'good', 'concerning', 'critical'].map((level) => {
          const count = distribution[level] || 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={level}
              style={{
                width: `${pct}%`,
                backgroundColor: LEVEL_COLORS[level],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                minWidth: 32,
                transition: 'width 0.3s ease',
              }}
              title={`${LEVEL_LABELS[level]}: ${count}`}
            >
              {pct >= 10 ? count : ''}
            </div>
          );
        })}
      </div>

      {/* Distribution legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        {['excellent', 'good', 'concerning', 'critical'].map((level) => (
          <div
            key={level}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: LEVEL_COLORS[level],
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              {LEVEL_LABELS[level]}
            </span>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {distribution[level] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* ── FILE LIST SECTION ── */}
      <input
        type="text"
        placeholder="Search files…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="form-control"
        style={{ marginBottom: 12 }}
      />

      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th style={{ width: 100 }}>MI Score</th>
              <th style={{ width: 150 }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{ padding: '20px 12px', textAlign: 'center' }}
                >
                  <span className="text-muted">No files match your search.</span>
                </td>
              </tr>
            ) : (
              filteredFiles.map((f, idx) => (
                <tr
                  key={f.file}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ wordBreak: 'break-all' }} className="mono">
                    {f.file}
                  </td>
                  <td
                    style={{
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: getScoreColor(f.maintainabilityIndex),
                    }}
                  >
                    {f.maintainabilityIndex.toFixed(1)}
                  </td>
                  <td>
                    {f.category}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MaintainabilityCard;
