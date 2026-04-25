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

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """You are an AI & Tech news editor. You receive a batch of raw articles
and must produce a curated daily digest.

For each included item, generate:
- headline: A clear, concise headline (rewrite for clarity, not clickbait)
- what: 2-3 sentences explaining what happened (factual, no opinion)
- why: 2-3 sentences on why this matters (analytical, forward-looking)
- category: Exactly one of the categories listed below
- tags: 2-4 lowercase hashtags
- source: The primary source name
- extra_sources: Other sources covering the same story (for deduplication)
- published_at: ISO 8601 timestamp — use the PUBLISHED value from the source article(s).
  When merging duplicates, use the newest PUBLISHED among them.

Categories: {categories}

Rules:
1. Deduplicate: If multiple articles cover the same story, merge them into ONE item.
   List the primary source and extras.
2. Rank by importance: Most impactful stories first.
3. Include {max_items} items maximum.
4. Mark anything unverified/rumored as category "Rumors & Unconfirmed".
5. The "why" should explain significance to an AI/tech professional, not just restate facts.

Return ONLY valid JSON matching this schema:
{{
  "items": [
    {{
      "headline": "string",
      "what": "string",
      "why": "string",
      "category": "string",
      "tags": ["string"],
      "source": "string",
      "extra_sources": ["string"],
      "url": "string",
      "published_at": "ISO 8601 string or null"
    }}
  ],
  "items_evaluated": number,
  "items_included": number
}}"""


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

        digest_id = create_digest(digest_date, meta)
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
