# ms-server

MeetScript backend — FastAPI + SQLAlchemy async.

## Stack

- **FastAPI** + **Uvicorn** for the HTTP/WebSocket server
- **SQLAlchemy** (async) for ORM — supports SQLite, PostgreSQL, MySQL
- **OpenAI Whisper** for speech-to-text transcription
- **DeepL API** for translation
- **python-jose** for JWT authentication
- **Pydantic v2** for data validation

## Setup

```bash
pip install -r requirements.txt
```

## Running

```bash
# Development (hot-reload)
uvicorn main:app --reload --port 8000 --app-dir .

# Production (via root deploy script)
pnpm deploy            # localhost
pnpm deploy -- --allow-lan   # LAN accessible
```

## Configuration

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `sqlite+aiosqlite:///./meetscript.db` | SQLAlchemy database URL |
| `ALLOW_LAN` | `false` | Bind to `0.0.0.0` |
| `MOUNT_STATIC` | `false` | Serve frontend static files from FastAPI |

### App config (`config.yaml`)

Generated on first run.  Key fields:

- `JwtSecretKey` — change before production use
- `DeepLAuthKey` — your DeepL API key
- `TranslationTarget` — default translation target language

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/login` | POST | Authenticate and receive refresh token |
| `/api/user/register` | POST | Create a new account |
| `/api/meet/init` | POST | Start a meeting session |
| `/api/meet/close` | POST | End the current meeting session |
| `/api/meet/ws_request/provide` | GET | Get WebSocket token for audio provider |
| `/api/meet/ws_request/consume` | GET | Get WebSocket token for transcript consumer |
| `/ws/meet/provide` | WS | Stream audio to the server |
| `/ws/meet/consume` | WS | Receive live transcription events |

## Streaming Protocol

Messages sent to `/ws/meet/consume`:

```jsonc
// Partial (progressive repair — replace same utt_id on higher seq_id)
{ "type": "transcription", "utt_id": 1, "seq_id": 1, "text": "...", "lang": "en", "start": 0, "end": 400, "is_final": false }

// Final
{ "type": "transcription", "utt_id": 1, "seq_id": 3, "text": "...", "lang": "en", "start": 0, "end": 1200, "is_final": true }

// LLM correction (async, after is_final)
{ "type": "correction", "utt_id": 1, "original": "Box Troll", "replacement": "Voxtral" }
```

## Testing

```bash
python -m pytest tests/ -v
```

Unit tests in `tests/` are decoupled from Whisper and the database.
