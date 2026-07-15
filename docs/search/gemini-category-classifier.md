# Gemini / OpenAI service category classifier

Dedicated LLM step that maps free-text NDIS search queries to a canonical `service_categories` slug. Uses Vercel AI SDK with **Google Gemini**, **OpenAI**, or the **Vercel AI Gateway**.

The full NL interpreter remains the source of truth for multi-field extraction (location, access, provider name). This classifier is a focused accelerator for `serviceCategorySlug` hints and a standalone API.

## When to use

- Need only a category slug (not full filter extraction).
- Faster / cheaper category routing before or alongside `POST /api/search/interpret`.
- Prefer an LLM over training a Hugging Face small model ([hf-category-classifier.md](./hf-category-classifier.md)).

## Runtime

`lib/search/interpreter/gemini-category-classifier.ts`:

1. Loads the Prisma / static fallback category catalog.
2. Calls `generateObject` via `getInterpreterModel()` (Google, OpenAI, or gateway).
3. Validates the returned slug against the catalog.
4. Accepts only when model confidence ≥ 0.45; otherwise returns `slug: null`.

`lib/search/interpreter/classifier-hint.ts` tries this LLM classifier first, then the optional HF hub model. Failures never block interpretation.

## Environment

| Variable | Purpose |
| -------- | ------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Google Generative AI (Gemini) key |
| `OPENAI_API_KEY` | Direct OpenAI key |
| `AI_GATEWAY_API_KEY` / `VERCEL_AI_GATEWAY_API_KEY` | Preferred Vercel AI Gateway (alternative to direct keys) |
| `SEARCH_INTERPRETER_MODEL` | e.g. `google/gemini-3.5-flash` or `openai/gpt-4.1-nano` |
| `SEARCH_INTERPRETER_ENABLED` | Set `false` to disable all interpreter LLM paths |
| `SEARCH_INTERPRETER_GEMINI_CLASSIFIER` | Set `false` to skip category classification (default: on when keys exist) |

Set at least one of `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`, or `AI_GATEWAY_API_KEY`. See [`.env.example`](../../.env.example).

### Provider selection

`lib/search/interpreter/get-model.ts` chooses the backend from `SEARCH_INTERPRETER_MODEL`:

- Gateway key set → Vercel AI Gateway (any `provider/model` id)
- `openai/...` or `gpt-*` → `@ai-sdk/openai`
- `google/...` or `gemini-*` → `@ai-sdk/google`

## API

- **Path:** `POST /api/search/classify-category`
- **Operation id:** `searchClassifyCategory`
- **Headers:** `X-Operation-Id: searchClassifyCategory`
- **Body:** `{ "query": string }`
- **Rate limit:** 60 requests / minute / IP
- **OpenAPI:** [`docs/api/openapi-search-classify-category.yaml`](../api/openapi-search-classify-category.yaml)

Example:

```bash
curl -sS -X POST "$BASE_URL/api/search/classify-category" \
  -H "Content-Type: application/json" \
  -d '{"query":"Wheelchair taxi near Parramatta"}'
```

Success response:

```json
{
  "query": "Wheelchair taxi near Parramatta",
  "slug": "accessible-transport",
  "confidence": 0.92,
  "source": "llm",
  "engineId": "ai-sdk/openai/gpt-4.1-nano",
  "configured": true
}
```

`503` when no Gemini / OpenAI / gateway key is configured.

## OpenAI

```bash
OPENAI_API_KEY=sk-...
SEARCH_INTERPRETER_MODEL=openai/gpt-4.1-nano
SEARCH_INTERPRETER_GEMINI_CLASSIFIER=true
```

This project's OpenAI service-account keys may not include every chat model (e.g. `gpt-4o-mini`). Prefer a model listed for the key via `GET https://api.openai.com/v1/models` — `gpt-4.1-nano` and `gpt-5-nano` are typical low-cost options.
## Integration with interpret

`interpretSearchQuery` calls `classifyCategorySlugHint` before the full NL parse and passes a validated slug into `resolveServiceCategory`. Keyword / ES / OpenSearch resolvers still run as fallbacks.

## Testing

```bash
pnpm test tests/gemini-category-classifier.test.ts tests/interpreter-get-model.test.ts
```

## Related

- [Natural-language interpreter](./nl-interpreter.md)
- [HF category classifier](./hf-category-classifier.md) — optional trained small-model fallback
