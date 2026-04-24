# AI & Tech Digest

A daily AI & tech news portal. A background pipeline scans ~12 sources every morning, uses Claude to dedupe and synthesize them into ~25 ranked items across 10 categories, and emails the digest out. The web app (Linear-inspired dark UI) lets you browse today's items or view weekly summaries.

**Live:** [ai-tech-digest-sage.vercel.app](https://ai-tech-digest-sage.vercel.app)

---

## How it works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  RSS + HN   │ ──▶ │ Claude (LLM) │ ──▶ │  Supabase   │ ◀── │  Web UI  │
│  (12 srcs)  │     │ dedup + rank │     │  (Postgres) │     │ (Vercel) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
       │                    │                                       
       └──── Python pipeline (GitHub Actions, daily 08:00 IST) ─────
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Resend email│
                            └─────────────┘
```

- **Frontend** — Vite + React 18, Tailwind, shadcn/ui
- **API** — Express, serverless on Vercel
- **Database** — Supabase (Postgres)
- **Pipeline** — Python: RSS scan → Claude synthesis → Resend email
- **Schedule** — GitHub Actions cron at 02:30 UTC daily

---

## Project structure

```
src/             React frontend (components, hooks, styles)
server/          Express API routes backed by Supabase
api/             Vercel serverless entry point (wraps server/)
pipeline/        Python pipeline (scanners, processors, distributors)
supabase/        SQL schema + seed data
.github/         Daily cron workflow
```

---

## Run locally

### Prereqs

- Node 20+, Python 3.12+, a Supabase project, an Anthropic API key, (optional) a Resend API key

### 1. Install & configure

```bash
npm install
cp .env.example .env          # then fill in your keys
```

### 2. Set up the database

In the Supabase dashboard → SQL Editor, run these files in order:

1. `supabase/migrations/001_initial_schema.sql` — creates tables
2. `supabase/seed.sql` — seeds 10 categories + 12 sources

### 3. Start the frontend + API

```bash
npm run dev
```

Opens Vite on `:3000` and Express on `:3001` concurrently.

### 4. Run the pipeline manually (optional)

```bash
cd pipeline
pip install -r requirements.txt
python3 run_daily.py           # full pipeline
python3 run_daily.py scan      # RSS scan only
python3 run_daily.py process   # Claude synthesis only
python3 run_daily.py email     # email dispatch only
python3 run_daily.py weekly    # weekly summary
```

---

## Environment variables

See `.env.example`. The pipeline needs:

| Var | Purpose |
|-----|---------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Database access |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | LLM synthesis |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` | Daily email |

The web app additionally needs `SUPABASE_ANON_KEY`. On Vercel, add these under **Project Settings → Environment Variables**. For the GitHub Actions pipeline, add them under **Repo Settings → Secrets → Actions**.

---

## Deploy

- **Web app** — already on Vercel. `git push` to `main` triggers a deploy.
- **Pipeline** — GitHub Actions runs `.github/workflows/daily-digest.yml` at 02:30 UTC daily; `workflow_dispatch` lets you trigger it manually from the Actions tab.

---

## The 10 categories

Models & Updates · Products & Launches · Funding & M&A · Research & Papers · Open Source & Tooling · Infrastructure & Compute · Policy & Regulation · Industry Signals · Vertical Watch · Rumors & Unconfirmed

Each item has a headline, the **what** (facts), the **why** (significance), a source, optional extra sources, and tags.
