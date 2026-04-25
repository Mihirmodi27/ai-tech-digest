import React, { useState, forwardRef } from 'react';
import { ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/time';

const NewsCard = forwardRef(({ item, isActive, showTags }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const isRumor = item.category === 'Rumors & Unconfirmed';
  const timeLabel = relativeTime(item.publishedAt) || item.time || '';

  return (
    <div
      ref={ref}
      id={`card-${item.id}`}
      className={cn(
        'group relative transition-colors',
        'creative:mb-2 creative:rounded-2xl creative:border creative:border-white/70 creative:bg-white/70 creative:backdrop-blur-md creative:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]',
        isActive
          ? 'bg-secondary/50 creative:bg-white/90'
          : 'hover:bg-secondary/30 creative:hover:bg-white/85'
      )}
    >
      {/* Row — Linear-style single line */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-6 py-3 text-left"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform',
            expanded && 'rotate-90'
          )}
          strokeWidth={2}
        />

        {/* Category pill — monochrome */}
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider creative:rounded-full creative:px-2',
            isRumor
              ? 'bg-[hsl(var(--rumor)/0.15)] text-[hsl(var(--rumor))]'
              : 'bg-secondary text-muted-foreground creative:bg-black/5'
          )}
        >
          {isRumor && <AlertCircle className="mr-0.5 inline h-2.5 w-2.5" />}
          {item.category}
        </span>

        {/* Headline */}
        <span className="flex-1 truncate text-[13.5px] font-medium">{item.headline}</span>

        {/* Right-edge metadata */}
        <div className="flex shrink-0 items-center gap-4 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-secondary text-[9px] font-bold">
              {item.source?.favicon}
            </span>
            <span className="hidden lg:inline">{item.source?.name}</span>
          </span>
          <span className="tabular-nums">{timeLabel}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            aria-label="Open source"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-2.5 px-6 pb-4 pl-[52px]">
          <p className="text-[13px] leading-relaxed text-muted-foreground">{item.what}</p>
          <p className="text-[13px] leading-relaxed">
            <span className="mr-1 text-primary">→</span>
            {item.why}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showTags &&
              item.tags?.map((t) => (
                <span
                  key={t}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            <span className="ml-auto flex items-center gap-3 text-[11px]">
              <a
                href={item.source?.url || item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {item.source?.name}
              </a>
              {item.extraSources?.length > 0 && (
                <span className="text-muted-foreground">
                  + {item.extraSources.length} other sources
                </span>
              )}
            </span>
          </div>

          {item.extraSources?.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {item.extraSources.map((s, i) => (
                <a
                  key={i}
                  href={s.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-secondary text-[9px] font-bold">
                    {s.favicon}
                  </span>
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NewsCard.displayName = 'NewsCard';
export default NewsCard;
