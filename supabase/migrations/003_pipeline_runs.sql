-- =====================================================
-- Migration 003 — pipeline_runs observability table
-- One row per phase invocation. The pipeline writes here on every run;
-- the /api/admin/runs endpoint reads it.
-- =====================================================

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id              SERIAL PRIMARY KEY,
  phase           TEXT NOT NULL CHECK (phase IN ('scan','process','distribute','weekly')),
  run_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','succeeded','failed','skipped')),
  input_count     INT,
  output_count    INT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_date
  ON pipeline_runs(run_date DESC, phase);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status
  ON pipeline_runs(status) WHERE status = 'failed';
