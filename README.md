# AI & Tech Digest

A daily AI & tech news portal. A four-phase pipeline scans ~10 sources every morning, uses Claude to dedupe and synthesize them into ~25 ranked items across 10 categories, then emails the digest out. The web app (Linear-inspired dark UI) lets you browse today's items, view weekly summaries, and trigger the pipeline on demand.

**Live:** [ai-tech-digest-sage.vercel.app](https://ai-tech-digest-sage.vercel.app)

---

## How it works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  RSS + HN   │ ──▶ │ Claude (LLM) │ ──▶ │  Supabase   │ ◀── │  Web UI  │
│  (10 srcs)  │     │ dedup + rank │     │  (Postgres) │     │ (Vercel) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
       │                    │                                       
       └────── Python pipeline, four GitHub Actions workflows ──────
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Resend email│
                            └─────────────┘
```

- **Frontend** — Vite + React 18, Tailwind, shadcn/ui
- **API** — Express, served as Vercel serverless functions
- **Database** — Supabase (Postgres) with row-level security on every table
- **Pipeline** — Python: scan → process → distribute, plus a weekly summary
- **Schedule** — four independent crons; full table below

---

## The pipeline

Four independent phases, each on its own cron with its own secrets:

| Workflow | Cron (UTC) | Job |
|---|---|---|
| `scan.yml` | `0 2 * * *` | Fetch RSS feeds + HN, stage in `raw_articles` |
| `process.yml` | `30 2 * * *` | Send to Claude → dedup + rank → write `digests` + `digest_items` |
| `distribute.yml` | `0 3 * * *` | Email today's digest to subscribers via Resend |
| `weekly.yml` | `0 4 * * 0` | Sundays only — generate the weekly summary |

The legacy `daily-digest.yml` still exists for manual end-to-end runs (`workflow_dispatch` only, no cron).

Every phase records to a `pipeline_runs` table on entry, exit, and failure — counts, errors, metadata. Inspect via `GET /api/admin/runs`.

---

## Run from the UI

The header has a **Run** button that triggers `daily-digest.yml` directly via GitHub's `workflow_dispatch` API. First click prompts for your `ADMIN_TOKEN` and stores it in `localStorage`. The button cycles `Run` → `Running…` → `Triggered`.

To use it on the live site, you need `ADMIN_TOKEN`, `GITHUB_TOKEN` (PAT with **Actions: Read and write** on this repo), and `GITHUB_REPO` set on Vercel.

---

## Project structure

```
src/                  React frontend (components, hooks, styles)
server/               Express API routes (digest, categories, admin)
api/                  Vercel serverless entry point (wraps server/)
pipeline/
  run_daily.py        CLI orchestrator for all four phases
  scanners/           RSS + Hacker News fetchers
  processors/         LLM digest + weekly summarizer
  distributors/       Resend email
  prompts/            Versioned prompt files (.v1.md, .v2.md, …)
  runs.py             pipeline_runs context manager
  db.py               Supabase wrapper
scripts/
  verify_rls.js       End-to-end check that anon RLS policies are correct
supabase/
  migrations/         SQL migrations 001 → 005, run in filename order
  seed.sql            Categories + sources
.github/workflows/    scan, process, distribute, weekly, daily-digest (legacy)
```

---

## Run locally

### Prereqs

- Node 20+, Python 3.12+, a Supabase project, an Anthropic API key
- Optional: Resend API key (email), GitHub PAT (Run button)

### 1. Install & configure

```bash
npm install
cp .env.example .env          # then fill in your keys
```

### 2. Set up the database

In the Supabase dashboard → SQL Editor, run **all of these in filename order**:

```
supabase/migrations/001_initial_schema.sql                     base tables
supabase/seed.sql                                              categories + sources
supabase/migrations/002_published_at_and_source_cleanup.sql    real timestamps
supabase/migrations/003_pipeline_runs.sql                      observability
supabase/migrations/004_prompt_version.sql                     prompt tracking
supabase/migrations/005_rls.sql                                row-level security
```

> Run any future `supabase/migrations/NNN_*.sql` files in filename order when you pull new commits.

### 3. Start the frontend + API

```bash
npm run dev                   # Vite on :3000, Express on :3001
```

### 4. Run the pipeline manually

```bash
cd pipeline
pip install -r requirements.txt
python3 run_daily.py                            # full pipeline
python3 run_daily.py scan                       # one phase
python3 run_daily.py weekly previous            # last week's summary
python3 run_daily.py process --dry-run          # LLM call, no DB writes
python3 run_daily.py process --model claude-haiku-4-5-20251001
```

`--dry-run` skips all writes (still calls Claude). `--model` overrides `CLAUDE_MODEL` for that invocation.

---

## Environment variables

See `.env.example`. Three categories:

**Pipeline (Python)** — runs in GitHub Actions (set as repo secrets) and locally (`.env`):

| Var | Purpose |
|-----|---------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Full DB access (bypasses RLS) |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | LLM calls |
| `RESEND_API_KEY`, `EMAIL_FROM` | Daily email (recipients come from `subscribers` table) |
| `LLM_STRATEGY` | Optional: `single` (default) or `mapreduce` |
| `MAPREDUCE_CHUNK_SIZE` | Optional: chunk size when `LLM_STRATEGY=mapreduce` (default 30) |

**Web tier** — set on Vercel (and locally for `npm run dev`):

| Var | Purpose |
|-----|---------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Public reads (respects RLS) |
| `SUPABASE_SERVICE_KEY` | Used by `/api/admin/*` to read protected tables |
| `ADMIN_TOKEN` | Bearer token for `/api/admin/*` (generate with `openssl rand -hex 32`) |
| `GITHUB_TOKEN` | PAT with **Actions: Read and write** on this repo (used by Run button) |
| `GITHUB_REPO` | e.g. `Mihirmodi27/ai-tech-digest` |

**GitHub Actions** — set as repo secrets (**Settings → Secrets and variables → Actions**). Each workflow only needs the keys it uses; safest is to set all four:

```
SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL
RESEND_API_KEY, EMAIL_FROM            (only for distribute.yml)
```

---

## Iterating on prompts

Prompts live as versioned files in `pipeline/prompts/`:

```
daily_digest.v1.md             default single-prompt strategy
daily_digest_candidate.v1.md   chunk extractor (mapreduce strategy)
daily_digest_rerank.v1.md      final dedup + rank (mapreduce strategy)
weekly_summary.v1.md           weekly summarizer
```

To iterate: copy `daily_digest.v1.md` → `daily_digest.v2.md`, edit, change one `load_prompt()` argument in `pipeline/processors/llm_processor.py`, deploy. Every digest record stores its `prompt_version`, so you can trace any output back to the exact prompt that produced it.

---

## Deploy

- **Web app** — Vercel auto-deploys on push to `main`.
- **Pipeline** — GitHub Actions handles the four daily/weekly crons. Manual runs via the **Run** button in the UI, or **Actions tab → workflow → Run workflow**.

---

## The 10 categories

Models & Updates · Products & Launches · Funding & M&A · Research & Papers · Open Source & Tooling · Infrastructure & Compute · Policy & Regulation · Industry Signals · Vertical Watch · Rumors & Unconfirmed

Each item has a headline, the **what** (facts), the **why** (significance), a source, optional extra sources, and tags.
