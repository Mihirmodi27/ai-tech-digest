import React from 'react';

const SHORTCUTS = [
  ['j', 'Next card'],
  ['o', 'Open source link'],
  ['/', 'Focus search'],
  ['k', 'Toggle this dialog'],
  ['Esc', 'Close overlay'],
];

export default function ShortcutsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: 24, width: 360,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Keyboard Shortcuts</div>
        {SHORTCUTS.map(([key, desc]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
            <code style={{
              background: 'var(--tag-bg)', padding: '1px 6px', borderRadius: 3,
              fontSize: 12, fontFamily: 'monospace',
            }}>{key}</code>
            <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
