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


def _name_id_map(table: str, names: list[str]) -> dict[str, int]:
    """Fetch {name: id} for a set of rows in one query. Unknown names are absent."""
    unique = list({n for n in names if n})
    if not unique:
        return {}
    result = supabase.table(table).select('id, name').in_('name', unique).execute()
    return {row['name']: row['id'] for row in (result.data or [])}


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
    """Insert digest items + their extra sources in one batch each.

    Resolves category/source names to IDs with one SELECT per table (no N+1).
    """
    if not items:
        return

    # Collect every category + source name we'll need (primary + extras).
    all_categories = [i.get('category', '') for i in items]
    all_sources = []
    for i in items:
        if i.get('source'):
            all_sources.append(i['source'])
        all_sources.extend(i.get('extra_sources', []) or [])

    cat_map = _name_id_map('categories', all_categories)
    src_map = _name_id_map('sources', all_sources)

    rows = []
    for rank, item in enumerate(items, start=1):
        category_id = cat_map.get(item.get('category'))
        source_id = src_map.get(item.get('source'))
        if category_id is None or source_id is None:
            # Skip malformed items rather than inserting with bogus FKs.
            print(f"  [warn] skipping item (unknown category/source): {item.get('headline')!r}")
            continue
        rows.append({
            'digest_id': digest_id,
            'category_id': category_id,
            'source_id': source_id,
            'headline': item['headline'],
            'what': item['what'],
            'why': item['why'],
            'url': item.get('url', '#'),
            'time_label': item.get('time', ''),
            'published_at': item.get('published_at'),
            'tags': item.get('tags', []),
            'rank': rank,
            'is_rumor': item.get('category') == 'Rumors & Unconfirmed',
        })

    if not rows:
        return
    inserted = supabase.table('digest_items').insert(rows).execute().data or []

    # Build extra-source rows aligned with the items we actually inserted.
    extras_rows = []
    # inserted is in the same order as `rows`, which matches the filtered items.
    insert_index = 0
    for item in items:
        if cat_map.get(item.get('category')) is None or src_map.get(item.get('source')) is None:
            continue
        inserted_id = inserted[insert_index]['id']
        insert_index += 1
        for extra_name in item.get('extra_sources', []) or []:
            extra_id = src_map.get(extra_name)
            if extra_id is None or extra_id == src_map.get(item.get('source')):
                continue
            extras_rows.append({
                'item_id': inserted_id,
                'source_id': extra_id,
                'url': item.get('url', '#'),
            })

    if extras_rows:
        supabase.table('item_extra_sources').insert(extras_rows).execute()


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
