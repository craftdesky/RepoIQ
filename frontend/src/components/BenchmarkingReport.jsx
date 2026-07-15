import React, { useMemo } from 'react';

const MATURITY_COLORS = {
  5: '#10b981',
  4: '#3b82f6',
  3: '#f59e0b',
  2: '#ea580c',
  1: '#ef4444',
};

const STATUS_COLORS = {
  excellent: { bg: '#ecfdf5', text: '#065f46', border: '#10b981' },
  good:       { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' },
  acceptable: { bg: '#f0fdfa', text: '#115e59', border: '#14b8a6' },
  concerning: { bg: '#fffbeb', text: '#92400e', border: '#f59e0b' },
  critical:   { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' },
};

const PRIORITY_COLORS = {
  Critical: { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' },
  High:     { bg: '#fff7ed', text: '#9a3412', border: '#ea580c' },
  Medium:   { bg: '#fffbeb', text: '#92400e', border: '#f59e0b' },
  Low:      { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' },
};

const METRIC_LABELS = {
  cyclomaticComplexity: 'Cyclomatic Complexity',
  couplingDensity: 'Coupling Density',
  commentDensity: 'Comment Density',
  cycles: 'Dependency Cycles',
  maintainability: 'Maintainability Index',
};

const METRIC_ORDER = [
  'cyclomaticComplexity',
  'couplingDensity',
  'commentDensity',
  'cycles',
  'maintainability',
];

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.concerning;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        textTransform: 'capitalize',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {priority}
    </span>
  );
}

function DeviationCell({ deviation }) {
  const isPositive = deviation > 0;
  const color = isPositive ? '#ef4444' : '#10b981';
  const prefix = isPositive ? '+' : '';
  return (
    <span style={{ fontWeight: 600, fontSize: 13, color, fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{deviation}%
    </span>
  );
}

function BenchmarkingReport({ benchmarking }) {
  const metrics = useMemo(() => {
    if (!benchmarking?.metrics) return [];
    return METRIC_ORDER
      .filter((key) => benchmarking.metrics[key])
      .map((key) => ({
        key,
        label: METRIC_LABELS[key] || key,
        ...benchmarking.metrics[key],
      }));
  }, [benchmarking]);

  if (!benchmarking) {
    return (
      <div className="alert-info" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>No benchmarking data available.</p>
      </div>
    );
  }

  const { summary, assessments, recommendations } = benchmarking;
  const maturityLevel = assessments?.maturity?.level ?? 1;
  const maturityColor = MATURITY_COLORS[maturityLevel] || MATURITY_COLORS[1];



  return (
    <div>
      {/* ════════════════════════ HEADER ════════════════════════ */}
      <div
        className="feature-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        {/* Maturity Badge */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 16,
            backgroundColor: maturityColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 14px ${maturityColor}33`,
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            L{maturityLevel}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Level {maturityLevel}
          </span>
        </div>

        {/* Status + Description */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {assessments?.maturity?.status || 'Unknown'}
          </div>
          <div className="text-muted" style={{ fontSize: 14, color: '#6b7280' }}>
            {assessments?.maturity?.description}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {assessments?.complexity && (
              <span style={{ fontSize: 13, color: '#374151' }}>
                <span style={{ color: '#9ca3af', marginRight: 4 }}>Complexity:</span>
                {assessments.complexity}
              </span>
            )}
            {assessments?.maintainability && (
              <span style={{ fontSize: 13, color: '#374151' }}>
                <span style={{ color: '#9ca3af', marginRight: 4 }}>Maintainability:</span>
                {assessments.maintainability}
              </span>
            )}
          </div>
        </div>

        {/* Pass Rate */}
        {summary && (
          <div
            style={{
              textAlign: 'center',
              padding: '12px 24px',
              borderRadius: 10,
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
              {summary.passedBenchmarks}/{summary.totalBenchmarks}
            </div>
            <div className="text-muted" style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>
              Benchmarks Passed
            </div>
            <div
              style={{
                marginTop: 8,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#e5e7eb',
                overflow: 'hidden',
                width: 120,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${summary.passRate}%`,
                  borderRadius: 3,
                  backgroundColor:
                    summary.passRate >= 80
                      ? '#10b981'
                      : summary.passRate >= 50
                      ? '#f59e0b'
                      : '#ef4444',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════ BENCHMARK TABLE ════════════════════════ */}
      {metrics.length > 0 && (
        <div className="feature-card" style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 16 }}>Benchmark Metrics</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Metric', 'Value', 'Status', 'Deviation', 'Recommendation'].map((h) => (
                    <th key={h} style={{ whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.key}>
                    <td style={{ fontWeight: 600, color: '#111827' }}>
                      {m.label}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {m.value}
                    </td>
                    <td>
                      <StatusBadge status={m.benchmark} />
                    </td>
                    <td>
                      <DeviationCell deviation={m.deviation} />
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      {m.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════ RECOMMENDATIONS ════════════════════════ */}
      {recommendations && recommendations.length > 0 && (
        <div className="feature-card" style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 16 }}>Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recommendations.map((rec, idx) => {
              const prioColors = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.Medium;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '14px 18px',
                    borderRadius: 8,
                    backgroundColor: '#fafbfc',
                    border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${prioColors.border}`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(3px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    <PriorityBadge priority={rec.priority} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                        {rec.action}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#9ca3af',
                          backgroundColor: '#f3f4f6',
                          padding: '1px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {rec.category}
                      </span>
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}
                    >
                      {rec.details}
                    </div>
                    {rec.impact && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          marginTop: 6,
                          fontStyle: 'italic',
                        }}
                      >
                        Impact: {rec.impact}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BenchmarkingReport;
