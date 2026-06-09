# AGENTS.md

Private single-user AI content studio for autonomous YouTube Shorts. **Not SaaS.**

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Cron (manual) | `curl -X POST http://localhost:3000/api/cron/process -H "x-cron-secret: dev-cron-secret"` |

## Architecture

- **Dashboard**: `src/app/dashboard/`
- **API routes**: `src/app/api/`
- **AI engines**: `src/lib/engines/`
- **Production pipeline**: `src/lib/pipeline/content-pipeline.ts` (AI → versions → footage → FFmpeg → safety → schedule)
- **Persistence**: `src/lib/store/` — local JSON in `.data/store.json` (default); Supabase optional
- **Video output**: `.data/media/` served at `/api/media/[filename]`

## Cursor Cloud specific instructions

### Dev server (tmux)

```bash
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s next-dev -c /workspace -- npm run dev
```

### Without secrets

Works out of the box: mock/template AI, FFmpeg placeholder videos, local publish IDs.

### With secrets

Copy `.env.example` → `.env.local`. Set `OPENAI_API_KEY`, `YOUTUBE_*`, `PEXELS_API_KEY`, `PIXABAY_API_KEY` for full pipeline.

### Cron

POST `/api/cron/process` with `x-cron-secret` header. GitHub Action template in `.github/workflows/cron.yml`.

### Do not

- Add billing, multi-tenancy, or public registration
- Copy from `justreadyresumes-platform`
