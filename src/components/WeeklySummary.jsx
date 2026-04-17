import React from 'react';

export default function WeeklySummary({ summary, isLoading, fs }) {
  if (isLoading) return <WeeklySkeleton />;

  if (!summary) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: 14 * fs }}>
        No summary available for this period.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 4 }}>Weekly Summary</div>
        <div style={{ fontSize: 20 * fs, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{summary.period}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {summary.stats.totalItems} items &middot; {summary.stats.sourcesScanned} sources scanned &middot; Top source: {summary.stats.topSource}
        </div>
      </div>

      {/* Overview */}
      <div style={{ fontSize: 14 * fs, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 32, borderLeft: '2px solid var(--accent)', paddingLeft: 16 }}>
        {summary.overview}
      </div>

      {/* Top Stories */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Top Stories</div>
        {summary.topStories.map((s, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', minWidth: 18 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5 * fs, fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</span>
            </div>
            <div style={{ fontSize: 13 * fs, color: 'var(--text-secondary)', paddingLeft: 26 }}>{s.summary}</div>
          </div>
        ))}
      </div>

      {/* Emerging Themes */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Emerging Themes</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {summary.emergingThemes.map((t, i) => (
            <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <div style={{ fontSize: 13 * fs, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{t.theme}</div>
              <div style={{ fontSize: 12.5 * fs, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{t.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Category Breakdown</div>
        {summary.categoryBreakdown.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 160 }}>{c.category}</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>{c.count}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.highlight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 64px' }}>
      <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 300, height: 24, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 250, height: 12, marginBottom: 32 }} />
      <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 32 }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ width: '100%', height: 50, marginBottom: 12 }} />
      ))}
    </div>
  );
}
