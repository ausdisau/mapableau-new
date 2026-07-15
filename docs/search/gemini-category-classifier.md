# Gemini service category classifier

Dedicated **Google Gemini** step that maps free-text NDIS search queries to a canonical `service_categories` slug. Uses the same AI SDK model wiring as the NL interpreter (`@ai-sdk/google` or Vercel AI Gateway).

The full NL interpreter remains the source of truth for multi-field extraction (location, access, provider name). This classifier is a focused accelerator for `serviceCategorySlug` hints and a standalone API.

## When to use

- Need only a category slug (not full filter extraction).
- Faster / cheaper category routing before or alongside `POST /api/search/interpret`.
- Prefer Gemini over training a Hugging Face small model ([hf-category-classifier.md](./hf-category-classifier.md)).

## Runtime

`lib/search/interpreter/gemini-category-classifier.ts`:

1. Loads the Prisma / static fallback category catalog.
2. Calls `generateObject` with Gemini (`SEARCH_INTERPRETER_MODEL`, default `google/gemini-3.5-flash`).
3. Validates the returned slug against the catalog.
4. Accepts only when model confidence ≥ 0.45; otherwise returns `slug: null`.

`lib/search/interpreter/classifier-hint.ts` tries Gemini first, then the optional HF hub model. Failures never block interpretation.

## Environment

| Variable | Purpose |
| -------- | ------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Google Generative AI (Gemini) key |
| `AI_GATEWAY_API_KEY` / `VERCEL_AI_GATEWAY_API_KEY` | Preferred Vercel AI Gateway (alternative to direct Google key) |
| `SEARCH_INTERPRETER_MODEL` | Gateway-style id, e.g. `google/gemini-3.5-flash` |
| `SEARCH_INTERPRETER_ENABLED` | Set `false` to disable all interpreter LLM paths |
| `SEARCH_INTERPRETER_GEMINI_CLASSIFIER` | Set `false` to skip Gemini category classification (default: on when keys exist) |

Set at least one of `GOOGLE_GENERATIVE_AI_API_KEY` or `AI_GATEWAY_API_KEY`. See [`.env.example`](../../.env.example).

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
  "source": "gemini",
  "engineId": "ai-sdk/google/gemini-3.5-flash",
  "configured": true
}
```

`503` when no Gemini / gateway key is configured.

## Integration with interpret

`interpretSearchQuery` calls `classifyCategorySlugHint` before the full NL parse and passes a validated slug into `resolveServiceCategory`. Keyword / ES / OpenSearch resolvers still run as fallbacks.

## Testing

```bash
pnpm test tests/gemini-category-classifier.test.ts
```

## Related

- [Natural-language interpreter](./nl-interpreter.md)
- [HF category classifier](./hf-category-classifier.md) — optional trained small-model fallback
