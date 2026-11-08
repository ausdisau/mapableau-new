# MapAble Tourism — Sydney prototype

**Status:** draft code on GitHub; not a production tourism product. Local mock data only by default.

This is **not** a WCAG conformance claim, **not** a live Alpaca integration, and **not** certified access evidence.

## Pages

- `/tourism`: photo hero, search, featured places, 3-day teaser, evidence explainer, optional OpenTripMap discovery.
- `/tourism/plan`: labelled planner. Generate uses `MockTourismProvider` and stores the trip in `localStorage`.
- `/tourism/trips/sydney-demo`: day timeline with rest and unverified transport buffers; Earlier/Later, move-to-day, remove, add.
- `/tourism/places/[id]`: gallery, address, map, evidence panel.
- `/tourism/map`: curated stops with list-first / optional map.
- `/api/tourism/opentripmap`: opt-in server proxy. Disabled unless `OPENTRIPMAP_ENABLED=true` and a server-side key is set.

Tourism routes are **not** on the public informational inventory. `robots: { index: false }`.

## Mock vs live

| Surface | Default | Notes |
| --- | --- | --- |
| Sydney dataset | On | Six places reviewed 27 October 2026. Status is `documented` or `requires_confirmation` only. |
| `MockTourismProvider` | On | `isMock: true`. In-memory + `localStorage` key `mapable-tourism-sydney-demo-v1`. |
| Planner preferences | Local | `mapable-tourism-sydney-demo-prefs-v1`. Never sent to OpenTripMap, Alpaca or analytics. |
| OpenTripMap | Off | Server-keyed, unused by default, never treated as access evidence. |
| Alpaca GraphQL | Stub | `lib/tourism/alpaca-provider.ts` throws. Placeholders: `ALPACA_GRAPHQL_ENDPOINT`, `ALPACA_API_TOKEN`. No network client. |

Reset/delete on the itinerary page clears both storage keys.

## Photography

Card and hero images in `public/tourism/` are **prototype illustrations**, not venue photographs. Licence text lives with each place record and in `public/tourism/LICENCE.md`.

## Activation (OpenTripMap only)

```dotenv
OPENTRIPMAP_ENABLED=true
OPENTRIPMAP_API_KEY=YOUR_KEY_FROM_OPENTRIPMAP
```

Never commit a real key or expose it as `NEXT_PUBLIC_`. Confirm licence before enabling.

Do not set Alpaca env vars expecting a live itinerary. The stub will still refuse.

## Limitations

- Sydney only.
- Transport legs are labelled unverified connection / not a calculated travel time.
- Opera House access varies by venue and performance.
- SEA LIFE includes steep or narrow sections.
- Maritime Museum historic vessels are not wheelchair-accessible.
- TfNSW lifts change; confirm independently.
- No bookings, payments, or independently verified badges on this demo.

## Verification

```bash
pnpm exec vitest run tests/tourism-demo.test.ts tests/tourism-opentripmap.test.ts
pnpm exec eslint app/tourism app/api/tourism components/tourism lib/tourism tests/tourism-demo.test.ts tests/tourism-opentripmap.test.ts
pnpm type-check
```

Playwright: `tests/a11y/tourism.spec.ts` runs axe `wcag2aa` / `wcag22aa` serious/critical checks. That is automated assistance, not a WCAG certification.

## Remaining work

Durable storage with consent, destination expansion, linking independently reviewed Access observations, and a real Alpaca adapter only after credentials, schema and commercial rights are verified. Do not move OpenTripMap or Alpaca POIs into verified access records without explicit evidence review.
