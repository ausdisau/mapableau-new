# GAIS Regional Demand Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fail-closed, source-backed regional demand intelligence layer to MapAble Access/GAIS that exposes neutral participant-facing regional indicators while keeping composite strategy scoring internal.

**Architecture:** Extend GAIS with a dedicated `lib/gais/regional-demand/` bounded context rather than overloading physical accessibility feature types. The layer ingests approved public regional observations, joins them to ABS polygon geometry, normalizes internal-only indicators deterministically, strips internal strategy fields from public GeoJSON, and serves an optional map/list overlay through a separately gated `/api/gais/regions` endpoint.

**Tech Stack:** TypeScript, Next.js 15, React 18, Vitest, Zod, existing GAIS contracts, GeoJSON, Prisma-adjacent service patterns.

**Spec:** `docs/superpowers/specs/2026-09-18-gais-regional-demand-intelligence-design.md`

## Global Constraints

- Production data must come from reusable upstream/licensed sources, not copied Care Sector Demand Map data.
- Public UI exposes separate neutral indicators only; never expose internal strategy score or weights.
- Missing data remains missing; never coerce suppressed/unknown values to zero.
- Composite score requires >= 70% configured weight coverage plus at least one supply-side and one demand-side indicator.
- All regional demand flags default OFF and must fail closed.
- Public response `claimState` remains `in_development` until separately promoted.
- Aggregate public statistics only; no participant identifiers, private location history, diagnosis inference, or personalized demand scoring.
- WCAG 2.2 AA-equivalent interaction: keyboard/screen-reader-operable toggle, list/text parity, non-colour-only meaning.
- Follow TDD: every production behavior gets a failing Vitest first.

---

### Task 1: Canonical contracts and deterministic scoring

**Files:**
- Create: `lib/gais/regional-demand/contracts.ts`
- Create: `lib/gais/regional-demand/scoring.ts`
- Create: `tests/gais/regional-demand-scoring.test.ts`

**Interfaces:**
- Produces `GaisRegionLevel`, `GaisDemandIndicatorKey`, `GaisDemandEvidence`, `GaisDemandIndicator`, `GaisRegionalDemandFeature`, `RegionalDemandObservation`, `RegionalDemandSourceAdapter`.
- Produces `percentileNormalize(values: Array<number | null>): Array<number | null>`.
- Produces `computeRegionalStrategyScore(indicators: GaisDemandIndicator[], weights?: RegionalDemandWeights): RegionalStrategyResult`.

- [ ] **Step 1: Write the failing tests**
  - Ties receive the same percentile value.
  - Nulls remain null.
  - Score is unavailable below 0.70 weight coverage.
  - Score is unavailable without both demand- and supply-side evidence.
  - Eligible score renormalizes present weights and reports `weightCoverage`.

- [ ] **Step 2: Run**
  `pnpm test -- tests/gais/regional-demand-scoring.test.ts`
  **Expected:** FAIL because regional-demand contracts/scoring do not exist.

- [ ] **Step 3: Implement minimal contracts/scoring**
  - Empirical percentile rank in [0,1] using average rank for ties.
  - Default weights: scale .30, growth .20, scarcity .20, concentration .10, payment .10, access need .10.
  - Return score rounded only at presentation boundaries; keep raw number in service layer.

- [ ] **Step 4: Run**
  `pnpm test -- tests/gais/regional-demand-scoring.test.ts`
  **Expected:** PASS.

- [ ] **Step 5: Commit**
  `git commit -am "feat(gais): add regional demand scoring contracts"`

---

### Task 2: Public safety serializer and feature flags

**Files:**
- Modify: `lib/config/mapable-gais.ts`
- Modify: `lib/gais/client/flags.ts`
- Create: `lib/gais/regional-demand/public-serializer.ts`
- Create: `tests/gais/regional-demand-public.test.ts`
- Modify: `tests/gais/service.test.ts`

**Interfaces:**
- Produces `mapableGaisFlags.regionalDemandEnabled`.
- Produces `isClientGaisRegionalDemandLayerEnabled()`.
- Produces `toPublicRegionalDemandFeature(feature)` and `toPublicRegionalDemandFeatureCollection(features)`.

- [ ] **Step 1: Write failing tests**
  - Regional flag defaults false.
  - Public serializer removes `internalStrategy`.
  - Features containing only permission-required/unknown evidence are excluded from public output.
  - Public meta has `internalStrategyScoreExposed: false`.

- [ ] **Step 2: Run**
  `pnpm test -- tests/gais/regional-demand-public.test.ts tests/gais/service.test.ts`
  **Expected:** FAIL because flag and serializer do not exist.

- [ ] **Step 3: Implement**
  - Add server flag `MAPABLE_GAIS_REGIONAL_DEMAND_ENABLED`.
  - Add client flag `NEXT_PUBLIC_MAPABLE_GAIS_REGIONAL_DEMAND_LAYER`.
  - Serializer includes only evidence with `approved_public_reuse`.
  - If all evidence for every indicator is removed, omit the feature.

- [ ] **Step 4: Run**
  `pnpm test -- tests/gais/regional-demand-public.test.ts tests/gais/service.test.ts`
  **Expected:** PASS.

- [ ] **Step 5: Commit**
  `git commit -am "feat(gais): gate and sanitize regional demand output"`

---

### Task 3: Regional service boundary and API endpoint

