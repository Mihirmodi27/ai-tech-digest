import React from 'react';
import {
  Inbox,
  Calendar,
  CalendarDays,
  History,
  Sparkles,
  Rocket,
  DollarSign,
  FlaskConical,
  GitBranch,
  Server,
  Scale,
  TrendingUp,
  Target,
  MessageCircleQuestion,
  ChevronDown,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const VIEWS = [
  ['today', 'Today', Inbox],
  ['thisWeek', 'This Week', Calendar],
  ['lastWeek', 'Last Week', History],
];

const CATEGORY_ICONS = {
  'Models & Updates': Sparkles,
  'Products & Launches': Rocket,
  'Funding & M&A': DollarSign,
  'Research & Papers': FlaskConical,
  'Open Source & Tooling': GitBranch,
  'Infrastructure & Compute': Server,
  'Policy & Regulation': Scale,
  'Industry Signals': TrendingUp,
  'Vertical Watch': Target,
  'Rumors & Unconfirmed': MessageCircleQuestion,
};

function NavItem({ icon: Icon, label, count, active, disabled, onClick, shortcut }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors creative:rounded-xl',
        active
          ? 'bg-secondary text-foreground creative:bg-black/5'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground creative:hover:bg-black/[0.03]',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />}
      <span className="flex-1 truncate text-left">{label}</span>
      {shortcut && (
        <kbd className="hidden font-mono text-[10px] text-muted-foreground/70 group-hover:inline">
          {shortcut}
        </kbd>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{count}</span>
      )}
    </button>
  );
}

function Section({ label, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="mb-1 flex w-full items-center gap-1 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground"
      >
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', !open && '-rotate-90')}
          strokeWidth={2}
        />
        {label}
      </button>
      {open && <div className="flex flex-col gap-px">{children}</div>}
    </div>
  );
}

export default function Sidebar({
  viewMode,
  setViewMode,
  activeCategory,
  setActiveCategory,
  categoryCounts,
}) {
  const isCategoryDisabled = viewMode !== 'today';

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col bg-sidebar md:flex creative:glass-panel creative:rounded-2xl">
      {/* Workspace header */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground creative:bg-foreground">
          A
        </div>
        <div className="flex-1 truncate text-[13px] font-semibold">AI & Tech Digest</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <Section label="Views">
          {VIEWS.map(([key, label, Icon]) => (
            <NavItem
              key={key}
              icon={Icon}
              label={label}
              active={viewMode === key}
              onClick={() => setViewMode(key)}
            />
          ))}
        </Section>

        <Section label="Categories">
          <NavItem
            icon={CalendarDays}
            label="All"
            count={categoryCounts['All'] || 0}
            active={!isCategoryDisabled && activeCategory === 'All'}
            disabled={isCategoryDisabled}
            onClick={() => !isCategoryDisabled && setActiveCategory('All')}
          />
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <NavItem
                key={cat}
                icon={Icon}
                label={cat}
                count={categoryCounts[cat] || 0}
                active={!isCategoryDisabled && activeCategory === cat}
                disabled={isCategoryDisabled}
                onClick={() => !isCategoryDisabled && setActiveCategory(cat)}
              />
            );
          })}
        </Section>
      </nav>
    </aside>
  );
}
