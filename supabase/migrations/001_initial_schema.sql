-- =====================================================
-- AI & Tech Digest — Database Schema
-- =====================================================

-- Sources: the publications/outlets we scan
CREATE TABLE IF NOT EXISTS sources (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  favicon     TEXT NOT NULL DEFAULT '',       -- single-char abbreviation for UI
  url         TEXT NOT NULL DEFAULT '',       -- homepage URL
  rss_url     TEXT,                           -- RSS feed URL (NULL if scraped)
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories for classifying digest items
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  slug  TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

-- Digests: one per day
CREATE TABLE IF NOT EXISTS digests (
  id               SERIAL PRIMARY KEY,
  digest_date      DATE NOT NULL UNIQUE,
  sources_scanned  INT NOT NULL DEFAULT 0,
  items_evaluated  INT NOT NULL DEFAULT 0,
  items_included   INT NOT NULL DEFAULT 0,
  generated_at     TEXT,                      -- e.g. '08:00 IST'
  updated_at       TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'  -- pending | processing | published
                     CHECK (status IN ('pending', 'processing', 'published')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Digest items: individual news stories
CREATE TABLE IF NOT EXISTS digest_items (
  id              SERIAL PRIMARY KEY,
  digest_id       INT NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
  category_id     INT NOT NULL REFERENCES categories(id),
  source_id       INT NOT NULL REFERENCES sources(id),
  headline        TEXT NOT NULL,
  what            TEXT NOT NULL,              -- factual summary
  why             TEXT NOT NULL,              -- significance analysis
  url             TEXT NOT NULL DEFAULT '#',
  time_label      TEXT NOT NULL DEFAULT '',   -- e.g. '2h ago'
  tags            TEXT[] NOT NULL DEFAULT '{}',
  rank            INT NOT NULL DEFAULT 999,   -- lower = more important (top 5 = 1-5)
  is_rumor        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extra sources (when multiple outlets cover the same story)
CREATE TABLE IF NOT EXISTS item_extra_sources (
  id          SERIAL PRIMARY KEY,
  item_id     INT NOT NULL REFERENCES digest_items(id) ON DELETE CASCADE,
  source_id   INT NOT NULL REFERENCES sources(id),
  url         TEXT NOT NULL DEFAULT '#'
);

-- Weekly summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id                  SERIAL PRIMARY KEY,
  week_start          DATE NOT NULL UNIQUE,  -- Monday of the week
  period_label        TEXT NOT NULL,          -- e.g. 'April 14 – April 18, 2026'
  overview            TEXT NOT NULL,
  stats               JSONB NOT NULL DEFAULT '{}',
  top_stories         JSONB NOT NULL DEFAULT '[]',
  emerging_themes     JSONB NOT NULL DEFAULT '[]',
  category_breakdown  JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw articles staging table (pipeline writes here before processing)
CREATE TABLE IF NOT EXISTS raw_articles (
  id          SERIAL PRIMARY KEY,
  source_id   INT NOT NULL REFERENCES sources(id),
  title       TEXT NOT NULL,
  url         TEXT NOT NULL UNIQUE,
  content     TEXT,
  published_at TIMESTAMPTZ,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed   BOOLEAN NOT NULL DEFAULT false
);

-- Email subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  frequency   TEXT NOT NULL DEFAULT 'daily'  -- daily | weekly
                CHECK (frequency IN ('daily', 'weekly')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digests_date ON digests(digest_date DESC);
CREATE INDEX IF NOT EXISTS idx_items_digest ON digest_items(digest_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON digest_items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_rank ON digest_items(rank);
CREATE INDEX IF NOT EXISTS idx_raw_articles_processed ON raw_articles(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week ON weekly_summaries(week_start DESC);