**Files:**
- Create: `lib/gais/regional-demand/service.ts`
- Create: `lib/gais/regional-demand/fixtures.ts`
- Create: `lib/gais/regional-demand/index.ts`
- Create: `app/api/gais/regions/route.ts`
- Create: `tests/gais/regional-demand-api.test.ts`

**Interfaces:**
- Produces `listRegionalDemandFeatures({ level, bounds? })`.
- Produces `GET /api/gais/regions?level=SA3&bbox=...`.
- Initial service uses dependency-injected fixture/provider boundary; it does not claim live national ingestion.

- [ ] **Step 1: Write failing API tests**
  - Returns GAIS disabled 404 shape unless all three flags are true.
  - Rejects unsupported region level.
  - Public response is a GeoJSON FeatureCollection.
  - Meta states `evidenceScope: "regional_demand_public_context"` and `internalStrategyScoreExposed: false`.

- [ ] **Step 2: Run**
  `pnpm test -- tests/gais/regional-demand-api.test.ts`
  **Expected:** FAIL because endpoint/service do not exist.

- [ ] **Step 3: Implement**
  - Zod query schema for `level` and optional bbox.
  - Service returns only approved-public-reuse fixture-backed features in this first slice.
  - Explicit meta identifies fixture/in-development scope; no claim of national completeness.

- [ ] **Step 4: Run**
  `pnpm test -- tests/gais/regional-demand-api.test.ts`
  **Expected:** PASS.

- [ ] **Step 5: Commit**
  `git commit -am "feat(gais): add regional demand public API"`

---

### Task 4: Participant-facing accessible overlay components

**Files:**
- Create: `components/gais/GaisRegionalDemandToggle.tsx`
- Create: `components/gais/GaisRegionalDemandSummary.tsx`
- Create: `tests/gais/regional-demand-ui.test.tsx`

**Interfaces:**
- `GaisRegionalDemandToggle` accepts `enabled`, `onChange`, optional `layerEnabled`.
- `GaisRegionalDemandSummary` accepts one public regional feature and renders neutral indicator language, evidence coverage, period/source context, and caveat.

- [ ] **Step 1: Write failing UI tests**
  - Toggle is absent when client flag false.
  - Toggle has an accessible checkbox label and minimum hit target class consistent with GAIS.
  - Summary renders indicator value/label, evidence coverage, data period, and caveat.
  - Summary includes disclaimer that regional statistics do not prove individual availability/suitability.
  - No internal strategy score text is rendered.

- [ ] **Step 2: Run**
  `pnpm test -- tests/gais/regional-demand-ui.test.tsx`
  **Expected:** FAIL because components do not exist.

- [ ] **Step 3: Implement minimal components**
  - Reuse existing GAIS focus-ring token.
  - Use text plus visual indicator labels; never colour-only semantics.
  - Keep copy neutral and non-directive.

- [ ] **Step 4: Run**
  `pnpm test -- tests/gais/regional-demand-ui.test.tsx`
  **Expected:** PASS.

- [ ] **Step 5: Commit**
  `git commit -am "feat(access): add regional demand accessible UI"`

---

### Task 5: NDIA adapter contract and data-quality validation

**Files:**
- Create: `lib/gais/regional-demand/adapters/ndia-sa3-participants.ts`
- Create: `lib/gais/regional-demand/validation.ts`
- Create: `tests/gais/regional-demand-ndia-adapter.test.ts`
- Modify: `docs/architecture/gais-convergence.md`

**Interfaces:**
- Produces `parseNdiaSa3ParticipantsCsv(csv, evidence): RegionalDemandObservation[]`.
- Produces deterministic validation errors for duplicate region/reference-period rows, nonnumeric/suppressed values, wrong geography level, and licence states that cannot be publicly served.

- [ ] **Step 1: Write failing adapter tests**
  - Parses normal numeric SA3 rows.
  - Preserves `<11` as suppressed/missing rather than zero.
  - Rejects duplicate SA3/reference-period observations.
  - Emits participant-scale observations only; no composite score calculation.
  - Blocks public serving when licence state is not approved.

- [ ] **Step 2: Run**
  `pnpm test -- tests/gais/regional-demand-ndia-adapter.test.ts`
  **Expected:** FAIL because adapter/validation do not exist.

- [ ] **Step 3: Implement parser/validation**
  - Parse columns `RprtDt,StateCd,SA3Cd2016,SA3Nm2016,PrtcpntCnt`.
  - Keep ASGS edition explicit as 2016 in adapter metadata.
  - Treat `<11` as suppressed and omit numeric observation while retaining a validation/caveat record.
  - Do not crosswalk to ASGS 2021 in this slice.

- [ ] **Step 4: Run focused and GAIS suites**
  `pnpm test -- tests/gais/regional-demand-ndia-adapter.test.ts tests/gais`
  **Expected:** PASS.

- [ ] **Step 5: Type/lint verification**
  `pnpm type-check && pnpm lint:lib && pnpm lint:app-api && pnpm lint:components`
  **Expected:** PASS.

- [ ] **Step 6: Commit**
  `git commit -am "feat(gais): add NDIA SA3 demand adapter and validation"`

---

## Review Focus

- Public serializer must never leak `internalStrategy`, weight values, or non-reusable source data.
- Suppressed NDIA values such as `<11` must never become zero.
- ASGS 2016 SA3 source codes must not be silently joined to ASGS 2021 geometry.
- Low utilisation, scarcity, concentration, and access need must remain diagnostic indicators, not causal claims.
- All feature flags must fail closed.
- Regional demand must remain semantically separate from physical accessibility facts.
