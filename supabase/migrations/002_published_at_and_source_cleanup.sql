-- =====================================================
-- Migration 002
-- 1. Add published_at column to digest_items (replaces string time_label)
-- 2. Backfill ArXiv's RSS URL and remove the two paywalled sources
-- =====================================================

-- 1. Add published_at; keep time_label for now (used by older rows / email template)
ALTER TABLE digest_items
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Source cleanup
UPDATE sources
  SET rss_url = 'http://export.arxiv.org/rss/cs.AI'
  WHERE name = 'ArXiv' AND rss_url IS NULL;

-- Bloomberg and The Information have no free RSS; remove them so the scanner
-- doesn't waste cycles. Any raw_articles / digest_items referencing them will
-- block the delete — so we soft-deactivate instead of DELETE.
UPDATE sources
  SET active = false
  WHERE name IN ('Bloomberg', 'The Information');
