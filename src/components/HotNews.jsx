import React from 'react';

export default function HotNews({ items, collapsed, setCollapsed, onScrollToItem, fs }) {
  if (items.length === 0) return null;

  if (collapsed) {
    return (
      <div style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
        padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Hot News — collapsed
        </span>
        <button onClick={() => setCollapsed(false)} style={{ color: 'var(--accent)', fontSize: 11 }}>expand</button>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '12px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Hot News
        </span>
        <button onClick={() => setCollapsed(true)} style={{ color: 'var(--text-muted)', fontSize: 11 }}>collapse &times;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {items.map((item, i) => (
          <button key={item.id} onClick={() => onScrollToItem(item.id)}
            className="hot-card"
            style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg)', transition: 'background 0.12s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.category}</span>
            </div>
            <span style={{
              fontSize: 12 * fs, fontWeight: 500, lineHeight: 1.35, color: 'var(--text-secondary)',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{item.headline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
