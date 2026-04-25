#!/usr/bin/env node
/**
 * Verify Phase 5 RLS policies.
 *
 *   - Public content (categories, sources, digests with status=published,
 *     items/extras for those digests, weekly_summaries) must be readable
 *     by the anon role.
 *   - Protected tables (raw_articles, subscribers, pipeline_runs) must
 *     return zero rows under anon.
 *   - Service key still has full access.
 *
 * Usage: node scripts/verify_rls.js
 *
 * Exits 0 if all checks pass, 1 otherwise.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY in .env');
  process.exit(2);
}

const anon = createClient(SUPABASE_URL, ANON_KEY);
const service = createClient(SUPABASE_URL, SERVICE_KEY);

const failures = [];

async function expectVisible(label, query) {
  const { data, error } = await query;
  if (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`  ✗ ${label}: ${error.message}`);
    return;
  }
  console.log(`  ✓ ${label}: ${data.length} rows`);
}

async function expectHidden(label, query) {
  const { data, error } = await query;
  if (error) {
    // Some setups error on RLS-blocked reads; treat as hidden.
    console.log(`  ✓ ${label}: blocked (${error.message})`);
    return;
  }
  if (data.length > 0) {
    failures.push(`${label}: expected hidden, got ${data.length} rows`);
    console.error(`  ✗ ${label}: expected hidden, got ${data.length} rows`);
    return;
  }
  console.log(`  ✓ ${label}: 0 rows (hidden)`);
}

console.log('Anon — public reads (must succeed)');
await expectVisible('  categories',         anon.from('categories').select('id,name'));
await expectVisible('  sources',            anon.from('sources').select('id,name'));
await expectVisible('  digests (pub)',      anon.from('digests').select('id,status').eq('status', 'published'));
await expectVisible('  digest_items',       anon.from('digest_items').select('id,digest_id'));
await expectVisible('  item_extra_sources', anon.from('item_extra_sources').select('id'));
await expectVisible('  weekly_summaries',   anon.from('weekly_summaries').select('id'));

console.log('\nAnon — protected reads (must return 0 rows)');
await expectHidden(' raw_articles',  anon.from('raw_articles').select('id'));
await expectHidden(' subscribers',   anon.from('subscribers').select('id'));
await expectHidden(' pipeline_runs', anon.from('pipeline_runs').select('id'));

console.log('\nService key — full access (must succeed)');
await expectVisible('  raw_articles',  service.from('raw_articles').select('id'));
await expectVisible('  subscribers',   service.from('subscribers').select('id'));
await expectVisible('  pipeline_runs', service.from('pipeline_runs').select('id'));

// Sanity: anon-readable digest_items count must equal service-readable count
// for items linked to published digests. If RLS is dropping rows we can't see
// here, the route shape will degrade silently.
const { data: pubDigests } = await service
  .from('digests')
  .select('id')
  .eq('status', 'published');
const pubIds = (pubDigests || []).map((d) => d.id);
if (pubIds.length > 0) {
  const { count: anonCount } = await anon
    .from('digest_items')
    .select('id', { count: 'exact', head: true })
    .in('digest_id', pubIds);
  const { count: serviceCount } = await service
    .from('digest_items')
    .select('id', { count: 'exact', head: true })
    .in('digest_id', pubIds);
  if (anonCount !== serviceCount) {
    failures.push(`digest_items count mismatch: anon=${anonCount} service=${serviceCount}`);
    console.error(`\n  ✗ digest_items count mismatch (anon=${anonCount}, service=${serviceCount})`);
  } else {
    console.log(`\n  ✓ digest_items parity (anon=${anonCount}, service=${serviceCount})`);
  }
}

if (failures.length > 0) {
  console.error(`\nFAILED — ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll RLS checks passed.');
