"""
Phase 2: LLM Processor
Takes raw articles, deduplicates, categorizes, and generates
headline / what / why / tags for each digest item using Claude.
"""
import json
from datetime import datetime, timezone

import anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, CATEGORIES, MAX_DIGEST_ITEMS, TOP_N_STORIES
from db import (
    get_unprocessed_articles, mark_articles_processed,
    create_digest, insert_digest_items,
)
from runs import track_run
from prompts import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT, PROMPT_VERSION = load_prompt('daily_digest.v1')


def build_articles_prompt(articles: list[dict]) -> str:
    """Format raw articles into a prompt for Claude."""
    parts = []
    for i, article in enumerate(articles, 1):
        source_name = article.get('sources', {}).get('name', 'Unknown')
        parts.append(
            f"[{i}] SOURCE: {source_name}\n"
            f"TITLE: {article['title']}\n"
            f"URL: {article['url']}\n"
            f"CONTENT: {article.get('content', '')[:2000]}\n"
            f"PUBLISHED: {article.get('published_at', 'unknown')}\n"
        )
    return "\n---\n".join(parts)


def process_articles(articles: list[dict]) -> dict:
    """Send articles to Claude and get structured digest items back."""
    if not articles:
        return {'items': [], 'items_evaluated': 0, 'items_included': 0}

    articles_text = build_articles_prompt(articles)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8000,
        system=SYSTEM_PROMPT.format(
            categories=", ".join(CATEGORIES),
            max_items=MAX_DIGEST_ITEMS,
        ),
        messages=[{
            "role": "user",
            "content": f"Here are today's {len(articles)} raw articles. Curate the digest:\n\n{articles_text}",
        }],
    )

    # Extract JSON from response
    text = response.content[0].text
    # Handle potential markdown code fences
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]

    return json.loads(text.strip())


def run_processor():
    """Main processor entry point."""
    with track_run('process') as run:
        print("[processor] Fetching unprocessed articles...")
        articles = get_unprocessed_articles()
        run['input_count'] = len(articles)

        if not articles:
            run['status'] = 'skipped'
            run['output_count'] = 0
            print("[processor] No new articles to process.")
            return None

        print(f"[processor] Processing {len(articles)} articles with Claude...")
        result = process_articles(articles)

        now = datetime.now(timezone.utc)
        digest_date = now.strftime('%Y-%m-%d')
        meta = {
            'sources_scanned': len(set(a.get('source_id') for a in articles)),
            'items_evaluated': result.get('items_evaluated', len(articles)),
            'items_included': result.get('items_included', len(result['items'])),
            'generated_at': now.strftime('%H:%M') + ' UTC',
            'updated_at': now.strftime('%H:%M') + ' UTC',
        }

        digest_id = create_digest(digest_date, meta, prompt_version=PROMPT_VERSION)
        print(f"[processor] Created digest #{digest_id} for {digest_date}")

        insert_digest_items(digest_id, result['items'])
        print(f"[processor] Inserted {len(result['items'])} items")

        mark_articles_processed([a['id'] for a in articles])
        print(f"[processor] Marked {len(articles)} articles as processed")

        run['output_count'] = len(result['items'])
        run['metadata'] = {'digest_id': digest_id, 'digest_date': digest_date}
        return digest_id


if __name__ == '__main__':
    run_processor()
