# AGENTS.md

Guidance for AI agents working in **private-ai-content-factory**.

## Product

Private single-user AI content studio for autonomous YouTube Shorts production. **Not SaaS** — no billing, subscriptions, multi-tenancy, or public registration.

## Tech Stack

- **Next.js 15** (App Router, `src/`)
- **Supabase** (auth + Postgres)
- **YouTube Data API** (OAuth + publishing)
- **Modular engines** in `src/lib/engines/`

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |

## Cursor Cloud specific instructions

### Services

| Service | Required | Command |
|---------|----------|---------|
| Next.js dev server | Yes | `npm run dev` (port 3000) |

Supabase is required for production auth/DB but **not** for local dev — the app uses mock data when `NEXT_PUBLIC_SUPABASE_URL` is unset. Middleware skips auth redirects without Supabase.

### Dev without secrets

1. `npm install`
2. `npm run dev`
3. Open `/dashboard` directly (no login when Supabase unset)

### With Supabase

1. Copy `.env.example` → `.env.local`
2. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor
3. Create a single user in Supabase Auth

### Long-running processes

Start the dev server in **tmux**:

```bash
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s next-dev -c /workspace -- npm run dev
```

### Key directories

- `src/lib/engines/` — all AI orchestration logic; extend here for new features
- `src/app/dashboard/` — dashboard pages
- `src/app/api/` — API routes
- `supabase/migrations/` — database schema

### Do not

- Add billing, subscriptions, or multi-tenancy
- Copy code from `justreadyresumes-platform` (unrelated project)
