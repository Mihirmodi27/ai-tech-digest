import React, { useState, useRef, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import HotNews from '@/components/HotNews';
import Sidebar from '@/components/Sidebar';
import NewsCard from '@/components/NewsCard';
import WeeklySummary from '@/components/WeeklySummary';
import ShortcutsModal from '@/components/ShortcutsModal';
import FeedSkeleton from '@/components/FeedSkeleton';
import { useDigest, useWeeklySummary } from '@/hooks/useDigest';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboard } from '@/hooks/useKeyboard';
import { TWEAK_DEFAULTS } from '@/lib/constants';

export default function App() {
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

  const searchInputRef = useRef(null);
  const cardRefs = useRef([]);

  const { data: todayDigest, isLoading: todayLoading } = useDigest('latest');
  const weekKey = viewMode === 'thisWeek' ? 'current' : viewMode === 'lastWeek' ? 'previous' : null;
  const { data: weeklySummary, isLoading: weeklyLoading } = useWeeklySummary(weekKey);

  const viewItems = useMemo(() => {
    if (viewMode === 'today') return todayDigest?.items || [];
    return [];
  }, [viewMode, todayDigest]);

  const digest = viewMode === 'today' ? todayDigest : null;

  const filteredItems = useMemo(() => {
    let items = viewItems;
    if (activeCategory !== 'All') items = items.filter((i) => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
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

  useEffect(() => {
    localStorage.setItem('digest-tldr', tldrCollapsed ? 'collapsed' : 'expanded');
  }, [tldrCollapsed]);

  useEffect(() => {
    if (activeCardIndex >= 0 && cardRefs.current[activeCardIndex]) {
      cardRefs.current[activeCardIndex].scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeCardIndex]);

  useEffect(() => {
    setActiveCardIndex(-1);
  }, [activeCategory, searchQuery, viewMode]);

  useKeyboard(
    {
      j: () => setActiveCardIndex((i) => Math.min(i + 1, filteredItems.length - 1)),
      o: () => {
        if (activeCardIndex >= 0) window.open(filteredItems[activeCardIndex]?.url, '_blank');
      },
      '/': () => searchInputRef.current?.focus(),
      k: () => setShowShortcuts((s) => !s),
      Escape: () => setShowShortcuts(false),
    },
    [filteredItems, activeCardIndex]
  );

  const scrollToItem = (id) => {
    setActiveCategory('All');
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isWeeklyView = viewMode === 'thisWeek' || viewMode === 'lastWeek';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground creative:gap-3 creative:p-3">
      {/* Left sidebar */}
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col creative:gap-3">
        <Header
          viewMode={viewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          theme={theme}
          toggleTheme={toggleTheme}
          onShowShortcuts={() => setShowShortcuts(true)}
          itemCount={viewMode === 'today' ? filteredItems.length : undefined}
          activeCategory={activeCategory}
        />

        {viewMode === 'today' && !todayLoading && topFive.length > 0 && (
          <HotNews
            items={topFive}
            collapsed={tldrCollapsed}
            setCollapsed={setTldrCollapsed}
            onScrollToItem={scrollToItem}
          />
        )}

        <main className="flex-1 overflow-y-auto creative:px-2">
          {isWeeklyView ? (
            <WeeklySummary summary={weeklySummary} isLoading={weeklyLoading} />
          ) : todayLoading ? (
            <FeedSkeleton />
          ) : filteredItems.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center text-[13px] text-muted-foreground">
              {searchQuery
                ? `No items match '${searchQuery}'. Try broader terms.`
                : 'No items in this category.'}
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([category, items]) => (
                <section key={category} className="mb-8">
                  <div className="flex items-center gap-2.5 px-6 pb-2 pt-6">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div>
                    {items.map((item) => {
                      const globalIdx = filteredItems.indexOf(item);
                      return (
                        <NewsCard
                          key={item.id}
                          item={item}
                          isActive={globalIdx === activeCardIndex}
                          ref={(el) => (cardRefs.current[globalIdx] = el)}
                          showTags={tweaks.showTags}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
              {digest?.meta && (
                <div className="px-6 py-8 text-[11px] text-muted-foreground">
                  Sources scanned: {digest.meta.sourcesScanned} · Items evaluated: {digest.meta.itemsEvaluated} · Items included: {digest.meta.itemsIncluded}
                  <br />
                  Generated at {digest.meta.generatedAt} · Updated {digest.meta.updatedAt}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
