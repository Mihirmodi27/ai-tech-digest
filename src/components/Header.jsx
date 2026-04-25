import React, { useState } from 'react';
import { Search, Sun, Moon, Command, Play, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const VIEW_TITLES = {
  today: 'Today',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
};

const TOKEN_KEY = 'digest-admin-token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function triggerWorkflow(token) {
  const res = await fetch('/api/admin/run', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return res;
}

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
  // Run-button state: 'idle' | 'running' | 'success' | 'error'
  const [runState, setRunState] = useState('idle');
  const [runError, setRunError] = useState('');

  async function handleRun() {
    let token = getToken();
    if (!token) {
      token = (window.prompt('Admin token (set ADMIN_TOKEN in your env):') || '').trim();
      if (!token) return;
      setToken(token);
    }

    setRunState('running');
    setRunError('');

    try {
      let res = await triggerWorkflow(token);
      if (res.status === 401) {
        // Stale or wrong token — clear and re-prompt once.
        setToken('');
        const fresh = (window.prompt('Token rejected. Re-enter ADMIN_TOKEN:') || '').trim();
        if (!fresh) {
          setRunState('error');
          setRunError('cancelled');
          setTimeout(() => setRunState('idle'), 2500);
          return;
        }
        setToken(fresh);
        res = await triggerWorkflow(fresh);
      }

      if (res.ok) {
        setRunState('success');
        setTimeout(() => setRunState('idle'), 2500);
      } else {
        const body = await res.json().catch(() => ({}));
        setRunState('error');
        setRunError(body.error || `HTTP ${res.status}`);
        setTimeout(() => setRunState('idle'), 3500);
      }
    } catch (err) {
      setRunState('error');
      setRunError('network');
      setTimeout(() => setRunState('idle'), 3500);
    }
  }

  const runIcon =
    runState === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
    runState === 'success' ? <Check className="h-3.5 w-3.5" /> :
    runState === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> :
    <Play className="h-3.5 w-3.5" />;

  const runLabel =
    runState === 'running' ? 'Running…' :
    runState === 'success' ? 'Triggered' :
    runState === 'error' ? (runError || 'Failed') :
    'Run';

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 bg-transparent px-4">
      {/* Breadcrumb / title */}
      <div className="glass-panel flex items-center gap-2.5 rounded-2xl px-4 py-1.5">
        <span className="text-[14px] font-semibold">{VIEW_TITLES[viewMode]}</span>
        {viewMode === 'today' && activeCategory !== 'All' && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-[14px] text-muted-foreground">{activeCategory}</span>
          </>
        )}
        {itemCount !== undefined && (
          <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {itemCount}
          </span>
        )}
      </div>

      {/* Run button — triggers GitHub Actions workflow_dispatch */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRun}
        disabled={runState === 'running'}
        title="Trigger the daily pipeline workflow"
        className="glass-panel h-8 gap-1.5 rounded-full px-4 text-[12.5px] font-normal text-muted-foreground hover:text-foreground"
      >
        {runIcon}
        {runLabel}
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
          className="glass-panel h-9 rounded-full bg-transparent pl-9 text-[13px] placeholder:text-muted-foreground/70 focus-visible:ring-0"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground/60">
          /
        </kbd>
      </div>

      {/* Right controls */}
      <div className="glass-panel flex items-center gap-0.5 rounded-full p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowShortcuts}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Keyboard shortcuts"
        >
          <Command className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
