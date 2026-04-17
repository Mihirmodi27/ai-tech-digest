"""
Supabase client wrapper for the pipeline.
"""
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_active_sources():
    """Fetch all active sources with their RSS URLs."""
    result = supabase.table('sources').select('*').eq('active', True).execute()
    return result.data


def get_category_id(name: str) -> int:
    """Look up category ID by name."""
    result = supabase.table('categories').select('id').eq('name', name).single().execute()
    return result.data['id']


def get_source_id(name: str) -> int:
    """Look up source ID by name."""
    result = supabase.table('sources').select('id').eq('name', name).single().execute()
    return result.data['id']


def insert_raw_articles(articles: list[dict]):
    """Bulk insert raw articles, skipping duplicates on URL."""
    if not articles:
        return
    supabase.table('raw_articles').upsert(
        articles, on_conflict='url', ignore_duplicates=True
    ).execute()


def get_unprocessed_articles():
    """Fetch articles not yet processed by the LLM."""
    result = (
        supabase.table('raw_articles')
        .select('*, sources(name, favicon)')
        .eq('processed', False)
        .order('fetched_at', desc=False)
        .execute()
    )
    return result.data


def mark_articles_processed(article_ids: list[int]):
    """Mark articles as processed."""
    if not article_ids:
        return
    supabase.table('raw_articles').update({'processed': True}).in_('id', article_ids).execute()


def create_digest(digest_date: str, meta: dict) -> int:
    """Create a digest record and return its ID."""
    result = supabase.table('digests').upsert({
        'digest_date': digest_date,
        'sources_scanned': meta['sources_scanned'],
        'items_evaluated': meta['items_evaluated'],
        'items_included': meta['items_included'],
        'generated_at': meta['generated_at'],
        'updated_at': meta['updated_at'],
        'status': 'published',
    }, on_conflict='digest_date').execute()
    return result.data[0]['id']


def insert_digest_items(digest_id: int, items: list[dict]):
    """Insert processed digest items."""
    rows = []
    for i, item in enumerate(items):
        rows.append({
            'digest_id': digest_id,
            'category_id': get_category_id(item['category']),
            'source_id': get_source_id(item['source']),
            'headline': item['headline'],
            'what': item['what'],
            'why': item['why'],
            'url': item.get('url', '#'),
            'time_label': item.get('time', ''),
            'tags': item.get('tags', []),
            'rank': i + 1,
            'is_rumor': item['category'] == 'Rumors & Unconfirmed',
        })
    supabase.table('digest_items').insert(rows).execute()


def save_weekly_summary(week_start: str, summary: dict):
    """Upsert a weekly summary."""
    supabase.table('weekly_summaries').upsert({
        'week_start': week_start,
        'period_label': summary['period'],
        'overview': summary['overview'],
        'stats': summary['stats'],
        'top_stories': summary['top_stories'],
        'emerging_themes': summary['emerging_themes'],
        'category_breakdown': summary['category_breakdown'],
    }, on_conflict='week_start').execute()
