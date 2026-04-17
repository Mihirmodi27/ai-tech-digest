import React, { useState, useRef, useMemo, useEffect } from 'react';
import Header from './components/Header';
import HotNews from './components/HotNews';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import WeeklySummary from './components/WeeklySummary';
import ShortcutsModal from './components/ShortcutsModal';
import FeedSkeleton from './components/FeedSkeleton';
import { useDigest, useWeeklySummary } from './hooks/useDigest';
import { useTheme } from './hooks/useTheme';
import { useKeyboard } from './hooks/useKeyboard';
import { TWEAK_DEFAULTS } from './lib/constants';

export default function App() {
  // --- State ---
  const [viewMode, setViewMode] = useState('today');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tldrCollapsed, setTldrCollapsed] = useState(
    () => localStorage.getItem('digest-tldr') === 'collapsed'
  );
  const [activeCardIndex, setActiveCardIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [tweaks] = useState(TWEAK_DEFAULTS);
  const { theme, toggle: toggleTheme } = useTheme();

  // --- Refs ---
  const searchInputRef = useRef(null);
  const cardRefs = useRef([]);

  // --- Data fetching ---
  const { data: todayDigest, isLoading: todayLoading } = useDigest('latest');
  const weekKey = viewMode === 'thisWeek' ? 'current' : viewMode === 'lastWeek' ? 'previous' : null;
  const { data: weeklySummary, isLoading: weeklyLoading } = useWeeklySummary(weekKey);

  const viewItems = useMemo(() => {
    if (viewMode === 'today') return todayDigest?.items || [];
    return [];
  }, [viewMode, todayDigest]);

  const digest = viewMode === 'today' ? todayDigest : null;

  // --- Derived state ---
  const filteredItems = useMemo(() => {
    let items = viewItems;
    if (activeCategory !== 'All') items = items.filter((i) => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        i.headline.toLowerCase().includes(q) ||
        i.what.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.toLowerCase().includes(q)) ||
        i.source?.name.toLowerCase().includes(q)
      );
    }
    return items;
  }, [viewItems, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categoryCounts = useMemo(() => {
    const counts = { All: viewItems.length };
    viewItems.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [viewItems]);

  const topFive = useMemo(() => viewItems.slice(0, 5), [viewItems]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('digest-tldr', tldrCollapsed ? 'collapsed' : 'expanded');
  }, [tldrCollapsed]);

  useEffect(() => {
    if (activeCardIndex >= 0 && cardRefs.current[activeCardIndex]) {
      cardRefs.current[activeCardIndex].scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeCardIndex]);

  useEffect(() => { setActiveCardIndex(-1); }, [activeCategory, searchQuery, viewMode]);

  // --- Keyboard ---
  useKeyboard({
    'j': () => setActiveCardIndex((i) => Math.min(i + 1, filteredItems.length - 1)),
    'o': () => { if (activeCardIndex >= 0) window.open(filteredItems[activeCardIndex]?.url, '_blank'); },
    '/': () => searchInputRef.current?.focus(),
    'k': () => setShowShortcuts((s) => !s),
    'Escape': () => setShowShortcuts(false),
  }, [filteredItems, activeCardIndex]);

  const scrollToItem = (id) => {
    setActiveCategory('All');
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fs = tweaks.fontScale;
  const isWeeklyView = viewMode === 'thisWeek' || viewMode === 'lastWeek';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        viewMode={viewMode} setViewMode={setViewMode}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef} theme={theme} toggleTheme={toggleTheme}
        onShowShortcuts={() => setShowShortcuts(true)} fs={fs}
      />

      {/* Hot News (today view only) */}
      {viewMode === 'today' && (
        <HotNews
          items={topFive} collapsed={tldrCollapsed}
          setCollapsed={setTldrCollapsed} onScrollToItem={scrollToItem} fs={fs}
        />
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar (today view only) */}
        {viewMode === 'today' && (
          <Sidebar
            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
            categoryCounts={categoryCounts} fs={fs}
          />
        )}

        {/* Feed */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 0 64px 0' }}>
          {isWeeklyView ? (
            <WeeklySummary summary={weeklySummary} isLoading={weeklyLoading} fs={fs} />
          ) : todayLoading ? (
            <FeedSkeleton />
          ) : filteredItems.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '40vh', color: 'var(--text-muted)', fontSize: 14 * fs,
            }}>
              {searchQuery
                ? `No items match '${searchQuery}'. Try broader terms.`
                : 'No items in this category.'}
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <div style={{
                    padding: '16px 24px 8px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'baseline', gap: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{category}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>&middot; {items.length}</span>
                  </div>
                  {items.map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <NewsCard
                        key={item.id} item={item} isActive={globalIdx === activeCardIndex}
                        ref={(el) => (cardRefs.current[globalIdx] = el)}
                        fs={fs} showTags={tweaks.showTags} compact={tweaks.compactCards}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Meta footer */}
              {digest?.meta && (
                <div style={{ padding: '32px 24px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                  Sources scanned: {digest.meta.sourcesScanned} &middot; Items evaluated: {digest.meta.itemsEvaluated} &middot; Items included: {digest.meta.itemsIncluded}<br />
                  Digest generated at {digest.meta.generatedAt} &middot; Last updated {digest.meta.updatedAt}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
