"""
Phase 1: Source Scanner
Fetches RSS feeds and web sources, stores raw articles in the staging table.
"""
import os
import ssl
import certifi
os.environ.setdefault('SSL_CERT_FILE', certifi.where())
ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())

import feedparser
import httpx
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup

from db import get_active_sources, insert_raw_articles
from config import MAX_ARTICLES_PER_SOURCE
from runs import track_run


def scan_rss_feed(source: dict) -> list[dict]:
    """Parse an RSS feed and return normalized article dicts."""
    if not source.get('rss_url'):
        return []

    try:
        feed = feedparser.parse(source['rss_url'])
    except Exception as e:
        print(f"  [warn] Failed to parse RSS for {source['name']}: {e}")
        return []

    articles = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=36)

    for entry in feed.entries[:MAX_ARTICLES_PER_SOURCE]:
        # Parse published date
        published = None
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
            published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)

        # Skip old articles
        if published and published < cutoff:
            continue

        # Extract clean text from summary
        content = ''
        if hasattr(entry, 'summary'):
            content = BeautifulSoup(entry.summary, 'html.parser').get_text(strip=True)

        articles.append({
            'source_id': source['id'],
            'title': entry.get('title', 'Untitled'),
            'url': entry.get('link', ''),
            'content': content[:5000],  # cap content length
            'published_at': published.isoformat() if published else None,
        })

    return articles


def scan_hacker_news() -> list[dict]:
    """Fetch top AI/ML stories from Hacker News API."""
    try:
        resp = httpx.get('https://hn.algolia.com/api/v1/search_by_date', params={
            'query': 'AI OR LLM OR GPT OR Claude OR machine learning',
            'tags': 'story',
            'numericFilters': 'points>50',
            'hitsPerPage': 20,
        }, timeout=15)
        data = resp.json()
    except Exception as e:
        print(f"  [warn] HN fetch failed: {e}")
        return []

    articles = []
    for hit in data.get('hits', []):
        articles.append({
            'source_id': None,  # will be resolved to HN source ID
            'title': hit.get('title', ''),
            'url': hit.get('url') or f"https://news.ycombinator.com/item?id={hit['objectID']}",
            'content': hit.get('story_text', '') or '',
            'published_at': hit.get('created_at'),
        })
    return articles


def run_scanner():
    """Main scanner entry point. Fetches all sources and stores raw articles."""
    with track_run('scan') as run:
        sources = get_active_sources()
        run['input_count'] = len(sources)
        if not sources:
            run['status'] = 'skipped'
            run['output_count'] = 0
            print("[scanner] No active sources configured. Skipping.")
            return {'sources_scanned': 0, 'articles_fetched': 0}

        total_articles = 0
        sources_scanned = 0

        print(f"[scanner] Scanning {len(sources)} sources...")

        for source in sources:
            print(f"  Scanning: {source['name']}...")

            if source['name'] == 'Hacker News':
                articles = scan_hacker_news()
                for a in articles:
                    a['source_id'] = source['id']
            else:
                articles = scan_rss_feed(source)

            if articles:
                insert_raw_articles(articles)
                total_articles += len(articles)
                sources_scanned += 1
                print(f"    → {len(articles)} articles")
            else:
                print(f"    → 0 articles (no RSS or empty)")

        run['output_count'] = total_articles
        run['metadata'] = {'sources_scanned': sources_scanned}

        print(f"[scanner] Done. {sources_scanned} sources, {total_articles} articles staged.")
        return {'sources_scanned': sources_scanned, 'articles_fetched': total_articles}


if __name__ == '__main__':
    run_scanner()
