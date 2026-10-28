# Access Demand Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fail-closed, source-backed SA3 regional demand intelligence overlay to MapAble Access through GAIS without ingesting restricted Care Sector Demand Map data.

**Architecture:** Extend GAIS with a sibling `lib/gais/demand/` domain that fetches and normalises the official NDIA SA3 participant CSV, fetches matching ABS ASGS 2016 SA3 GeoJSON geometry, joins by SA3 code, and returns a bounded GeoJSON FeatureCollection through `/api/gais/demand/regions`. Render the data as an optional low-emphasis Leaflet regional layer plus an accessible text/list equivalent; keep the numeric planning index out of participant-facing copy.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Zod, React-Leaflet/Leaflet, official NDIA CSV, official ABS ArcGIS REST GeoJSON.

**Spec:** `docs/superpowers/specs/2026-09-18-access-demand-intelligence-design.md`

## Global Constraints

- Do not call, ingest, persist, redistribute, or depend on Care Sector Demand Map runtime data.
- Use public regional aggregates only; never combine this layer with participant identity, saved location, disability profile, funding, plan budget, or service history to infer individual need.
- Preserve suppressed NDIA values such as `<11` as unknown; never coerce them to zero or an estimated count.
- Match NDIA `SA3Cd2016` only to ABS ASGS 2016 / Edition 2 geometry.
- Participant-facing UI must not display the strategy index or describe regional statistics as individual need, accessibility quality, eligibility, service availability, or a recommendation.
- All server and client feature flags default off.
- No Prisma schema or migration change in this slice.
- Maintain map/list parity and WCAG 2.2 AA interaction patterns.

---

### Task 1: Demand domain contracts and deterministic calculations

**Files:**
- Create: `lib/gais/demand/contracts.ts`
- Create: `lib/gais/demand/metrics.ts`
- Create: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Produces: `GaisDemandRegionMetric`, `GaisDemandEvidence`, `GaisDemandContextLabel`, `calculateDemandStrategyIndex()`, `classifyDemandContext()`.

- [ ] **Step 1: Write failing contract/metric tests**

