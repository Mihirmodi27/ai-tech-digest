import React from 'react';

export default function FeedSkeleton() {
  return (
    <div style={{ padding: '0 0 64px 0' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="skeleton" style={{ width: 90, height: 16 }} />
            <div className="skeleton" style={{ width: 50, height: 16 }} />
          </div>
          <div className="skeleton" style={{ width: '80%', height: 20, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 4 }} />
          <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '95%', height: 14, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ width: 60, height: 18 }} />
            <div className="skeleton" style={{ width: 70, height: 18 }} />
            <div className="skeleton" style={{ width: 50, height: 18 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
