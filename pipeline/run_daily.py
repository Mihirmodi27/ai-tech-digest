#!/usr/bin/env python3
"""
Daily Pipeline Orchestrator
Runs all three phases in sequence: scan → process → distribute.

Usage:
  python run_daily.py                     Full pipeline
  python run_daily.py scan                Only scan sources
  python run_daily.py process             Only process with LLM
  python run_daily.py email               Only send email
  python run_daily.py weekly [previous]   Weekly summary

Flags (work with any subcommand or with the full pipeline):
  --dry-run                  No DB writes / no emails. LLM calls still run.
  --model <id>               Override CLAUDE_MODEL for this invocation.
"""
import os
import sys
import time
from datetime import datetime, timezone


def _parse_argv():
    argv = sys.argv[1:]
    positional: list[str] = []
    dry_run = False
    model = None

    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == '--dry-run':
            dry_run = True
        elif arg == '--model':
            if i + 1 >= len(argv):
                print("error: --model requires a value", file=sys.stderr)
                sys.exit(2)
            model = argv[i + 1]
            i += 1
        elif arg.startswith('--model='):
            model = arg.split('=', 1)[1]
        elif arg in ('-h', '--help'):
            print(__doc__)
            sys.exit(0)
        elif arg.startswith('--'):
            print(f"error: unknown flag {arg}", file=sys.stderr)
            sys.exit(2)
        else:
            positional.append(arg)
        i += 1

    cmd = positional[0] if positional else None
    extra = positional[1:]
    return cmd, extra, dry_run, model


def run_full_pipeline(dry_run: bool = False):
    print("=" * 60)
    print("AI & Tech Digest — Daily Pipeline" + (" (dry-run)" if dry_run else ""))
    print(f"Started at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    print("\n--- PHASE 1: Source Scanning ---")
    t0 = time.time()
    from scanners.rss_scanner import run_scanner
    run_scanner(dry_run=dry_run)
    print(f"Phase 1 completed in {time.time() - t0:.1f}s\n")

    print("--- PHASE 2: LLM Processing ---")
    t0 = time.time()
    from processors.llm_processor import run_processor
    digest_id = run_processor(dry_run=dry_run)
    print(f"Phase 2 completed in {time.time() - t0:.1f}s\n")

    if digest_id or dry_run:
        print("--- PHASE 3: Email Distribution ---")
        t0 = time.time()
        from distributors.email_digest import send_digest_email
        send_digest_email(dry_run=dry_run)
        print(f"Phase 3 completed in {time.time() - t0:.1f}s\n")
    else:
        print("--- PHASE 3: Skipped (no digest created) ---\n")

    if datetime.now(timezone.utc).weekday() == 6:  # Sunday
        print("--- BONUS: Weekly Summary ---")
        t0 = time.time()
        from processors.weekly_summarizer import run_weekly_summarizer
        run_weekly_summarizer('current', dry_run=dry_run)
        print(f"Weekly summary completed in {time.time() - t0:.1f}s\n")

    print("=" * 60)
    print("Pipeline complete.")
    print("=" * 60)


if __name__ == '__main__':
    cmd, extra, dry_run, model = _parse_argv()

    # Override CLAUDE_MODEL BEFORE importing any phase modules (config reads
    # the env var at import time).
    if model:
        os.environ['CLAUDE_MODEL'] = model
        print(f"[run_daily] CLAUDE_MODEL override → {model}")

    if cmd is None:
        run_full_pipeline(dry_run=dry_run)
    elif cmd == 'scan':
        from scanners.rss_scanner import run_scanner
        run_scanner(dry_run=dry_run)
    elif cmd == 'process':
        from processors.llm_processor import run_processor
        run_processor(dry_run=dry_run)
    elif cmd == 'email':
        from distributors.email_digest import send_digest_email
        send_digest_email(dry_run=dry_run)
    elif cmd == 'weekly':
        from processors.weekly_summarizer import run_weekly_summarizer
        which = extra[0] if extra else 'current'
        run_weekly_summarizer(which, dry_run=dry_run)
    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python run_daily.py [scan|process|email|weekly] [--dry-run] [--model <id>]")
        sys.exit(2)
