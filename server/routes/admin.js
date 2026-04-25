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

/**
 * POST /api/admin/run
 * Trigger a GitHub Actions workflow_dispatch. Defaults to the legacy
 * full-pipeline workflow (daily-digest.yml). Pass {"workflow": "scan.yml"}
 * to target a different one.
 *
 * Requires GITHUB_TOKEN (PAT with `workflow` scope) and GITHUB_REPO
 * (e.g. "Mihirmodi27/ai-tech-digest") in the env.
 */
router.post('/run', requireAdmin, async (req, res) => {
  const githubToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!githubToken || !repo) {
    return res.status(500).json({
      error: 'GITHUB_TOKEN and GITHUB_REPO must be set on the server',
    });
  }

  const workflow = (req.body && req.body.workflow) || 'daily-digest.yml';
  const ref = (req.body && req.body.ref) || 'main';
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;

  try {
    const ghRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref }),
    });

    if (ghRes.status === 204) {
      return res.json({ ok: true, workflow, ref });
    }
    const body = await ghRes.text();
    console.error('[admin/run] github error', ghRes.status, body);
    return res.status(502).json({
      error: 'github dispatch failed',
      status: ghRes.status,
      detail: body.slice(0, 500),
    });
  } catch (err) {
    console.error('[admin/run]', err);
    res.status(500).json({ error: 'Failed to trigger workflow' });
  }
});

export default router;
