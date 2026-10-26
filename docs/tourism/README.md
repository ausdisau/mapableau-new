# MapAble Tourism — Sydney pilot with optional OpenTripMap discovery

**Status:** draft code on GitHub; not deployed or independently verified live.

## Pages and API
- \`/tourism\`: curated Sydney destinations with sourced accessibility details, plus opt-in OpenTripMap attraction search.
- \`/tourism/plan\`: deterministic local 1–5-day Sydney trip outline.
- \`/tourism/trips/sydney-demo\`: accessible day-by-day itinerary editing, saving and reset.
- \`/tourism/places/[id]\`: venue evidence. Imported OpenTripMap stop details are available after the user saves them to a local itinerary.
- \`/tourism/map\`: curated map/list view; imported attractions appear in the saved itinerary map/list.
- \`/api/tourism/opentripmap\`: server-only GET proxy. Optional \`q\` (3–80 characters for autosuggest) and \`kind\` (\`interesting_places\`, \`museums\`, \`historic\`, \`natural\`). Fixed Sydney centre, 7 km search radius and maximum 30 returned places.

## Activation and licence checks

**Disabled by default:** Configure these in local \`.env.local\` or secure deployment environment only AFTER the organisation confirms API licence, usage, regulatory/jurisdiction and sustainability requirements.

\`\`\`dotenv
OPENTRIPMAP_ENABLED=true
OPENTRIPMAP_API_KEY=YOUR_KEY_FROM_OPENTRIPMAP
\`\`\`

Never commit a real key or expose it as \`NEXT_PUBLIC_\`. Client requests target the MapAble server; the upstream \`apikey\` query parameter remains on the server. Failure, disabled key, timeouts and rate limits present safe messages; the curated experience remains usable. The service receives search terms or categories around a fixed Sydney centre, not a user's current location or disability preferences.

Official documentation:
- https://dev.opentripmap.org/product
- https://dev.opentripmap.org/price
- https://dev.opentripmap.org/legal/short-offer

At the time of implementation, the free tier was listed for **non-commercial use only** (5,000 requests/day; 10 requests/second). Being a charity does not automatically establish that all social-enterprise uses qualify as non-commercial. Confirm directly with OpenTripMap before using live service credentials; the API account is not connected in this PR.

OpenTripMap advertises ODbL database licensing. Preserve OpenTripMap, OpenStreetMap/Wikimedia provenance and appropriate original-source attribution; review derivative database and redistribution obligations before storing or combining datasets at scale. See https://www.openstreetmap.org/copyright. Supplier provides data as-is and may discontinue free access.

## Data and safety boundaries

- OpenTripMap is a tourism POI data source, **not an independently verified accessibility database**. All imported stops have \`stepFree.status="unknown"\` and \`accessibleToilet.status="unknown"\`; filters on curated places do not label imported places as accessible.
- Upstream list records (XID, name, kinds, approximate coordinates) are validated and bounded to Sydney before returning. IDs, names and categories are limited; no media copyright licence is assumed.
- Imported records have independent \`otm:\` IDs, and are never silently merged into the canonical MapAble Place/AccessObservation store.
- A small selected-POI snapshot is stored in the browser with the user's example itinerary. No profile, diagnosis, current GPS location or selected accessibility preference is sent upstream.
- Saved trips can add, reorder and remove imported stops. The venue route works for saved imported entries; clearing local browser storage also clears the saved snapshot.
- The illustrative Sydney trip still has six manually researched destinations reviewed 27 October 2026. Neither these nor imported POIs constitute on-site audits.
- No accessible routing certification, live transit outage data, reservations, tickets, payments or Alpaca Travel API integrations.

## Verification

After checking out the branch:
\`\`\`bash
pnpm install --frozen-lockfile
pnpm exec vitest run tests/tourism-demo.test.ts tests/tourism-opentripmap.test.ts
pnpm exec eslint app/tourism app/api/tourism components/tourism lib/tourism tests/tourism-demo.test.ts tests/tourism-opentripmap.test.ts
pnpm type-check
pnpm dev
\`\`\`

Then visit \`/tourism\`. Without a key the API should say "not configured" while curated content continues. With an approved sandbox key and enabled flag, manually query OpenTripMap, inspect source attributions, add a result to Day 2, open \`/tourism/trips/sydney-demo\`, view its map pin and evidence state, reload, reorder it, and remove it.

Manual WCAG 2.2 AA review remains necessary: screen-reader landmarks/status, full keyboard flow, visible focus, 200% text zoom/reflow, mobile layout, interrupted requests and non-map access to places. Confirm external source links, map tile availability and actual licensing before approving the PR.

## Future work

Provider adapter for Alpaca GraphQL (optional, separate), durable data storage with consent, venue-access verification linkage via canonical source IDs and manual reviewer approval, caching/rate-limit controls for live public release, and destination expansion beyond Sydney. Do not move OpenTripMap data into verified access records without explicit evidence review.
