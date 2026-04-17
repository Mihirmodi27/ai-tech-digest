# AI & Tech Digest

A daily AI & tech news digest portal with automated pipeline.

## Architecture

```
Frontend:  Vite + React 18 (src/)
API:       Express + Supabase (server/)
Pipeline:  Python — scan → LLM process → email (pipeline/)
Database:  Supabase (Postgres) — schema in supabase/migrations/
CI/CD:     GitHub Actions runs pipeline daily at 02:30 UTC (08:00 IST)
```

## Project Structure

- `src/` — React frontend (components, hooks, styles)
- `server/` — Express API routes serving Supabase data
- `pipeline/` — Python daily automation (scanner, LLM processor, email distributor)
- `supabase/` — SQL migrations and seed data
- `.github/workflows/` — Daily cron pipeline

## Key Design Decisions

- **Data contract**: API responses match the shape the frontend expects — `{ meta, items }` for daily, `{ period, stats, overview, topStories, emergingThemes, categoryBreakdown }` for weekly.
- **10 categories**: Models & Updates, Products & Launches, Funding & M&A, Research & Papers, Open Source & Tooling, Infrastructure & Compute, Policy & Regulation, Industry Signals, Vertical Watch, Rumors & Unconfirmed.
- **Each news item** has: headline, what (factual), why (analysis), category, source, extraSources, tags, url.
- **Pipeline phases**: Phase 1 scans RSS/HN → Phase 2 sends to Claude for dedup + synthesis → Phase 3 emails via Resend. Weekly summary runs on Sundays.
- **LLM processor** uses Claude (anthropic SDK) with structured JSON output.
- **Frontend** was migrated from a standalone HTML+Babel design into modular Vite+React. Original design file is in the uploads folder for reference.

## Commands

```bash
# Frontend + API dev
npm install
npm run dev              # runs Vite (port 3000) + Express (port 3001) concurrently

# Pipeline
cd pipeline
pip install -r requirements.txt
python run_daily.py          # full pipeline
python run_daily.py scan     # only scan
python run_daily.py process  # only LLM
python run_daily.py email    # only email
python run_daily.py weekly   # weekly summary

# Database
# Run supabase/migrations/001_initial_schema.sql in Supabase SQL editor
# Run supabase/seed.sql to populate categories and sources
```

## Environment Variables

See `.env.example` — needs: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY, EMAIL_FROM.

## Original Design Reference

The original standalone HTML design (with bundled React+Babel) is at:
`../uploads/AI & Tech Digest.html`

This was a single-file app with hardcoded mock data. The modularization split it into:
- React components (src/components/)
- API-driven data fetching (src/hooks/useDigest.js → server/routes/digest.js → Supabase)
- Python pipeline for real data (pipeline/)
