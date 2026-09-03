# Ask MapAble — privacy and observability

## What reaches the model

Prefer:

- functional access requirements
- pseudonymous / internal session ids (`sessionId`)
- minimal typed `pageContext` (`pathname`, `mapableModule`)
- short recent message history (widget sends ≤8 turns)

Avoid sending to models when not required:

- diagnosis
- NDIS number
- full street address
- health history
- financial account details
- identity documents

## Logging

`POST /api/mapable/ask` logs:

- truncated query summaries for agent runs (`slice(0, 500)` where already used)
- tool names / counts
- handoff metadata without raw disability payloads where possible

Do not log API keys, cookies, or full participant profiles in ordinary server logs.

## Tracing

AI Gateway / OpenAI tracing (when enabled by platform config) should retain
operational metadata (latency, tool names, error codes) and avoid exporting
unnecessary sensitive prompt payloads. Disabling all observability is not the
goal — minimise sensitive content instead.

## Secrets

- No OpenAI / Gateway key in browser bundles, React components, localStorage, prompts, or tests.
- Production Ask uses existing Gateway env vars; CareOS fabric uses existing `OPENAI_API_KEY`.
- No third Ask-only key convention.
