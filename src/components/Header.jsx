import React from 'react';

const VIEW_MODES = [
  ['today', 'Today'],
  ['thisWeek', 'This Week'],
  ['lastWeek', 'Last Week'],
];

export default function Header({
  viewMode, setViewMode, searchQuery, setSearchQuery,
  searchInputRef, theme, toggleTheme, onShowShortcuts, fs,
}) {
  return (
    <header style={{
      height: 52, minHeight: 52, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 20px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)', zIndex: 100, position: 'sticky', top: 0,
    }}>
      {/* Title */}
      <div style={{
        fontWeight: 600, fontSize: 14 * fs, letterSpacing: '-0.01em',
        color: 'var(--text-primary)', whiteSpace: 'nowrap', marginRight: 4,
      }}>
        AI & Tech Digest
      </div>

      {/* View mode tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 6, padding: 2 }}>
        {VIEW_MODES.map(([key, label]) => (
          <button key={key} onClick={() => setViewMode(key)} style={{
            padding: '5px 14px', fontSize: 12, fontWeight: 500, borderRadius: 4,
            background: viewMode === key ? 'var(--accent)' : 'transparent',
            color: viewMode === key ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search headlines, tags, sources..."
          style={{
            width: '100%', padding: '6px 12px 6px 30px', fontSize: 12.5, borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text-primary)', outline: 'none',
          }}
        />
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none',
        }}>&#x2315;</span>
      </div>

      {/* Right controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={toggleTheme}
          style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: 13 }}
          title="Toggle theme">
          {theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
        <button onClick={onShowShortcuts}
          style={{
            padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'monospace',
          }}>
          k
        </button>
      </div>
    </header>
  );
}
