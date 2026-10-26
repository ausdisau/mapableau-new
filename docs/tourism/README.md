# MapAble Tourism — Sydney frontend pilot

Status: unverified prototype, no live deployment.

Routes:
- /tourism: discovery and source-status filters
- /tourism/plan: locally generated 1–5 day Sydney itinerary
- /tourism/trips/sydney-demo: editable day list, local browser save/reset
- /tourism/places/[id]: venue evidence, reviewed 27 October 2026
- /tourism/map: map and accessible textual place list

No live API, booking, ticketing, route certification, independent accessibility inspection, payment or Alpaca integration. MapLibre uses the repository-configured tile server, potentially requiring network access. No disability diagnosis or other sensitive information is persisted. The local demo itinerary stores selected stop IDs, not access preferences.

After checking out this branch, run:
pnpm type-check
pnpm exec eslint app/tourism components/tourism lib/tourism tests/tourism-demo.test.ts
pnpm exec vitest run tests/tourism-demo.test.ts
pnpm dev

Review with keyboard, screen reader, zoom/reflow and manual venue source confirmation. Do not treat the prototype as WCAG certified or production ready. Implement Alpaca's external API only after commercial/licence/schema checks and secure server-side token storage.
