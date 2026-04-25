-- =====================================================
-- Migration 004 — record which prompt version produced each digest.
-- The pipeline writes the prompt's filename (e.g. 'daily_digest.v1') so
-- you can trace any digest back to the exact prompt that produced it.
-- =====================================================

ALTER TABLE digests
  ADD COLUMN IF NOT EXISTS prompt_version TEXT;

ALTER TABLE weekly_summaries
  ADD COLUMN IF NOT EXISTS prompt_version TEXT;