Cover index bounds, missing growth, neutral context labels, suppressed values, and prohibited participant-facing language.

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm vitest run tests/gais-demand-intelligence.test.ts`
Expected: FAIL because `@/lib/gais/demand/*` does not exist.

- [ ] **Step 3: Implement minimal contracts and pure metric functions**

The strategy index formula is exactly:

```ts
scale = Math.min(100, participantCount / 75)
growth = clamp(((yoyGrowthPercent + 5) / 25) * 100, 0, 100)
index = growthAvailable ? 0.7 * scale + 0.3 * growth : scale
```

Return `null` when participant count is unknown/suppressed.

- [ ] **Step 4: Run targeted test and verify GREEN**

Run: `pnpm vitest run tests/gais-demand-intelligence.test.ts`
Expected: PASS for Task 1 cases.

- [ ] **Step 5: Commit**

```bash
git add lib/gais/demand/contracts.ts lib/gais/demand/metrics.ts tests/gais-demand-intelligence.test.ts
git commit -m "feat(gais): define regional demand contracts"
```

### Task 2: NDIA SA3 CSV adapter

**Files:**
- Create: `lib/gais/demand/ndia-sa3.ts`
- Modify: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Produces: `parseNdiaSa3Csv(csv: string): NdiaSa3Observation[]`
- Produces: `buildLatestNdiaSa3Metrics(observations): Map<string, GaisDemandRegionMetric>`

- [ ] **Step 1: Add failing parser tests**

Use inline CSV fixtures containing quoted fields, two reporting years, ordinary counts, and `<11` suppression.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm vitest run tests/gais-demand-intelligence.test.ts`
Expected: FAIL because adapter functions are missing.

- [ ] **Step 3: Implement CSV parsing and latest/prior selection**

No external CSV dependency. Parse RFC4180-style quoted cells with a small state machine. Parse `DDMMMYYYY` reporting dates in UTC. Treat nonnumeric counts as suppressed/unknown. For prior-year selection choose the observation for the same SA3 whose report date is closest to 365 days before the latest, constrained to 300-430 days earlier.

- [ ] **Step 4: Run and verify GREEN**

Run: `pnpm vitest run tests/gais-demand-intelligence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/gais/demand/ndia-sa3.ts tests/gais-demand-intelligence.test.ts
git commit -m "feat(gais): parse NDIA SA3 participant demand data"
```

### Task 3: ABS geometry adapter and joined GeoJSON projection

**Files:**
- Create: `lib/gais/demand/abs-sa3.ts`
- Create: `lib/gais/demand/geojson.ts`
- Modify: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Produces: `buildAbsSa3QueryUrl(bounds, baseUrl)`
- Produces: `joinDemandRegionsToGeometry(features, metrics)` returning a FeatureCollection.

- [ ] **Step 1: Add failing URL/join tests**

Assert envelope/bounds parameters, `outSR=4326`, `f=geojson`, SA3-code join, Polygon and MultiPolygon pass-through, and omission of unmatched geometry.

- [ ] **Step 2: Run and verify RED**

- [ ] **Step 3: Implement URL builder and deterministic join**

Support common ArcGIS property aliases by checking `SA3_CODE_2016`, `sa3_code_2016`, `SA3_CODE16`, and `sa3_code16` in that order.

- [ ] **Step 4: Run and verify GREEN**

- [ ] **Step 5: Commit**

### Task 4: Server-side source fetcher, cache, flags, and API route

**Files:**
- Modify: `lib/config/mapable-gais.ts`
- Create: `lib/gais/demand/service.ts`
- Create: `app/api/gais/demand/regions/route.ts`
- Modify: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Produces: `mapableGaisDemandFlags`
- Produces: `loadDemandRegionsInBounds(bounds, deps?)`
- API: `GET /api/gais/demand/regions?minLat=&minLng=&maxLat=&maxLng=`

- [ ] **Step 1: Add failing flag/service tests**

Assert fail-closed defaults, master-flag dependency, source URL overrides, 8-second timeout, six-hour NDIA in-process cache, and public response claim metadata.

- [ ] **Step 2: Run and verify RED**

- [ ] **Step 3: Implement minimal source service and API**

Default NDIA URL: `https://dataresearch.ndis.gov.au/media/4241/download?attachment=`.
Default ABS URL: `https://geo.abs.gov.au/arcgis/rest/services/ASGS2016/SA3/MapServer/0/query`.

Return `502` for upstream failure and a valid empty FeatureCollection for no matching regions.

- [ ] **Step 4: Run and verify GREEN**

- [ ] **Step 5: Commit**

### Task 5: Client hook and fail-closed demand layer flag

**Files:**
- Modify: `lib/gais/client/flags.ts`
- Create: `lib/gais/demand/client.ts`
- Create: `hooks/useGaisDemandRegionsInBounds.ts`
- Modify: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Produces: `isClientGaisDemandLayerEnabled()`
- Produces: `fetchGaisDemandRegionsInBounds()`
- Produces: `useGaisDemandRegionsInBounds()`

- [ ] **Step 1: Add failing client-flag tests**
- [ ] **Step 2: Run and verify RED**
- [ ] **Step 3: Implement client flag/fetch/hook using 400ms debounce and AbortController**
- [ ] **Step 4: Run and verify GREEN**
- [ ] **Step 5: Commit**

### Task 6: Accessible Leaflet regional overlay and textual equivalent

**Files:**
- Create: `components/gais/GaisDemandLayerToggle.tsx`
- Create: `components/gais/GaisDemandRegionDetail.tsx`
- Create: `components/gais/GaisDemandRegionList.tsx`
- Create: `components/gais/GaisDemandLeafletLayer.tsx`
- Modify: `components/accessibility-map/OpenStreetMapView.tsx`
- Modify: `components/accessibility-map/OpenStreetMapViewInner.tsx`
- Modify: `components/accessibility-map/AccessibilityMapLanding.tsx`
- Modify: `tests/gais-demand-intelligence.test.ts`

**Interfaces:**
- Participant toggle label: `Regional support context`
- Participant disclaimer: `Regional context only. It does not measure your individual needs, service availability or eligibility.`

- [ ] **Step 1: Add failing UI-source/copy contract tests**

Test exported copy constants and component-source invariants sufficient to prevent numeric strategy index exposure in participant components.

- [ ] **Step 2: Run and verify RED**

- [ ] **Step 3: Implement overlay**

Render GeoJSON polygons with low opacity and accessible popup text. Keep all numeric planning index fields out of participant components. Supply a list equivalent below the map/list result area when enabled.

- [ ] **Step 4: Run targeted test and verify GREEN**

- [ ] **Step 5: Commit**

### Task 7: Documentation and full verification

**Files:**
- Create: `docs/access-intelligence/REGIONAL_DEMAND_LAYER.md`
- Modify: `.env.example` only if the relevant GAIS section exists and can be changed without unrelated churn.

- [ ] **Step 1: Document sources, flags, claim boundaries, licensing boundary, and operations**
- [ ] **Step 2: Verify targeted tests**

```bash
pnpm vitest run tests/gais-demand-intelligence.test.ts
```

- [ ] **Step 3: Verify static correctness**

```bash
pnpm type-check
pnpm lint:app-api
pnpm lint:components
pnpm lint:lib
```

- [ ] **Step 4: Verify claim safety**

```bash
pnpm ci:production-claims
```

- [ ] **Step 5: Commit documentation and any verification fixes**

```bash
git add docs/access-intelligence/REGIONAL_DEMAND_LAYER.md .env.example
git commit -m "docs(gais): document regional demand intelligence"
```
