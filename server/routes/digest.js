import { Router } from 'express';
import supabase from '../middleware/supabase.js';

const router = Router();

/**
 * GET /api/digest/latest
 * Returns today's (or most recent) published digest with all items.
 */
router.get('/latest', async (req, res) => {
  try {
    // Get the most recent published digest
    const { data: digest, error: dErr } = await supabase
      .from('digests')
      .select('*')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(1)
      .single();

    if (dErr || !digest) {
      return res.json({ meta: null, items: [] });
    }

    // Fetch items with source and category joins
    const { data: items, error: iErr } = await supabase
      .from('digest_items')
      .select(`
        id, headline, what, why, url, time_label, published_at, tags, rank, is_rumor,
        categories ( name ),
        sources ( name, favicon, url )
      `)
      .eq('digest_id', digest.id)
      .order('rank', { ascending: true });

    if (iErr) throw iErr;

    // Fetch extra sources for all items
    const itemIds = items.map((i) => i.id);
    const { data: extras } = await supabase
      .from('item_extra_sources')
      .select('item_id, sources ( name, favicon, url )')
      .in('item_id', itemIds);

    const extrasMap = {};
    (extras || []).forEach((e) => {
      if (!extrasMap[e.item_id]) extrasMap[e.item_id] = [];
      extrasMap[e.item_id].push(e.sources);
    });

    // Shape response to match frontend contract
    const shaped = items.map((item) => ({
      id: item.id,
      category: item.categories.name,
      time: item.time_label,
      publishedAt: item.published_at,
      source: item.sources,
      extraSources: extrasMap[item.id] || [],
      headline: item.headline,
      what: item.what,
      why: item.why,
      url: item.url,
      tags: item.tags,
    }));

    res.json({
      meta: {
        date: digest.digest_date,
        sourcesScanned: digest.sources_scanned,
        itemsEvaluated: digest.items_evaluated,
        itemsIncluded: digest.items_included,
        generatedAt: digest.generated_at,
        updatedAt: digest.updated_at,
      },
      items: shaped,
    });
  } catch (err) {
    console.error('[digest/latest]', err);
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

/**
 * GET /api/digest/dates
 * Returns list of available digest dates.
 */
router.get('/dates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('digests')
      .select('digest_date, status')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(90);

    if (error) throw error;
    res.json(data.map((d) => d.digest_date));
  } catch (err) {
    console.error('[digest/dates]', err);
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

/**
 * GET /api/digest/week/:which
 * :which = 'current' | 'previous'
 */
router.get('/week/:which', async (req, res) => {
  try {
    const { which } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    let targetMonday;
    if (which === 'current') {
      targetMonday = thisMonday;
    } else {
      targetMonday = new Date(thisMonday);
      targetMonday.setDate(targetMonday.getDate() - 7);
    }

    const weekStart = targetMonday.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('week_start', weekStart)
      .single();

    if (error || !data) {
      return res.json(null);
    }

    res.json({
      period: data.period_label,
      stats: data.stats,
      overview: data.overview,
      topStories: data.top_stories,
      emergingThemes: data.emerging_themes,
      categoryBreakdown: data.category_breakdown,
    });
  } catch (err) {
    console.error('[digest/week]', err);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

/**
 * GET /api/digest/:date
 * Fetch digest for a specific date (YYYY-MM-DD).
 */
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const { data: digest, error: dErr } = await supabase
      .from('digests')
      .select('*')
      .eq('digest_date', date)
      .eq('status', 'published')
      .single();

    if (dErr || !digest) {
      return res.json({ meta: null, items: [] });
    }

    const { data: items, error: iErr } = await supabase
      .from('digest_items')
      .select(`
        id, headline, what, why, url, time_label, published_at, tags, rank, is_rumor,
        categories ( name ),
        sources ( name, favicon, url )
      `)
      .eq('digest_id', digest.id)
      .order('rank', { ascending: true });

    if (iErr) throw iErr;

    const itemIds = items.map((i) => i.id);
    const { data: extras } = await supabase
      .from('item_extra_sources')
      .select('item_id, sources ( name, favicon, url )')
      .in('item_id', itemIds);

    const extrasMap = {};
    (extras || []).forEach((e) => {
      if (!extrasMap[e.item_id]) extrasMap[e.item_id] = [];
      extrasMap[e.item_id].push(e.sources);
    });

    const shaped = items.map((item) => ({
      id: item.id,
      category: item.categories.name,
      time: item.time_label,
      publishedAt: item.published_at,
      source: item.sources,
      extraSources: extrasMap[item.id] || [],
      headline: item.headline,
      what: item.what,
      why: item.why,
      url: item.url,
      tags: item.tags,
    }));

    res.json({
      meta: {
        date: digest.digest_date,
        sourcesScanned: digest.sources_scanned,
        itemsEvaluated: digest.items_evaluated,
        itemsIncluded: digest.items_included,
        generatedAt: digest.generated_at,
        updatedAt: digest.updated_at,
      },
      items: shaped,
    });
  } catch (err) {
    console.error('[digest/:date]', err);
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

export default router;
