import React from 'react';
import { CATEGORIES } from '../lib/constants';

function SidebarItem({ label, count, active, onClick, fs }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', padding: '6px 16px 6px 12px', fontSize: 12.5 * fs,
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      background: active ? 'var(--accent-dim)' : 'transparent',
      transition: 'all 0.1s',
    }}>
      <span style={{ textWrap: 'pretty' }}>{label}</span>
      {count > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      )}
    </button>
  );
}

export default function Sidebar({ activeCategory, setActiveCategory, categoryCounts, fs }) {
  return (
    <nav className="sidebar" style={{
      width: 192, minWidth: 192, borderRight: '1px solid var(--border)',
      background: 'var(--bg)', overflowY: 'auto', padding: '12px 0', flexShrink: 0,
    }}>
      <SidebarItem
        label="All"
        count={categoryCounts['All'] || 0}
        active={activeCategory === 'All'}
        onClick={() => setActiveCategory('All')}
        fs={fs}
      />
      {CATEGORIES.map((cat) => (
        <SidebarItem
          key={cat}
          label={cat}
          count={categoryCounts[cat] || 0}
          active={activeCategory === cat}
          onClick={() => setActiveCategory(cat)}
          fs={fs}
        />
      ))}
    </nav>
  );
}
