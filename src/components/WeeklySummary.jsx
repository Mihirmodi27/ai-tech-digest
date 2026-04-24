import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeeklySummary({ summary, isLoading }) {
  if (isLoading) return <WeeklySkeleton />;

  if (!summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        No summary available for this period.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-8">
      {/* Title block */}
      <div className="mb-8">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Weekly Summary
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">{summary.period}</h1>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>{summary.stats.totalItems} items</span>
          <span>·</span>
          <span>{summary.stats.sourcesScanned} sources</span>
          <span>·</span>
          <span>Top: {summary.stats.topSource}</span>
        </div>
      </div>

      {/* Overview */}
      <p className="mb-10 text-[14px] leading-relaxed text-foreground/85">
        {summary.overview}
      </p>

      {/* Top Stories */}
      <section className="mb-10">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Top Stories
        </h2>
        <div className="divide-y divide-sidebar-border/50">
          {summary.topStories.map((s, i) => (
            <div key={i} className="py-3">
              <div className="mb-1 flex items-baseline gap-3">
                <span className="w-5 shrink-0 text-[12px] font-semibold tabular-nums text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] font-medium">{s.title}</span>
              </div>
              <p className="pl-8 text-[13px] leading-relaxed text-muted-foreground">{s.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Emerging Themes */}
      <section className="mb-10">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Emerging Themes
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {summary.emergingThemes.map((t, i) => (
            <div
              key={i}
              className="rounded-md border border-sidebar-border bg-card p-3.5 transition-colors hover:border-muted-foreground/30"
            >
              <div className="mb-1 text-[13px] font-semibold">{t.theme}</div>
              <div className="text-[12.5px] leading-relaxed text-muted-foreground">{t.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Breakdown */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Category Breakdown
        </h2>
        <div className="divide-y divide-sidebar-border/50">
          {summary.categoryBreakdown.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 text-[12.5px]">
              <span className="min-w-[180px] font-medium">{c.category}</span>
              <span className="min-w-[32px] tabular-nums text-primary">{c.count}</span>
              <span className="text-muted-foreground">{c.highlight}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-8">
      <Skeleton className="mb-2 h-3 w-32" />
      <Skeleton className="mb-3 h-7 w-72" />
      <Skeleton className="mb-10 h-3 w-60" />
      <Skeleton className="mb-10 h-16 w-full" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="mb-3 h-12 w-full" />
      ))}
    </div>
  );
}
