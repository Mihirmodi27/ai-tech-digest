import { Router } from 'express';
import supabase from '../middleware/supabase.js';

const router = Router();

/**
 * GET /api/categories
 * Returns all categories in sort order.
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, sort_order')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[categories]', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
