# ms-frontend

MeetScript web client — React 19 + Chakra UI v3.

## Stack

- **React 19** with TypeScript
- **Chakra UI v3** for UI components
- **Vite 6** for bundling
- **Jotai** for state management
- **react-i18next** for i18n
- **react-router-dom v7** for routing
- **Vitest** for unit tests

## Development

```bash
pnpm install
pnpm dev        # start dev server (proxies /api and /ws to localhost:8000)
pnpm build      # production build
pnpm preview    # preview production build
pnpm lint       # lint
pnpm test       # run unit tests
```

## WebSocket Protocol

The consumer WebSocket (`/ws/meet/consume`) receives JSON messages keyed by `utt_id` and `seq_id`.
A higher `seq_id` for the same `utt_id` supersedes the previous partial result (progressive repair).
When `is_final: true` the utterance is committed.  A `type: "correction"` event allows post-hoc
LLM-based fixes to already-final utterances.

## Testing

Pure-logic unit tests live in `src/__tests__/`.  Run with:

```bash
pnpm test
```
