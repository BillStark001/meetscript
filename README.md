# MeetScript

A real-time meeting transcription and translation tool.

## Architecture

| Package | Description |
|---------|-------------|
| `ms-frontend` | React 19 + Chakra UI v3 web client |
| `ms-server` | FastAPI + SQLAlchemy async backend |
| `ms-client-win` | Windows system-audio capture client (placeholder) |
| `ms-client-mac` | macOS system-audio capture client (placeholder) |

**Backend stack:** FastAPI · Uvicorn · SQLAlchemy (async) · OpenAI Whisper · DeepL

**Frontend stack:** React 19 · Chakra UI v3 · Vite · i18next · Jotai

## Prerequisites

- Python ≥ 3.9
- Node.js ≥ 18
- pnpm ≥ 8

## Setup

```bash
# Install JS dependencies (all packages)
pnpm install

# Install Python dependencies
cd ms-server && pip install -r requirements.txt
```

## Development

```bash
# Start the backend (hot-reload)
pnpm dev:server

# Start the frontend dev server
pnpm dev:frontend
```

## Deployment

```bash
# Build frontend and launch the server (localhost only)
pnpm deploy

# Allow LAN access
pnpm deploy -- --allow-lan

# With Nginx reverse-proxy
pnpm deploy:nginx

# With Nginx + TLS
pnpm deploy:nginx -- --cert /path/to/cert --server yourdomain.com
```

## Environment Variables (backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `sqlite+aiosqlite:///./meetscript.db` | SQLAlchemy database URL (supports SQLite, MySQL, PostgreSQL) |
| `ALLOW_LAN` | `false` | Bind server to `0.0.0.0` instead of `127.0.0.1` |
| `MOUNT_STATIC` | `false` | Serve the built frontend from within FastAPI |

## Database

The backend supports any database supported by SQLAlchemy async drivers:

```
# SQLite (default)
DB_URL=sqlite+aiosqlite:///./meetscript.db

# PostgreSQL
DB_URL=postgresql+asyncpg://user:pass@localhost/meetscript

# MySQL
DB_URL=mysql+aiomysql://user:pass@localhost/meetscript
```

## Streaming Protocol

The WebSocket consumer endpoint (`/ws/meet/consume`) emits JSON messages:

```jsonc
// Partial result (may be superseded by later seq_id)
{ "type": "transcription", "utt_id": 1, "seq_id": 1, "text": "Hello", "lang": "en", "start": 0, "end": 500, "is_final": false }

// Final result
{ "type": "transcription", "utt_id": 1, "seq_id": 3, "text": "Hello world.", "lang": "en", "start": 0, "end": 1200, "is_final": true }

// Async LLM correction (after is_final)
{ "type": "correction", "utt_id": 1, "original": "Box Troll", "replacement": "Voxtral" }
```

Clients should key displayed text by `utt_id` and replace content when a higher `seq_id` arrives for the same utterance.

## Testing

```bash
# Backend
cd ms-server && python -m pytest tests/ -v

# Frontend
cd ms-frontend && pnpm test
```
