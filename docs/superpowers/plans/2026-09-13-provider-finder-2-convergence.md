# Provider Finder 2.0 Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the production Provider Finder's synthetic/demo-provider dependency with an evidence-backed projection of the official NDIS Provider Finder registry, render it through the approved accessible MapAble experience, and prove deterministic matching, provenance, source-failure safety, list/map parity and Care handoff without changing Worker Screening yet.

**Architecture:** Add typed provider-search contracts to `@mapable/domain-provider`; map `ProviderOutletRegistry` rows into a source-specific `ProviderSearchProjection`; execute matching in deterministic domain/application services; expose personalised search through `POST /api/providers/search`; and render the same projection in the public legacy-compatible Provider Finder and canonical `/support/providers` entry. The official NDIS Provider Finder source establishes that a listed provider is a registered-provider record; it does **not** establish provider quality, accessibility, availability, worker competence or current Commission enforcement status. Unsupported fields remain `unknown` rather than being inferred.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Zod 4, Prisma 6 / PostgreSQL (Neon), pnpm workspaces, `@mapable/domain-provider`, React Query where still useful, MapLibre, Vitest, Playwright + axe, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-13-mapable-target-architecture-design.md`

**Base:** `main` at `ae8cb19cc4a1b046852dfae5ae89f5f8f57eb65a` when this plan was written.

## Global Constraints

- Keep the existing Vercel project `mapableau` as the production base. Do not alter Vercel production settings in this plan.
- Do not merge, promote, deploy to production, retire the duplicate Vercel project, or change the custom domain without separate explicit authorisation.
- Keep Provider Finder V2 behind a default-off feature flag until preview verification is complete.
- `ProviderOutletRegistry` is the canonical official registry source for this slice. Do not make `app/provider-finder/providers.ts` or other demo fixtures a production system of record.
- The official NDIS Provider Finder source proves only the source fact supported by that directory: the result is a registered-provider listing. Do not turn it into a provider-quality, accessibility or worker-suitability claim.
- Unknown accessibility, communication and availability information must remain `unknown`. Do not infer wheelchair access from `In-person`, infer response times from review counts, or infer availability from registration.
- No percentage quality score. User-visible match classes are `strong_match`, `possible_match`, and `needs_confirmation` only.
- Sponsored content may render in clearly separated placements but must never change organic candidate acquisition, filtering, match class or sorting.
- Personalised access/communication requirements must be sent in a request body, not encoded into public URLs or analytics payloads.
- Preserve a complete non-AI and non-map path. Ask MapAble may translate user language into an editable typed request but does not decide regulatory facts or matching policy.
- WCAG 2.2 AA is a release gate. Automated axe checks are necessary but not sufficient; the final gate includes keyboard, screen-reader, 200% zoom/reflow and map-independent manual checks.
- Do not require diagnosis when functional access/communication requirements are enough.
- Do not touch Worker Screening canonical states in this plan. That is a separate implementation programme.

---

## File Structure

| Responsibility | Files |
|---|---|
| Domain contracts + matching | `packages/domain-provider/src/provider-search.ts`, `packages/domain-provider/src/ndis-registration-groups.ts`, `packages/domain-provider/src/index.ts` |
| Official registry identifiers/mapping | `lib/ndis/provider-outlet-identifiers.ts`, `lib/ndis/map-provider-outlet-prisma.ts`, compatibility wrappers under `app/provider-finder/` |
| Registry read/projection/search | `lib/provider/finder/provider-registry-repository.ts`, `provider-registry-projection.ts`, `provider-search-service.ts` |
| API + browser client + flags | `app/api/providers/search/route.ts`, `lib/provider/finder/provider-search-client.ts`, `lib/config/provider-finder-v2.ts`, `.env.example` |
| V2 presentation | `components/provider-finder/v2/*` |
| Routes and unified navigation | `app/support/providers/page.tsx`, `app/provider-finder/page.tsx`, `components/layout/UnifiedParticipantNav.tsx` |
| Production demo-data retirement | `app/provider-finder/providers.ts`, `lib/seo/local-landing.ts`, `app/provider-finder/[suburb]/[service]/page.tsx`, `app/sitemap.ts`, test fixtures |
| Verification | `tests/provider/*`, `tests/a11y/provider-finder-v2.spec.ts`, `playwright.config.ts`, release checklist |

---

### Task 1: Add Provider Search Contracts and Deterministic Matching

**Files:**
- Create: `packages/domain-provider/src/provider-search.ts`
- Modify: `packages/domain-provider/src/index.ts`
- Test: `tests/provider/provider-search-domain.test.ts`

**Interfaces:**
- Consumes: no infrastructure; only plain typed values.
- Produces: `providerSearchRequestSchema`, `ProviderSearchRequest`, `ProviderSearchCandidate`, `ProviderSearchProjection`, `ProviderMatchClassification`, `evaluateProviderSearchCandidate(request, candidate)`, `rankProviderSearchResults(request, candidates)`.

- [ ] **Step 1: Write the failing domain tests**

Create `tests/provider/provider-search-domain.test.ts` with at least these cases:

```ts
import { describe, expect, it } from "vitest";
import {
  evaluateProviderSearchCandidate,
  rankProviderSearchResults,
  type ProviderSearchCandidate,
  type ProviderSearchRequest,
} from "@mapable/domain-provider";

function candidate(
  patch: Partial<ProviderSearchCandidate> = {},
): ProviderSearchCandidate {
  return {
    id: "provider-a",
    displayName: "Alpha Care",
    legalName: null,
    abn: "12345678901",
    slug: "alpha-care",
    outletKey: "alpha-1",
    location: { suburb: "St Ives", state: "NSW", postcode: "2075" },
    services: ["Support Coordination"],
    registration: {
      status: "registered",
      source: "official_ndis_provider_finder",
      sourceDate: "2026-09-11",
      checkedAt: "2026-09-13T00:00:00.000Z",
      registrationGroups: ["Support Coordination"],
    },
    evidence: [],
    availability: {
      key: "availability",
      value: null,
      state: "unknown",
      sourceLabel: "Not assessed",
    },
    ...patch,
  };
}

const baseRequest: ProviderSearchRequest = {
  services: ["Support Coordination"],
  fundingManagement: "ndia_managed",
  requirements: [],
  limit: 25,
};

describe("provider search matching", () => {
  it("excludes a known service mismatch", () => {
    const result = evaluateProviderSearchCandidate(
      baseRequest,
      candidate({ services: ["Therapeutic Supports"] }),
    );
    expect(result.include).toBe(false);
    expect(result.conflicts).toContain("service:Support Coordination");
  });

  it("keeps required unknown evidence as needs confirmation", () => {
    const request: ProviderSearchRequest = {
      ...baseRequest,
      requirements: [{ key: "aac_support", level: "required", value: true }],
    };
    const result = evaluateProviderSearchCandidate(request, candidate());
    expect(result.include).toBe(true);
    expect(result.classification).toBe("needs_confirmation");
    expect(result.unknownRequirements).toContain("aac_support");
  });

  it("does not convert registration into accessibility evidence", () => {
    const request: ProviderSearchRequest = {
      ...baseRequest,
      requirements: [
        { key: "step_free_entrance", level: "required", value: true },
      ],
    };
    expect(evaluateProviderSearchCandidate(request, candidate()).classification)
      .toBe("needs_confirmation");
  });

  it("uses a stable deterministic tie-breaker", () => {
    const ranked = rankProviderSearchResults(baseRequest, [
      candidate({ id: "b", displayName: "Zulu Care" }),
      candidate({ id: "a", displayName: "Alpha Care" }),
    ]);
    expect(ranked.map((result) => result.provider.id)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/provider/provider-search-domain.test.ts
```

Expected: FAIL because the V2 contracts/evaluator do not exist yet.

- [ ] **Step 3: Implement the minimum domain contract**

Create `packages/domain-provider/src/provider-search.ts` with the following public shapes and pure functions:

```ts
import { z } from "zod";

export const providerRequirementSchema = z.object({
  key: z.string().min(1),
  level: z.enum(["required", "preferred"]),
  value: z.union([z.boolean(), z.string(), z.array(z.string())]),
});

export const providerSearchRequestSchema = z.object({
  query: z.string().trim().max(200).optional(),
  services: z.array(z.string().min(1)).max(20).default([]),
  fundingManagement: z
    .enum(["ndia_managed", "plan_managed", "self_managed", "private", "unknown"])
    .default("unknown"),
  location: z.object({
    suburb: z.string().trim().max(120).optional(),
    postcode: z.string().trim().max(16).optional(),
    state: z.string().trim().max(8).optional(),
  }).optional(),
  requirements: z.array(providerRequirementSchema).max(40).default([]),
  limit: z.number().int().min(1).max(100).default(25),
});

export type ProviderSearchRequest = z.infer<typeof providerSearchRequestSchema>;
export type ProviderEvidenceState =
  | "official"
  | "verified"
  | "declared"
  | "reported"
  | "user_supplied"
  | "unknown"
  | "outdated"
  | "expired"
  | "disputed"
  | "source_unavailable";

export type ProviderEvidenceFact = {
  key: string;
  value: boolean | string | string[] | null;
  state: ProviderEvidenceState;
  sourceLabel: string;
  checkedAt?: string | null;
};

export type ProviderRegistrationProjection = {
  status: "registered" | "ambiguous" | "source_unavailable";
  source: "official_ndis_provider_finder";
  sourceDate?: string | null;
  checkedAt?: string | null;
  registrationGroups: string[];
};

export type ProviderSearchCandidate = {
  id: string;
  displayName: string;
  legalName?: string | null;
  abn?: string | null;
  slug?: string | null;
  outletKey?: string | null;
  location: {
    suburb?: string | null;
    state?: string | null;
    postcode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  services: string[];
  registration: ProviderRegistrationProjection;
  evidence: ProviderEvidenceFact[];
  availability: ProviderEvidenceFact;
};

export type ProviderMatchClassification =
  | "strong_match"
  | "possible_match"
  | "needs_confirmation";
```

`evaluateProviderSearchCandidate()` must exclude known hard conflicts, keep required unknowns as `needs_confirmation`, downgrade preferred unknowns/mismatches to `possible_match`, and never calculate a universal percentage. `rankProviderSearchResults()` must sort by deterministic fit dimensions then stable provider ID/name tie-breakers.

- [ ] **Step 4: Re-export and run focused tests**

Add to `packages/domain-provider/src/index.ts`:

```ts
export * from "./provider-search";
```

Run:

```bash
pnpm exec vitest run tests/provider/provider-search-domain.test.ts tests/intelligence/provider-workforce.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain-provider/src/provider-search.ts packages/domain-provider/src/index.ts tests/provider/provider-search-domain.test.ts
git commit -m "feat(provider-finder): add deterministic search contracts"
```

**Review gate:** `provider-search.ts` must not import Prisma, React, Next.js or environment variables.

---

### Task 2: Isolate NDIS Registration-Group and Provider-Outlet Identifier Logic

**Files:**
- Create: `packages/domain-provider/src/ndis-registration-groups.ts`
- Modify: `packages/domain-provider/src/index.ts`
- Modify: `app/provider-finder/regGroupOptions.ts`
- Create: `lib/ndis/provider-outlet-identifiers.ts`
- Modify: `app/provider-finder/outletToProvider.ts`
- Modify: `lib/ndis/map-provider-outlet-prisma.ts`
- Test: `tests/provider/provider-outlet-identifiers.test.ts`
- Test: `tests/map-mappers.test.ts`

**Interfaces:**
- Consumes: `ProviderOutlet` from `data/provider-outlets.types.ts`.
- Produces: `NDIS_REGISTRATION_GROUPS`, `regGroupIndicesToCategories(indices)`, and `buildProviderOutletIdentifiers(outlet, index)` returning `{ id, slug, outletKey, abn }`.

- [ ] **Step 1: Write failing mapping tests**

```ts
import { describe, expect, it } from "vitest";
import { regGroupIndicesToCategories } from "@mapable/domain-provider";
import { buildProviderOutletIdentifiers } from "@/lib/ndis/provider-outlet-identifiers";

it("maps official registration-group indexes", () => {
  expect(regGroupIndicesToCategories([34, 29])).toEqual([
    "Support Coordination",
    "Therapeutic Supports",
  ]);
});

it("builds stable outlet identifiers", () => {
  const first = buildProviderOutletIdentifiers(TEST_OUTLET, 0);
  const second = buildProviderOutletIdentifiers(TEST_OUTLET, 0);
  expect(first).toEqual(second);
  expect(first.abn).toBe("12345678901");
  expect(first.id).toBeTruthy();
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
pnpm exec vitest run tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
```

- [ ] **Step 3: Move the taxonomy to the domain package**

Move the existing 1–36 registration-group table and mapping function to `packages/domain-provider/src/ndis-registration-groups.ts`; export it from `index.ts`. Convert `app/provider-finder/regGroupOptions.ts` into a compatibility re-export:

```ts
export {
  NDIS_REGISTRATION_GROUPS as REG_GROUP_OPTIONS,
  regGroupIndicesToCategories,
} from "@mapable/domain-provider";
```

- [ ] **Step 4: Extract provider-outlet identifier generation**

Create `lib/ndis/provider-outlet-identifiers.ts` with the stable ID/slug/outlet-key logic currently embedded in legacy mapping. Update both `outletToProvider.ts` and `map-provider-outlet-prisma.ts` to consume it.

Required dependency direction:

```text
app/provider-finder -> lib/ndis -> domain-provider
lib/ndis            -> domain-provider
```

`lib/ndis` must no longer import `app/provider-finder`.

- [ ] **Step 5: Run tests and type-check**

```bash
pnpm exec vitest run tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/domain-provider/src/ndis-registration-groups.ts packages/domain-provider/src/index.ts app/provider-finder/regGroupOptions.ts app/provider-finder/outletToProvider.ts lib/ndis/provider-outlet-identifiers.ts lib/ndis/map-provider-outlet-prisma.ts tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
git commit -m "refactor(provider-finder): isolate NDIS provider mapping"
```

**Review gate:** repository search shows no touched `lib/ndis/*` file importing `@/app/provider-finder/*`.

---

### Task 3: Build the ProviderOutletRegistry Reader and Provenance-Aware Projection

**Files:**
- Create: `lib/provider/finder/provider-registry-repository.ts`
- Create: `lib/provider/finder/provider-registry-projection.ts`
- Create: `lib/provider/finder/provider-search-service.ts`
- Test: `tests/provider/provider-registry-projection.test.ts`
- Test: `tests/provider/provider-search-service.test.ts`

**Interfaces:**
- Consumes: Task 1 domain contracts; Prisma `ProviderOutletRegistry` only inside the production repository adapter.
- Produces: `ProviderRegistryReader`, `prismaProviderRegistryReader`, `projectRegistryRow(row, snapshot)`, `ProviderSearchResponse`, `searchProviderRegistry(input, deps)`.

- [ ] **Step 1: Write failing projection tests**

Cover registered-source status, source date, registration groups, null coordinates, unknown accessibility and unknown availability:

```ts
const projection = projectRegistryRow(
  {
    id: "outlet-1",
    abn: "12345678901",
    name: "Example Supports",
    slug: "example-supports",
    outletKey: "example-1",
    outletName: "Example Supports St Ives",
    active: true,
    state: "NSW",
    postcode: "2075",
    latitude: null,
    longitude: null,
    regGroup: [34],
    sourceDate: "2026-09-11",
    importedAt: new Date("2026-09-13T00:00:00Z"),
    updatedAt: new Date("2026-09-13T00:00:00Z"),
  },
  { sourceDate: "2026-09-11", importedAt: new Date("2026-09-13T00:00:00Z") },
);

expect(projection.registration.status).toBe("registered");
expect(projection.services).toContain("Support Coordination");
expect(projection.availability.state).toBe("unknown");
expect(projection.evidence.find((fact) => fact.key === "step_free_entrance"))
  .toBeUndefined();
```

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run tests/provider/provider-registry-projection.test.ts
```

- [ ] **Step 3: Implement the repository interface**

```ts
export type ProviderRegistryQuery = {
  query?: string;
  state?: string;
  postcode?: string;
  registrationGroups?: number[];
  limit: number;
};

export type ProviderRegistrySnapshotState = {
  sourceDate: string | null;
  importedAt: Date | null;
};

export interface ProviderRegistryReader {
  getLatestSnapshotState(): Promise<ProviderRegistrySnapshotState>;
  search(
    query: ProviderRegistryQuery,
    snapshot: ProviderRegistrySnapshotState,
  ): Promise<ProviderOutletRegistryRow[]>;
}
```

Implement `prismaProviderRegistryReader` with `prisma.providerOutletRegistry`. When the newest rows have a non-null `sourceDate`, constrain V2 searches to that latest `sourceDate`; this prevents records missing from a newer export from remaining visible merely because older materialised rows still exist.

- [ ] **Step 4: Implement the projection and search service**

```ts
export async function searchProviderRegistry(
  input: ProviderSearchRequest,
  deps: { registry: ProviderRegistryReader; now?: Date },
): Promise<ProviderSearchResponse>;
```

`ProviderSearchResponse` must contain the interpreted typed request, ranked results, match-class counts, source state, and `rulesVersion: "provider-finder-v2.1"`.

A repository failure must result in a typed `SOURCE_UNAVAILABLE` error/outcome, never an empty result set that looks like “no providers”.

- [ ] **Step 5: Write and run service tests**

Test latest-snapshot filtering, source-unavailable behavior, deterministic ordering and absence of synthetic rating/review fields.

```bash
pnpm exec vitest run tests/provider/provider-registry-projection.test.ts tests/provider/provider-search-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/provider/finder/provider-registry-repository.ts lib/provider/finder/provider-registry-projection.ts lib/provider/finder/provider-search-service.ts tests/provider/provider-registry-projection.test.ts tests/provider/provider-search-service.test.ts
git commit -m "feat(provider-finder): project official registry with provenance"
```

**Review gate:** service tests run with a fake `ProviderRegistryReader`; no test requires a real database.

---

### Task 4: Add the V2 Search API, Funding Semantics and Default-Off Flags

**Files:**
- Create: `lib/config/provider-finder-v2.ts`
- Create: `app/api/providers/search/route.ts`
- Create: `lib/provider/finder/provider-search-client.ts`
- Modify: `.env.example`
- Modify: `docs/data/ndis-provider-registry-prisma.md`
- Test: `tests/provider/provider-search-api.test.ts`

**Interfaces:**
- Consumes: `providerSearchRequestSchema`, `searchProviderRegistry`, existing IP-rate-limit and JSON-response utilities.
- Produces: `POST /api/providers/search`, `searchProvidersV2(request)`, flags `MAPABLE_PROVIDER_FINDER_V2_ENABLED` and `NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED` defaulting false.

- [ ] **Step 1: Write failing route/API tests**

Cover valid body, invalid body -> 400, repository source failure -> 503 with `SOURCE_UNAVAILABLE`, and valid zero results -> 200 with `results: []`.

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm exec vitest run tests/provider/provider-search-api.test.ts
```

- [ ] **Step 3: Add default-off feature flags**

```ts
export const providerFinderV2Config = {
  serverEnabled: process.env.MAPABLE_PROVIDER_FINDER_V2_ENABLED === "true",
  clientEnabled:
    process.env.NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED === "true",
};
```

Add both values as `false` in `.env.example`.

- [ ] **Step 4: Implement `POST /api/providers/search`**

Parse JSON with `providerSearchRequestSchema`, apply the existing public IP rate-limit pattern, call `searchProviderRegistry`, and map typed source failure to 503.

Do not place functional access/communication requirements in query parameters.

- [ ] **Step 5: Encode conservative funding semantics**

For this first official-registry-only slice:

- `ndia_managed`: only `registration.status === "registered"` may pass the registration constraint;
- `plan_managed`, `self_managed`, `private`, `unknown`: keep registered candidates, while UI notes that this source does not enumerate every possible unregistered-provider option;
- do not implement specialist unregistered-provider exception rules until an unregistered-provider source is added and current policy is separately reviewed.

- [ ] **Step 6: Implement browser client and documentation**

`searchProvidersV2(request)` POSTs the typed JSON body and distinguishes `SOURCE_UNAVAILABLE` from a valid empty result set. Update `docs/data/ndis-provider-registry-prisma.md` to identify `ProviderOutletRegistry` as the V2 UI source while keeping `ndis_providers` compatibility/agent surfaces separate.

- [ ] **Step 7: Run focused tests and type-check**

```bash
pnpm exec vitest run tests/provider/provider-search-api.test.ts tests/provider/provider-search-service.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/config/provider-finder-v2.ts app/api/providers/search/route.ts lib/provider/finder/provider-search-client.ts tests/provider/provider-search-api.test.ts docs/data/ndis-provider-registry-prisma.md .env.example
git commit -m "feat(provider-finder): add provenance-aware search API"
```

**Review gate:** route/client code must not persist raw search text or access/communication requirements by default.

---

### Task 5: Build Evidence-First Provider Result Components

**Files:**
- Create: `components/provider-finder/v2/ProviderEvidenceLabel.tsx`
- Create: `components/provider-finder/v2/ProviderMatchLabel.tsx`
- Create: `components/provider-finder/v2/ProviderFinderResultCardV2.tsx`
- Create: `components/provider-finder/v2/ProviderSourceNotice.tsx`
- Modify: `lib/provider/use-platform-care-link.ts`
- Test: `tests/provider/provider-result-copy.test.ts`

**Interfaces:**
- Consumes: `ProviderSearchProjection` from Task 1; existing `/api/care/platform-org` resolver through the care-link hook.
- Produces: accessible evidence/match labels, `ProviderFinderResultCardV2`, and `PlatformCareLinkProviderRef` with only `{ abn, slug, outletKey, name }`.

- [ ] **Step 1: Write failing copy-format tests**

Test pure formatter functions or exported label helpers:

```ts
expect(formatRegistrationLabel({ status: "registered" }))
  .toBe("Registered provider");
expect(formatEvidenceState("unknown")).toBe("Not assessed");
expect(formatMatchClass("needs_confirmation")).toBe("Needs confirmation");
```

Also assert no formatter returns `Verified provider`, star ratings, response-time claims or inferred availability.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run tests/provider/provider-result-copy.test.ts
```

- [ ] **Step 3: Implement semantic evidence labels and V2 card**

The default card must visibly separate:

```text
Provider name
Service / location
Match class
NDIS provider registration — Registered provider — Official NDIS Provider Finder — source date
Accessibility/communication evidence — exact state
Availability — Unknown unless separately evidenced
Actions — View / Compare / Save / Ask / Request support as available
```

Match/evidence meaning must remain textual and cannot rely on colour alone.

- [ ] **Step 4: Narrow the Care-link hook input**

Replace the legacy `Provider` dependency in `lib/provider/use-platform-care-link.ts` with:

```ts
export type PlatformCareLinkProviderRef = {
  abn?: string | null;
  slug?: string | null;
  outletKey?: string | null;
  name?: string | null;
};
```

- [ ] **Step 5: Run tests and type-check**

```bash
pnpm exec vitest run tests/provider/provider-result-copy.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add components/provider-finder/v2/ProviderEvidenceLabel.tsx components/provider-finder/v2/ProviderMatchLabel.tsx components/provider-finder/v2/ProviderFinderResultCardV2.tsx components/provider-finder/v2/ProviderSourceNotice.tsx lib/provider/use-platform-care-link.ts tests/provider/provider-result-copy.test.ts
git commit -m "feat(provider-finder): add evidence-first result cards"
```

**Review gate:** repository search within `components/provider-finder/v2` finds no `rating`, `reviewCount`, inferred `responseTime`, or generic `Verified provider` presentation.

---

### Task 6: Build the List-First V2 Search, Comparison, Optional Map and Human Help

**Files:**
- Create: `components/provider-finder/v2/ProviderFinderV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderFiltersV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderResultsV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderCompareV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderMapV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderHumanHelp.tsx`
- Test: `tests/provider/provider-finder-view-model.test.ts`

**Interfaces:**
- Consumes: `searchProvidersV2`, `ProviderSearchRequest`, `ProviderSearchProjection`, existing map primitives where compatible, existing Ask/guided-search surface only as optional interpreter.
- Produces: complete public V2 search experience that remains functional when map and AI are unavailable.

- [ ] **Step 1: Write failing view-model tests**

Cover result counts by match class, compare selection limited to 2–4, map points only for real coordinates, complete list when coordinates are absent, source outage distinct from no results, and valid no-result state.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run tests/provider/provider-finder-view-model.test.ts
```

- [ ] **Step 3: Implement the semantic list-first composition**

Required skeleton:

```tsx
<main id="main-content">
  <h1>Find support</h1>
  <ProviderSourceNotice />
  <ProviderFinderFiltersV2 />
  <p role="status" aria-live="polite">18 providers found</p>
  <ProviderFinderResultsV2 />
  <ProviderFinderHumanHelp />
</main>
```

Provider results use semantic list/article markup. The map is complementary and optional.

- [ ] **Step 4: Implement required/preferred functional filters**

Initial filter keys are bounded to:

- home visit;
- telehealth;
- step-free premises;
- wheelchair-accessible transport;
- AAC/text communication;
- Auslan/interpreter support;
- quiet/low-sensory setting;
- assistance animals.

If the current official registry does not contain evidence for one of these fields, render `unknown`; never keyword-infer it.

- [ ] **Step 5: Integrate Ask MapAble only as an editable interpreter**

Reuse the existing Ask/guided-search surface to populate the same typed request. Show the interpreted constraints to the user. Structured search must remain complete with Ask disabled.

- [ ] **Step 6: Implement comparison and map synchronisation**

Comparison uses evidence rows and unknowns without an overall score. Map selection may highlight the corresponding list result, but marker selection must not unexpectedly move keyboard/screen-reader focus.

- [ ] **Step 7: Implement human help**

Link only to already-existing MapAble help/contact/complaint routes discovered in the repository. Do not invent a new live support endpoint in this plan.

- [ ] **Step 8: Run tests, type-check and lint**

```bash
pnpm exec vitest run tests/provider/provider-finder-view-model.test.ts
pnpm type-check
pnpm lint
```

- [ ] **Step 9: Commit**

```bash
git add components/provider-finder/v2 tests/provider/provider-finder-view-model.test.ts
git commit -m "feat(provider-finder): build accessible V2 search experience"
```

**Review gate:** disable/remove the V2 map component during review and verify search, filtering, inspection, comparison and human help still work.

---

### Task 7: Wire Canonical and Legacy-Compatible Routes

**Files:**
- Create: `app/support/providers/page.tsx`
- Modify: `app/provider-finder/page.tsx`
- Modify: `components/layout/UnifiedParticipantNav.tsx`
- Test: `tests/provider/provider-finder-routing.test.ts`
- Modify: `tests/a11y/unified-shell.spec.ts`

**Interfaces:**
- Consumes: `providerFinderV2Config`, `ProviderFinderV2`, existing legacy `ProviderFinderClient`.
- Produces: canonical public `/support/providers`; feature-flagged compatibility behavior for `/provider-finder`; participant navigation entry that only points to the canonical route when V2 client flag is enabled.

- [ ] **Step 1: Write failing flag/routing tests**

Test V2 off -> legacy behavior, V2 on -> shared V2 component on both routes, no redirect loop, and canonical metadata for `/support/providers`.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run tests/provider/provider-finder-routing.test.ts
```

- [ ] **Step 3: Add `/support/providers` as a public route**

Keep provider discovery accessible without authentication. Do not wrap the public route in a participant-only auth guard.

- [ ] **Step 4: Switch `/provider-finder` by server flag**

When V2 is disabled, render the existing legacy `ProviderFinderClient`. When enabled, render the shared V2 experience. Keep the URL operational for rollback and existing links.

- [ ] **Step 5: Update unified participant navigation safely**

Only point `Find support`/`People & Services` toward `/support/providers` when the public V2 flag is enabled. Do not make public provider discovery depend on `UnifiedParticipantShell` authentication.

- [ ] **Step 6: Run route tests, type-check and lint**

```bash
pnpm exec vitest run tests/provider/provider-finder-routing.test.ts
pnpm type-check
pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add app/support/providers/page.tsx app/provider-finder/page.tsx components/layout/UnifiedParticipantNav.tsx tests/provider/provider-finder-routing.test.ts tests/a11y/unified-shell.spec.ts
git commit -m "feat(provider-finder): wire V2 routes behind feature flag"
```

**Review gate:** build both flag-off and flag-on configurations before proceeding.

---

### Task 8: Remove Demo Provider Data from Production Discovery and SEO Paths

**Files:**
- Modify: `app/provider-finder/providers.ts`
- Create: `tests/fixtures/provider-finder/providers.ts`
- Modify: `lib/seo/local-landing.ts`
- Modify: `app/provider-finder/[suburb]/[service]/page.tsx`
- Modify: `app/sitemap.ts`
- Modify if touched: `lib/seo/provider-profile-json-ld.ts`, legacy map/directory components that import only the old type
- Test: `tests/provider/provider-demo-data-boundary.test.ts`
- Test: `tests/seo/local-landing.test.ts`

**Interfaces:**
- Consumes: registry-backed provider search/projection from Tasks 3–4; current local SEO taxonomy.
- Produces: production code with no import/use of a synthetic `PROVIDERS` data array; test fixtures remain available for deterministic tests.

- [ ] **Step 1: Write a failing production-boundary test**

Scan production TS/TSX source for the exact demo-provider import/constant and assert only test/demo-only locations remain:

```ts
expect(offendingProductionFiles).toEqual([]);
```

The scan must target the exact import path/constant and not the generic word `Providers`.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run tests/provider/provider-demo-data-boundary.test.ts
```

- [ ] **Step 3: Move synthetic records to test fixtures**

Move the synthetic provider records into `tests/fixtures/provider-finder/providers.ts` as `PROVIDER_FIXTURES`. `app/provider-finder/providers.ts` may temporarily retain legacy type definitions required by untouched compatibility code but must not export production demo data.

- [ ] **Step 4: Refactor local SEO to explicit source data**

`lib/seo/local-landing.ts` must accept explicit registry/projection inputs and never default to demo data. Remove the “soft expand to neighbouring demo providers” fallback.

- [ ] **Step 5: Make dynamic local landing pages source-backed**

`app/provider-finder/[suburb]/[service]/page.tsx` queries the official registry-backed service. If there is no source-supported result, render an honest empty/related-search state. Remove synthetic rating/review structured data and remove the inference `In-person => wheelchair accessible`.

- [ ] **Step 6: Remove demo-provider sitemap generation**

`app/sitemap.ts` must stop importing the synthetic provider list. Curated route inventory may remain, or registry-backed route entries may be generated if bounded and build-safe; never emit fictional provider/profile URLs.

- [ ] **Step 7: Run boundary/SEO tests, type-check and lint**

```bash
pnpm exec vitest run tests/provider/provider-demo-data-boundary.test.ts tests/seo/local-landing.test.ts
pnpm type-check
pnpm lint
```

- [ ] **Step 8: Commit**

```bash
git add app/provider-finder/providers.ts tests/fixtures/provider-finder/providers.ts lib/seo/local-landing.ts app/provider-finder/[suburb]/[service]/page.tsx app/sitemap.ts tests/provider/provider-demo-data-boundary.test.ts tests/seo/local-landing.test.ts
git commit -m "refactor(provider-finder): remove demo data from production paths"
```

Add any additional touched compatibility files to this commit only if required by the type-check.

**Review gate:** repository search confirms no production route imports a synthetic `PROVIDERS` array.

---

### Task 9: Add Accessibility, Failure-Mode and Commercial-Separation E2E Coverage

**Files:**
- Create: `tests/a11y/provider-finder-v2.spec.ts`
- Modify: `playwright.config.ts`
- Create: `tests/provider/provider-finder-commercial-separation.test.ts`
- Modify only for defects discovered: `components/provider-finder/v2/*`

**Interfaces:**
- Consumes: public V2 route, deterministic ranker, existing Playwright/axe configuration.
- Produces: automated proof for critical Provider Finder accessibility and ranking-isolation requirements.

- [ ] **Step 1: Add the failing Playwright V2 test/project**

Cover:

```text
one clear H1 + main landmark
keyboard-only search submission
result count announced via status/live region
visible evidence text
no colour-only match state
provider inspection without map
list focus remains stable when map changes
source-unavailable != zero results
human-help action keyboard reachable
zero serious/critical axe findings in tested state
```

- [ ] **Step 2: Add commercial-separation invariant tests**

Write a pure Vitest test proving sponsorship/ad metadata cannot alter `rankProviderSearchResults()` output. The organic matcher must not accept bid, campaign or sponsored fields as scoring inputs.

- [ ] **Step 3: Run the pure invariant test**

```bash
pnpm exec vitest run tests/provider/provider-finder-commercial-separation.test.ts
```

Expected: PASS after any minimal type boundary adjustment.

- [ ] **Step 4: Run the targeted browser suite**

```bash
MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
pnpm exec playwright test tests/a11y/provider-finder-v2.spec.ts --project=provider-finder-v2
```

Use the repository's established synthetic/test database setup. Never point the suite at real participant data.

- [ ] **Step 5: Perform the manual accessibility gate**

Record evidence in the PR/review notes for keyboard-only completion, screen-reader spot check, 200% zoom/reflow, reduced motion, map-independent completion, and text/AAC-compatible completion without a phone-only action.

- [ ] **Step 6: Commit**

```bash
git add tests/a11y/provider-finder-v2.spec.ts playwright.config.ts tests/provider/provider-finder-commercial-separation.test.ts components/provider-finder/v2
git commit -m "test(provider-finder): verify accessibility and ranking isolation"
```

**Review gate:** axe success alone is insufficient; manual AT evidence must be recorded before release-readiness is claimed.

---

### Task 10: Final Verification, Documentation and Preview-Ready Gate

**Files:**
- Modify: `docs/data/ndis-provider-registry-prisma.md`
- Create: `docs/provider-finder/provider-finder-v2-release-checklist.md`
- Modify code/tests only for verified defects found during this task

**Interfaces:**
- Consumes: Tasks 1–9 and the approved architecture spec.
- Produces: review-ready implementation branch with explicit rollback, release evidence and no production mutation.

- [ ] **Step 1: Document the final source architecture**

Document exactly:

```text
Official NDIS Provider Finder export
  -> ProviderOutletRegistry
  -> provider-registry-repository
  -> ProviderSearchProjection
  -> deterministic matcher
  -> POST /api/providers/search
  -> Provider Finder V2 UI
```

Also document the separate evidence states: official registry, MapAble verified, provider declared, and unknown/not assessed. State that `/api/providers/ndis/search` and `ndis_providers` remain compatibility/agent surfaces for now and are not the canonical V2 UI source.

- [ ] **Step 2: Create the release/rollback checklist**

`docs/provider-finder/provider-finder-v2-release-checklist.md` must contain these explicit gates:

```text
[ ] V2 feature flags default false
[ ] official registry snapshot is populated in target environment
[ ] source date/freshness is visible
[ ] no demo-provider production dependency
[ ] no synthetic rating/review claims
[ ] source-outage behavior tested
[ ] list-only flow tested
[ ] manual accessibility evidence recorded
[ ] Vercel preview green
[ ] preview runtime errors reviewed
[ ] rollback = disable V2 flags and use legacy route
[ ] no production enablement without explicit authorization
```

- [ ] **Step 3: Run repository-wide verification**

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm ci:migration-order
pnpm ci:migration-integrity
pnpm ci:domain-ownership
pnpm ci:production-claims
pnpm ci:feature-dependencies
pnpm build
```

Document pre-existing failures separately from introduced failures. Do not waive an introduced failure.

- [ ] **Step 4: Re-run the V2 browser suite**

```bash
MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
pnpm exec playwright test tests/a11y/provider-finder-v2.spec.ts --project=provider-finder-v2
```

- [ ] **Step 5: Verify production remains untouched**

Record that no Vercel production promotion, production environment mutation, production DB migration, duplicate-project retirement or custom-domain change was performed. Confirm V2 flags remain default off and `/provider-finder` retains rollback compatibility.

- [ ] **Step 6: Commit release documentation**

```bash
git add docs/data/ndis-provider-registry-prisma.md docs/provider-finder/provider-finder-v2-release-checklist.md
git commit -m "docs(provider-finder): add V2 release and rollback gates"
```

- [ ] **Step 7: Run an independent whole-branch review**

Review the complete branch against the approved architecture spec, this plan, provenance rules, WCAG 2.2 AA critical-flow requirements, privacy constraints and commercial-separation invariants. Resolve all blockers before calling the branch implementation-complete.

---

## Planned PR Shape

The plan can be executed on one focused Provider Finder branch with task-level commits. If review size becomes excessive, split after Task 4 into two stacked PRs:

1. **Provider Finder V2 foundation:** Tasks 1–4 — contracts, mapping, registry projection, service, API and flags.
2. **Provider Finder V2 experience:** Tasks 5–10 — evidence UI, routes, production demo-data retirement, accessibility and release gates.

Do not merge the experience PR before its foundation is approved.

## Stop Conditions

Stop implementation and request a decision when any of these becomes true:

- repository state materially diverges from the inspected base in a way that changes Provider Finder's source model;
- official NDIS Provider Finder semantics no longer support the registered-provider-listing interpretation;
- the target environment lacks a materially complete `ProviderOutletRegistry`;
- the work requires production secrets or direct production mutation;
- a schema migration becomes necessary despite this migration-free first slice;
- an accessibility requirement can only be satisfied by inventing provider evidence;
- sponsorship/ads would influence organic matching;
- a test requires real participant data;
- the change expands into Worker Screening, direct service booking, payments, AccessXR or autonomous high-impact AI execution.

## Definition of Done

Provider Finder 2.0 is implementation-complete for review when the feature-flagged V2 path reads official `ProviderOutletRegistry` data, returns typed provenance-aware projections, applies deterministic matching, never substitutes unknown evidence with inference, works without map or AI, no longer uses synthetic provider records in production discovery/SEO paths, preserves Care handoff through explicit identifiers, passes targeted and repository-wide verification, and has a tested flag-based rollback path. Production enablement remains a separate decision.
