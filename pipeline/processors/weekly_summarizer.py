"""
Phase 3: Weekly Summarizer
Aggregates the past week's digest items and generates a rich weekly summary
using Claude.
"""
import json
from datetime import datetime, timezone, timedelta

import anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, CATEGORIES
from db import supabase, save_weekly_summary
from runs import track_run
from prompts import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SUMMARY_PROMPT, PROMPT_VERSION = load_prompt('weekly_summary.v1')


def get_week_items(week_start: str, week_end: str) -> list[dict]:
    """Fetch all digest items for a given week."""
    # Get digests in the date range
    result = supabase.table('digests').select('id').gte(
        'digest_date', week_start
    ).lte('digest_date', week_end).eq('status', 'published').execute()

    if not result.data:
        return []

    digest_ids = [d['id'] for d in result.data]

    # Fetch all items from those digests
    items_result = supabase.table('digest_items').select(
        '*, categories(name), sources(name)'
    ).in_('digest_id', digest_ids).order('rank').execute()

    return items_result.data


def generate_summary(items: list[dict], week_start: str, week_end: str) -> dict:
    """Use Claude to generate the weekly summary."""
    # Build items text
    items_text = ""
    for item in items:
        cat = item.get('categories', {}).get('name', 'Unknown')
        src = item.get('sources', {}).get('name', 'Unknown')
        items_text += (
            f"- [{cat}] {item['headline']} (Source: {src})\n"
            f"  What: {item['what']}\n"
            f"  Why: {item['why']}\n\n"
        )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4000,
        system=SUMMARY_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"Week: {week_start} to {week_end}\n"
                f"Total items: {len(items)}\n"
                f"Categories: {', '.join(CATEGORIES)}\n\n"
                f"Items:\n{items_text}"
            ),
        }],
    )

    text = response.content[0].text
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]

    return json.loads(text.strip())


def run_weekly_summarizer(which: str = 'current', dry_run: bool = False):
    """
    Generate a weekly summary.
    which: 'current' for this week, 'previous' for last week.
    """
    with track_run('weekly', dry_run=dry_run) as run:
        prefix = '[weekly][dry-run] ' if dry_run else '[weekly] '
        now = datetime.now(timezone.utc)
        day_of_week = now.weekday()  # 0=Monday

        this_monday = now - timedelta(days=day_of_week)
        this_monday = this_monday.replace(hour=0, minute=0, second=0, microsecond=0)

        if which == 'current':
            week_start = this_monday
        else:
            week_start = this_monday - timedelta(days=7)

        week_end = week_start + timedelta(days=6)

        ws = week_start.strftime('%Y-%m-%d')
        we = week_end.strftime('%Y-%m-%d')

        run['metadata'] = {'week_start': ws, 'week_end': we, 'which': which}
        print(f"{prefix}Generating summary for {ws} to {we}...")

        items = get_week_items(ws, we)
        run['input_count'] = len(items)
        if not items:
            run['status'] = 'skipped'
            run['output_count'] = 0
            print(f"{prefix}No items found for this week.")
            return

        print(f"{prefix}Found {len(items)} items, sending to Claude...")
        summary = generate_summary(items, ws, we)

        if dry_run:
            print(f"{prefix}LLM result (would-be summary, NOT persisted):")
            print(json.dumps(summary, indent=2, ensure_ascii=False))
            run['output_count'] = 0
            return

        save_weekly_summary(ws, summary, prompt_version=PROMPT_VERSION)
        run['output_count'] = 1
        print(f"{prefix}Summary saved for week of {ws}")


if __name__ == '__main__':
    import sys
    which = sys.argv[1] if len(sys.argv) > 1 else 'current'
    run_weekly_summarizer(which)
