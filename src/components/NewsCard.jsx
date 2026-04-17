import React, { useState, forwardRef } from 'react';

const NewsCard = forwardRef(({ item, isActive, fs, showTags, compact }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const isRumor = item.category === 'Rumors & Unconfirmed';

  return (
    <div ref={ref} id={`card-${item.id}`} className="news-card" style={{
      padding: compact ? '12px 24px' : '16px 24px',
      borderBottom: '1px solid var(--border)',
      borderLeft: isRumor
        ? '2px dashed var(--rumor-border)'
        : isActive ? '2px solid var(--accent)' : '2px solid transparent',
      background: isActive ? 'var(--accent-dim)' : 'transparent',
      transition: 'background 0.12s',
    }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10.5, fontWeight: 500, padding: '1px 6px', borderRadius: 3,
          background: 'var(--tag-bg)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.03em',
        }}>{item.category}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2, background: 'var(--tag-bg)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700,
          }}>{item.source?.favicon}</span>
          {item.source?.name}
        </span>
      </div>

      {/* Headline */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
        display: 'block', fontSize: (compact ? 15 : 16.5) * fs, fontWeight: 600,
        lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: compact ? 4 : 6,
      }}>{item.headline}</a>

      {/* What */}
      {!compact && (
        <p style={{ fontSize: 13 * fs, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>
          {item.what}
        </p>
      )}

      {/* Why */}
      <p style={{ fontSize: 13 * fs, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: compact ? 4 : 8, opacity: 0.85 }}>
        <span style={{ color: 'var(--accent)', marginRight: 4 }}>&rarr;</span>{item.why}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {showTags && item.tags?.map((t) => (
          <span key={t} style={{
            fontSize: 11, color: 'var(--tag-text)', background: 'var(--tag-bg)',
            padding: '1px 6px', borderRadius: 3,
          }}>{t}</span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href={item.source?.url || item.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)' }}>
            &#x1F517; {item.source?.name}
          </a>
          {item.extraSources?.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, color: 'var(--accent)' }}>
              + {item.extraSources.length} more
            </button>
          )}
        </span>
      </div>

      {/* Extra sources */}
      {expanded && item.extraSources?.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
          {item.extraSources.map((s, i) => (
            <a key={i} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 14, height: 14, borderRadius: 2, background: 'var(--tag-bg)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>{s.favicon}</span>
              {s.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

NewsCard.displayName = 'NewsCard';
export default NewsCard;
