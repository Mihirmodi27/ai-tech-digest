import React from 'react';
import { Flame, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HotNews({ items, collapsed, setCollapsed, onScrollToItem }) {
  if (items.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-6 pb-2 pt-5 text-left text-muted-foreground hover:text-foreground"
      >
        <Flame className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">Top Stories</span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums">
          {items.length}
        </span>
        <ChevronDown
          className={cn(
            'ml-auto h-3 w-3 transition-transform',
            collapsed && '-rotate-90'
          )}
          strokeWidth={2}
        />
      </button>

      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => onScrollToItem(item.id)}
                className="group flex items-start gap-2.5 rounded-2xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-3 text-left backdrop-blur-md transition-colors hover:bg-card/90 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.4)]"
              >
                <span className="text-[11px] font-semibold tabular-nums text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-foreground/90 group-hover:text-foreground">
                  {item.headline}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
