# Tracking plan: AusPost PAC + location search

MapAble does not yet ship a product analytics SDK (Amplitude/PostHog). Events below use `trackProductEvent` in `lib/analytics/product-analytics.ts`, which dispatches `mapable-analytics` custom events when `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true`.

## Enable locally

```env
NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true
```

Attach a listener in your analytics bootstrap:

```ts
window.addEventListener("mapable-analytics", (e: Event) => {
  const { event, properties } = (e as CustomEvent).detail;
  // ampli.track(event, properties);
});
```

## Events (priority 3)

| Event | When | Properties |
|-------|------|------------|
| `search_autocomplete_results_shown` | Autocomplete fetch succeeds | `context`, `field`, `mode`, `result_count`, `degraded`, `degraded_reason`, `location_provider` |
| `search_autocomplete_suggestion_selected` | User picks a suggestion | `context`, `field`, `suggestion_type`, `location_provider`, `has_postcode` |
| `auspost_postcode_search_completed` | Server: `/api/auspost/postcode/search` 200 | `locality_count`, `has_state_filter` (server log / future pipeline) |
| `auspost_postage_quote_requested` | Server: domestic calculate 200 | `service_code`, `from_postcode`, `to_postcode` (no PII beyond postcodes) |

## Naming conventions

- snake_case event names
- snake_case property keys
- `context`: `homepage` \| `provider_finder`
- `location_provider`: `auspost_pac` \| `local_db` \| `static_fallback` \| `unknown`

## Surfaces instrumented

- `components/search/AccessibleAutocomplete.tsx` — results shown, suggestion selected
- `lib/search/auspost-location-adapter.ts` — tags `locationSource` on suggestions
- `lib/search/local-location-adapter.ts` — tags `locationSource` on suggestions

## Out of scope (this pass)

- Amplitude MCP / Ampli codegen
- Server-side event ingestion API
- Postage UI (no consumer UI yet)
