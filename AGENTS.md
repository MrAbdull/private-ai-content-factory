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

Copy `.env.example` → `.env.local`. AI uses **multi-provider fallback** (no local Ollama):

- Scripts: `GROQ_API_KEY` → `GEMINI_API_KEY` → `OPENAI_API_KEY` (optional)
- TTS: Edge TTS (free, no key) → OpenAI TTS (optional)
- Transcription: Groq Whisper → Gemini → OpenAI

Set `YOUTUBE_*`, `PEXELS_API_KEY` / `PIXABAY_API_KEY` for publish + footage. Multi-platform keys enable real cross-post; without them, mock IDs are returned.

### Platforms

Dashboard at `/dashboard/platforms`. Cross-post defaults stored in `.data/store.json`. `POST /api/content/[id]/crosspost` publishes to selected platforms.

### Cloudflare Worker

`wrangler.toml` + `worker/index.ts` — scheduled cron proxy. Set `APP_URL` and `CRON_SECRET` via wrangler secrets before deploy.

### Cron

POST `/api/cron/process` with `x-cron-secret` header. GitHub Action template in `.github/workflows/cron.yml`.

### Do not

- Add billing, multi-tenancy, or public registration
- Copy from `justreadyresumes-platform`
