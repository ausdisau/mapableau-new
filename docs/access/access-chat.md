# MapAble Access chat search

Natural-language accessibility place search for MapAble Access.

## Env

```
OPENAI_API_KEY=
GEMINI_API_KEY=
ACCESS_CHAT_ENABLED=true
ACCESS_CHAT_OPENAI_MODEL=gpt-4.1-mini
ACCESS_CHAT_GEMINI_MODEL=google/gemini-2.5-flash
```

`GEMINI_API_KEY` falls back to `GOOGLE_GENERATIVE_AI_API_KEY` or AI Gateway.

## Flow

1. `POST /api/access-chat/message` — parse intent → hybrid search → access-fit rank → synthesize (+ safety review when uncertain)
2. OpenAI primary: intent, rewrite, synthesis
3. Gemini: fallback, safety review, grounding stub
4. Vector search is abstracted (`lib/access-chat/vector-store.ts`) and no-op in v1

## UI

- Panel on `/access` (“Ask Access chat”)
- Full page `/access/chat`
