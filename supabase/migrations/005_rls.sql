-- =====================================================
-- Migration 005 — RLS on every table; anon SELECT policies for public
-- content only. Pipeline keeps using the service key (which bypasses RLS),
-- web tier swaps to the anon key in the same commit.
--
-- Tables WITH anon read access (public content):
--   categories, sources, digests (published), digest_items (via digest),
--   item_extra_sources (via item→digest), weekly_summaries
--
-- Tables WITHOUT anon access (service-key only):
--   raw_articles, subscribers, pipeline_runs
-- =====================================================

ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources                ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_extra_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs          ENABLE ROW LEVEL SECURITY;

-- Public-content read policies. Drops first so the migration is re-runnable.
DROP POLICY IF EXISTS anon_read_categories ON categories;
DROP POLICY IF EXISTS anon_read_sources    ON sources;
DROP POLICY IF EXISTS anon_read_digests    ON digests;
DROP POLICY IF EXISTS anon_read_items      ON digest_items;
DROP POLICY IF EXISTS anon_read_extras     ON item_extra_sources;
DROP POLICY IF EXISTS anon_read_weekly     ON weekly_summaries;

CREATE POLICY anon_read_categories ON categories
  FOR SELECT TO anon USING (true);

CREATE POLICY anon_read_sources ON sources
  FOR SELECT TO anon USING (true);

CREATE POLICY anon_read_digests ON digests
  FOR SELECT TO anon USING (status = 'published');

CREATE POLICY anon_read_items ON digest_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digests d
      WHERE d.id = digest_items.digest_id
        AND d.status = 'published'
    )
  );

CREATE POLICY anon_read_extras ON item_extra_sources
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digest_items di
      JOIN digests d ON d.id = di.digest_id
      WHERE di.id = item_extra_sources.item_id
        AND d.status = 'published'
    )
  );

CREATE POLICY anon_read_weekly ON weekly_summaries
  FOR SELECT TO anon USING (true);

-- raw_articles, subscribers, pipeline_runs intentionally have no policies.
-- With RLS enabled and no policy, the anon role gets zero rows.
