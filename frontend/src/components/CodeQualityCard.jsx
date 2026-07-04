import React, { useMemo } from 'react';

const gradeColors = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
  F: '#ef4444',
};

function getBarColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function CodeQualityCard({ codeQuality }) {
  const gradeColor = useMemo(() => {
    if (!codeQuality) return '#3b82f6';
    return gradeColors[codeQuality.summary.grade] || '#3b82f6';
  }, [codeQuality]);

  const breakdownEntries = useMemo(() => {
    if (!codeQuality) return [];
    return Object.entries(codeQuality.breakdown).map(([key, value]) => ({
      name: capitalize(key),
      score: value.score,
      weight: value.weight,
      color: getBarColor(value.score),
    }));
  }, [codeQuality]);

  if (!codeQuality) {
    return (
      <div style={styles.card}>
        <div style={styles.nullState}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.35 }}>📊</div>
          <span className="text-muted" style={{ fontSize: 14 }}>
            No code quality data available
          </span>
        </div>
      </div>
    );
  }

  const { summary, strengths, weaknesses } = codeQuality;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            style={{
              ...styles.gradeBadge,
              backgroundColor: gradeColor,
            }}
          >
            {summary.grade}
          </div>
          <div style={styles.headerText}>
            <div style={styles.score}>{summary.overallQualityScore}</div>
            <div className="text-muted" style={styles.rating}>
              {summary.rating}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Quality Breakdown</div>
        <div style={styles.breakdownList}>
          {breakdownEntries.map((entry) => (
            <div key={entry.name} style={styles.breakdownRow}>
              <div style={styles.breakdownLabel}>
                <span>{entry.name}</span>
                <span className="text-muted" style={styles.weightLabel}>
                  {Math.round(entry.weight * 100)}%
                </span>
              </div>
              <div style={styles.barContainer}>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${entry.score}%`,
                      backgroundColor: entry.color,
                    }}
                  />
                </div>
                <span style={styles.barScore}>{entry.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={styles.panels}>
        <div style={styles.strengthsPanel}>
          <div style={styles.panelTitle}>Strengths</div>
          {strengths.map((item, i) => (
            <div key={i} style={styles.panelItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>{item}</span>
            </div>
          ))}
          {strengths.length === 0 && (
            <span className="text-muted" style={{ fontSize: 13 }}>
              None identified
            </span>
          )}
        </div>
        <div style={styles.weaknessesPanel}>
          <div style={styles.panelTitle}>Weaknesses</div>
          {weaknesses.map((item, i) => (
            <div key={i} style={styles.panelItem}>
              <span style={styles.warnIcon}>⚠</span>
              <span>{item}</span>
            </div>
          ))}
          {weaknesses.length === 0 && (
            <span className="text-muted" style={{ fontSize: 13 }}>
              None identified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '1.5rem',
  },
  nullState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    flexShrink: 0,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
  },
  score: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
    color: '#111827',
  },
  rating: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#6b7280',
    marginBottom: 12,
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  breakdownRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  breakdownLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: 400,
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.4s ease',
  },
  barScore: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    minWidth: 28,
    textAlign: 'right',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  strengthsPanel: {
    borderLeft: '4px solid #10b981',
    paddingLeft: 14,
  },
  weaknessesPanel: {
    borderLeft: '4px solid #f59e0b',
    paddingLeft: 14,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 8,
  },
  panelItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  checkIcon: {
    color: '#10b981',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  },
  warnIcon: {
    color: '#f59e0b',
    flexShrink: 0,
    marginTop: 1,
  },
};

export default CodeQualityCard;
