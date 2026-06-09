# AGENTS.md

Guidance for AI agents working in this repository.

## Product

**private-ai-content-factory** — a private, AI-powered content factory for autonomous YouTube Shorts production (per [GitHub description](https://github.com/MrAbdull/private-ai-content-factory)).

## Current repository state

This repo is a **greenfield placeholder**. As of the initial commit it contains only `README.md`. There is no application source, dependency manifest, Docker setup, CI config, or documented run commands yet.

| Task | Status |
|------|--------|
| Install dependencies | No manifests (`package.json`, `requirements.txt`, `pyproject.toml`, etc.) |
| Lint | Not configured |
| Test | Not configured |
| Build | Not configured |
| Run dev server | Not configured |

When manifests or scripts are added, update this file and the VM update script accordingly.

## Inferred future stack (not implemented)

Likely components once development starts:

- **LLM API** or local model (script/copy generation)
- **FFmpeg** (video assembly for Shorts)
- **YouTube Data API** (upload/publish)
- Optional: TTS, image/video generation, object storage, workers/queues

## Cursor Cloud specific instructions

### Services

No services are defined or required today. There is nothing to start, stop, or health-check.

### Toolchain on the VM

The cloud VM already provides tooling useful for this product:

- **Node.js** via nvm (`node`, `npm`)
- **Python 3.12** (`python3`, `pip`)
- **FFmpeg** (`ffmpeg`)

Verify with:

```bash
node --version
python3 --version
ffmpeg -version | head -1
```

### Dependency refresh

The VM update script conditionally installs only when standard manifest files exist (see `.cursor/environment.json` or cloud agent VM config). No install step runs until those files are committed.

### When code lands

After the first dependency manifest is added:

1. Let the update script install deps on pod startup.
2. Document install, lint, test, build, and dev commands in `README.md` and here.
3. Start any required services (API, workers, DB, etc.) in **tmux** sessions — do not add service startup to the update script.
4. For Docker-based stacks, install/start Docker in the setup session only; keep `docker compose up` out of the update script.

### Git

- Default branch: `main`
- Remote: `https://github.com/MrAbdull/private-ai-content-factory`
