# Private AI Content Factory

A private, single-user AI-powered content studio for autonomous YouTube Shorts production, management, optimization, scheduling, and publishing.

**Not a SaaS product** — no billing, subscriptions, multi-tenancy, public registration, or payment systems.

## Features

- **Multi-channel YouTube management** — connect multiple channels with independent publishing schedules
- **Content Blast Engine** — generate 10–500+ Shorts from a single topic
- **AI Production Orchestrator** — autonomous workflow decisions without manual selection
- **Channel Personality Engine** — per-channel voice, style, and branding adaptation
- **11 content styles** — documentary, educational, viral, storytelling, and more
- **Video Resource Orchestrator** — intelligent Pexels/Pixabay footage selection
- **Multi-Version Testing** — 3+ versions per Short with automatic best-version selection
- **AI Thumbnail Generator** — CTR-predicted thumbnail variants
- **Auto-Repurposing** — multiple angles from one source
- **Trend Discovery** — YouTube, Google Trends, Reddit, news monitoring
- **Evergreen Content Queue** — automatic schedule gap filling
- **Failed Video Learning** — learns from underperforming content
- **Performance Intelligence Database** — permanent historical learning
- **Content Safety & Compliance** — pre-publish validation
- **Three publishing modes** — manual, semi-automatic, fully automatic
- **Content Library & Calendar** — search, filter, drag-and-drop scheduling
- **Analytics Dashboard** — views, retention, CTR, growth tracking
- **Automation Orchestrator** — GitHub Actions, Cloudflare, Supabase, Vercel routing
- **AI Resource Management** — automatic provider switching on quota/failure

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Database & Auth | Supabase |
| Publishing | YouTube Data API |
| Footage | Pexels, Pixabay |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project
- Google Cloud project with YouTube Data API enabled

### Install

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
```

### Database

Run the migration in your Supabase SQL editor:

```bash
# File: supabase/migrations/001_initial_schema.sql
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase configured, the app runs in dev mode with mock data.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Architecture

```
src/
├── app/                    # Next.js App Router pages & API routes
├── components/             # UI components (dashboard, shadcn-style)
├── lib/
│   ├── engines/            # Modular AI engines (orchestrators)
│   ├── supabase/           # Supabase client utilities
│   └── youtube/            # YouTube Data API client
└── types/                  # Domain types
```

### Engines (`src/lib/engines/`)

Each engine is a self-contained module:

- `production-orchestrator` — autonomous production planning
- `channel-personality` — per-channel content adaptation
- `content-blast` — bulk Short generation
- `video-resource-orchestrator` — footage selection
- `multi-version` — A/B version testing
- `thumbnail` — thumbnail generation & CTR prediction
- `repurposing` — multi-angle content from sources
- `trend-discovery` — trend monitoring
- `evergreen-queue` — schedule gap filling
- `failed-video-learning` — underperformance analysis
- `safety-compliance` — pre-publish checks
- `resource-management` — provider routing & quotas
- `automation-orchestrator` — end-to-end publishing pipeline

## Environment Variables

See `.env.example` for all required variables.

## License

Private — single-user use only.
