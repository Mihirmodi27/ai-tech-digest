import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Admin endpoints read tables that anon role cannot see (e.g. pipeline_runs).
// Use a separate service-key client so this keeps working after Phase 5 swaps
// the default web-tier client to the anon key.
const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured' });
  }
  if (req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

router.get('/runs', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await adminSupabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[admin/runs]', err);
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

export default router;
