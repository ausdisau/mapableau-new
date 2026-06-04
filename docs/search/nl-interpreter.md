# Natural-language search interpreter

Provider Finder and homepage search can call **`POST /api/search/interpret`** to turn free-text queries (for example *"Wheelchair accessible transport near Parramatta"*) into structured filters and a canonical **`service_categories`** slug.

Prisma remains the **source of truth** for categories. Optional Elasticsearch (phase 2) and a Hugging Face classifier (phase 3) only accelerate slug resolution.

## Architecture

1. **Parse** — Vercel AI SDK `generateObject` with an NDIS-aware system prompt (`lib/search/interpreter/parse-query.ts`).
2. **Resolve category** — Validate LLM slug, then ES `multi_match`, then keyword scoring against Prisma (`lib/search/interpreter/resolve-service-category.ts`).
3. **Resolve access** — Map `access` text to `ACCESS_NEEDS` ids (`lib/search/interpreter/resolve-access-needs.ts`).
4. **Client** — Provider Finder and homepage apply fields and optional `supportType` chip (`lib/search/apply-interpretation.ts`).

Trivial queries skip the LLM via `looksLikeNaturalLanguage` to save latency and cost.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `SEARCH_INTERPRETER_ENABLED` | Set to `false` to force passthrough (default: enabled when keys exist) |
| `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY` | Preferred: Vercel AI Gateway |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Fallback: `@ai-sdk/google` |
| `SEARCH_INTERPRETER_MODEL` | Gateway-style id, e.g. `google/gemini-3.5-flash` |
| `ES_URL`, `ES_API_KEY` | Optional Elasticsearch replica (phase 2) |
| `ES_SERVICE_CATEGORY_ALIAS` | Default `mapable_service_categories_current` |
| `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` | Optional HF model repo (phase 3) |
| `HF_TOKEN` or `HUGGINGFACE_API_KEY` | HF Inference API for classifier hint |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | Emit `search_query_interpreted` in the browser |

See [`.env.example`](../../.env.example).

## API (agents)

- **Path:** `POST /api/search/interpret`
- **Operation id:** `searchInterpretQuery`
- **Headers:** Response includes `X-Operation-Id: searchInterpretQuery`
- **Body:** `{ "query": string, "context"?: "homepage" | "provider_finder" }`
- **Rate limit:** 30 requests / minute / IP (in-memory per instance)
- **OpenAPI:** [`docs/api/openapi-search-interpret.yaml`](../api/openapi-search-interpret.yaml)

Example:

```bash
curl -sS -X POST "$BASE_URL/api/search/interpret" \
  -H "Content-Type: application/json" \
  -d '{"query":"OT assessment in Parramatta","context":"provider_finder"}'
```

## Conversational Provider Finder (Chat SDK + AI SDK UI)

On `/provider-finder`, the **Chat to find providers** panel uses `@ai-sdk/react` `useChat` with `DefaultChatTransport` against `POST /api/provider-finder/chat`. Each turn:

1. Runs the same `interpretSearchQuery` pipeline as `/api/search/interpret`.
2. Streams a short assistant reply (AI SDK `streamText` when configured, otherwise a template).
3. Emits a `data-finderInterpretation` part so the UI can apply filters and show results.

Optional **Slack** bot (Chat SDK): `lib/provider-finder/chat-sdk/find-bot.ts` + `POST /api/chat/slack` when `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` are set. Slash commands: `/finder`, `/providers`.

## UI behaviour

- **Provider Finder** — On search submit, calls the interpret API, fills `query`, `location`, `serviceQuery`, `accessQuery`, `providerName`, and maps slug → `supportType` when known.
- **Chat panel** — Same filter application on each assistant turn; **Show results** submits the search view.
- **Low confidence** — When `parsed && confidence < 0.6`, shows: *AI-suggested filters — adjust if needed.*
- **Homepage** — Debounced interpret before redirect to `/provider-finder?...` when the combined query is at least 3 characters.

## Analytics

When `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true`, the client dispatches `mapable-analytics` with event **`search_query_interpreted`** and properties:

- `context`, `parsed`, `confidence`, `service_category_slug`, `engine_id`

## Catalog setup

Seed service categories (same data autocomplete uses):

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/ensure-search-autocomplete.sql
npx tsx prisma/seed-search-autocomplete.ts
```

## Testing

```bash
pnpm test tests/search-interpreter.test.ts
```

Resolver tests mock Prisma via `listServiceCategories` fallback catalog; no network calls.

## Related docs

- [Predictive search suggestions](../search-predictive-suggestions.md) — autocomplete (rules-based)
- [Elasticsearch service categories](./elasticsearch-service-categories.md) — phase 2 replica
- [HF category classifier](./hf-category-classifier.md) — phase 3 optional accelerator
