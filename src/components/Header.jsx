import React from 'react';
import { Search, Sun, Moon, Command, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const VIEW_TITLES = {
  today: 'Today',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
};

export default function Header({
  viewMode,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  theme,
  toggleTheme,
  onShowShortcuts,
  itemCount,
  activeCategory,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 bg-background px-6">
      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2.5">
        <span className="text-[14px] font-semibold">{VIEW_TITLES[viewMode]}</span>
        {viewMode === 'today' && activeCategory !== 'All' && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-[14px] text-muted-foreground">{activeCategory}</span>
          </>
        )}
        {itemCount !== undefined && (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {itemCount}
          </span>
        )}
      </div>

      {/* Filter button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-[12.5px] font-normal text-muted-foreground hover:text-foreground"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
        Filter
      </Button>

      {/* Search */}
      <div className="relative ml-auto w-64">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70"
          strokeWidth={1.75}
        />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search…"
          className="h-8 rounded-md border-transparent bg-secondary/60 pl-9 text-[13px] placeholder:text-muted-foreground/70 focus-visible:border-border focus-visible:ring-0"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground/60">
          /
        </kbd>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowShortcuts}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Keyboard shortcuts"
        >
          <Command className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
