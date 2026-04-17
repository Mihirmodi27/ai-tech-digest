#!/usr/bin/env python3
"""
Daily Pipeline Orchestrator
Runs all three phases in sequence: scan → process → distribute.

Usage:
  python run_daily.py              # Run full pipeline
  python run_daily.py scan         # Only scan sources
  python run_daily.py process      # Only process with LLM
  python run_daily.py email        # Only send email
  python run_daily.py weekly       # Generate weekly summary
"""
import sys
import time
from datetime import datetime, timezone

def run_full_pipeline():
    print("=" * 60)
    print(f"AI & Tech Digest — Daily Pipeline")
    print(f"Started at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # Phase 1: Scan
    print("\n--- PHASE 1: Source Scanning ---")
    t0 = time.time()
    from scanners.rss_scanner import run_scanner
    scan_result = run_scanner()
    print(f"Phase 1 completed in {time.time() - t0:.1f}s\n")

    # Phase 2: LLM Processing
    print("--- PHASE 2: LLM Processing ---")
    t0 = time.time()
    from processors.llm_processor import run_processor
    digest_id = run_processor()
    print(f"Phase 2 completed in {time.time() - t0:.1f}s\n")

    # Phase 3: Email Distribution
    if digest_id:
        print("--- PHASE 3: Email Distribution ---")
        t0 = time.time()
        from distributors.email_digest import send_digest_email
        send_digest_email()
        print(f"Phase 3 completed in {time.time() - t0:.1f}s\n")
    else:
        print("--- PHASE 3: Skipped (no digest created) ---\n")

    # Weekly summary (run on Sundays)
    if datetime.now(timezone.utc).weekday() == 6:  # Sunday
        print("--- BONUS: Weekly Summary ---")
        t0 = time.time()
        from processors.weekly_summarizer import run_weekly_summarizer
        run_weekly_summarizer('current')
        print(f"Weekly summary completed in {time.time() - t0:.1f}s\n")

    print("=" * 60)
    print("Pipeline complete.")
    print("=" * 60)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == 'scan':
            from scanners.rss_scanner import run_scanner
            run_scanner()
        elif cmd == 'process':
            from processors.llm_processor import run_processor
            run_processor()
        elif cmd == 'email':
            from distributors.email_digest import send_digest_email
            send_digest_email()
        elif cmd == 'weekly':
            from processors.weekly_summarizer import run_weekly_summarizer
            which = sys.argv[2] if len(sys.argv) > 2 else 'current'
            run_weekly_summarizer(which)
        else:
            print(f"Unknown command: {cmd}")
            print("Usage: python run_daily.py [scan|process|email|weekly]")
    else:
        run_full_pipeline()
