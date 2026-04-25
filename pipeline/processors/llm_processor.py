"""
Phase 2: LLM Processor
Takes raw articles, deduplicates, categorizes, and generates
headline / what / why / tags for each digest item using Claude.

Two strategies, controlled by LLM_STRATEGY env var:
- 'single' (default): one Claude call with all articles inline.
- 'mapreduce': chunked candidate extraction + a final dedup/rerank pass.
  Decouples source count from prompt size; tradeoff is N+1 LLM calls.
"""
import json
from datetime import datetime, timezone

import anthropic

from config import (
    ANTHROPIC_API_KEY, CLAUDE_MODEL, CATEGORIES, MAX_DIGEST_ITEMS, TOP_N_STORIES,
    LLM_STRATEGY, MAPREDUCE_CHUNK_SIZE,
)
from db import (
    get_unprocessed_articles, mark_articles_processed,
    create_digest, insert_digest_items,
)
from runs import track_run
from prompts import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Single-strategy prompt (legacy, default)
SINGLE_PROMPT, SINGLE_VERSION = load_prompt('daily_digest.v1')

# Map-reduce prompts
CANDIDATE_PROMPT, CANDIDATE_VERSION = load_prompt('daily_digest_candidate.v1')
RERANK_PROMPT, RERANK_VERSION = load_prompt('daily_digest_rerank.v1')

PROMPT_VERSION = (
    f'{CANDIDATE_VERSION},{RERANK_VERSION}'
    if LLM_STRATEGY == 'mapreduce'
    else SINGLE_VERSION
)


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


def _extract_json(text: str) -> dict:
    """Strip code fences from a Claude response and parse JSON."""
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]
    return json.loads(text.strip())


def _process_single(articles: list[dict]) -> dict:
    """One-shot strategy: send every article in a single Claude call."""
    articles_text = build_articles_prompt(articles)
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8000,
        system=SINGLE_PROMPT.format(
            categories=", ".join(CATEGORIES),
            max_items=MAX_DIGEST_ITEMS,
        ),
        messages=[{
            "role": "user",
            "content": f"Here are today's {len(articles)} raw articles. Curate the digest:\n\n{articles_text}",
        }],
    )
    return _extract_json(response.content[0].text)


def _extract_candidates(articles: list[dict]) -> list[dict]:
    """Map step: ask Claude for candidate digest items from one chunk."""
    articles_text = build_articles_prompt(articles)
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=6000,
        system=CANDIDATE_PROMPT.format(categories=", ".join(CATEGORIES)),
        messages=[{
            "role": "user",
            "content": f"Chunk of {len(articles)} raw articles. Extract candidates:\n\n{articles_text}",
        }],
    )
    parsed = _extract_json(response.content[0].text)
    return parsed.get('items', [])


def _process_mapreduce(articles: list[dict]) -> dict:
    """Chunked candidate extraction + a single dedup/rerank pass."""
    chunks = [
        articles[i:i + MAPREDUCE_CHUNK_SIZE]
        for i in range(0, len(articles), MAPREDUCE_CHUNK_SIZE)
    ]
    print(f"[processor] mapreduce: {len(chunks)} chunks of up to {MAPREDUCE_CHUNK_SIZE}")

    all_candidates: list[dict] = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"  chunk {idx}/{len(chunks)}: extracting candidates from {len(chunk)} articles...")
        items = _extract_candidates(chunk)
        print(f"    → {len(items)} candidates")
        all_candidates.extend(items)

    print(f"[processor] mapreduce: reranking {len(all_candidates)} candidates...")
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8000,
        system=RERANK_PROMPT.format(max_items=MAX_DIGEST_ITEMS),
        messages=[{
            "role": "user",
            "content": (
                f"Candidate items from {len(chunks)} chunks "
                f"({len(all_candidates)} total). Dedup and rank:\n\n"
                + json.dumps(all_candidates, ensure_ascii=False)
            ),
        }],
    )
    result = _extract_json(response.content[0].text)
    # Ensure items_evaluated reflects the actual candidate pool, not just what
    # the model echoes back.
    result.setdefault('items_evaluated', len(all_candidates))
    result.setdefault('items_included', len(result.get('items', [])))
    return result


def process_articles(articles: list[dict]) -> dict:
    """Dispatch to the configured LLM strategy."""
    if not articles:
        return {'items': [], 'items_evaluated': 0, 'items_included': 0}
    if LLM_STRATEGY == 'mapreduce':
        return _process_mapreduce(articles)
    return _process_single(articles)


def run_processor(dry_run: bool = False):
    """Main processor entry point."""
    with track_run('process', dry_run=dry_run) as run:
        prefix = '[processor][dry-run] ' if dry_run else '[processor] '
        print(f"{prefix}Strategy: {LLM_STRATEGY} | model: {CLAUDE_MODEL}")
        print(f"{prefix}Fetching unprocessed articles...")
        articles = get_unprocessed_articles()
        run['input_count'] = len(articles)

        if not articles:
            run['status'] = 'skipped'
            run['output_count'] = 0
            print(f"{prefix}No new articles to process.")
            return None

        print(f"{prefix}Processing {len(articles)} articles with Claude...")
        result = process_articles(articles)

        now = datetime.now(timezone.utc)
        digest_date = now.strftime('%Y-%m-%d')

        if dry_run:
            print(f"{prefix}LLM result (would-be digest, NOT persisted):")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            run['output_count'] = len(result.get('items', []))
            run['metadata'] = {
                'digest_date': digest_date,
                'strategy': LLM_STRATEGY,
            }
            return None

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
        run['metadata'] = {
            'digest_id': digest_id,
            'digest_date': digest_date,
            'strategy': LLM_STRATEGY,
        }
        return digest_id


if __name__ == '__main__':
    run_processor()
