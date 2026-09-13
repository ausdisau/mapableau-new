# Provider Finder 2.0 Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan. Use TDD for every implementation task, run the named verification commands, and stop at the review gates. Do not merge or deploy unless separately authorised.

**Goal:** Replace the production Provider Finder's synthetic/demo-provider dependency with an evidence-backed projection of the official NDIS Provider Finder registry, render it through the approved accessible MapAble experience, and prove deterministic matching, provenance, source-failure safety, list/map parity and Care handoff without changing Worker Screening yet.

**Architecture:** Add typed provider-search contracts to `@mapable/domain-provider`; map `ProviderOutletRegistry` rows into a source-specific `ProviderSearchProjection`; execute matching in deterministic domain/application services; expose personalised search through `POST /api/providers/search`; and render the same projection in the public legacy-compatible Provider Finder and canonical `/support/providers` entry. The official NDIS Provider Finder source establishes that a listed provider is a registered provider; it does **not** establish provider quality, accessibility, availability, worker competence or current Commission enforcement status. Unsupported fields remain `unknown` rather than being inferred.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Zod 4, Prisma 6 / PostgreSQL (Neon), pnpm workspaces, `@mapable/domain-provider`, React Query where still useful, MapLibre, Vitest, Playwright + axe, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-13-mapable-target-architecture-design.md`

**Base:** `main` at `ae8cb19cc4a1b046852dfae5ae89f5f8f57eb65a` when this plan was written.

## Global Constraints

- Keep the existing Vercel project `mapableau` as the production base. Do not alter Vercel production settings in this plan.
- Do not merge, promote, deploy to production, retire the duplicate Vercel project, or change the custom domain without separate explicit authorisation.
- Keep Provider Finder V2 behind a default-off feature flag until preview verification is complete.
- `ProviderOutletRegistry` is the canonical official registry source for this slice. Do not make `app/provider-finder/providers.ts` or other demo fixtures a production system of record.
- The official NDIS Provider Finder is a directory of **registered providers**. Represent that source fact as `registered`, not as a provider-quality or accessibility badge. Commission status such as suspended/revoked belongs to a later dedicated Provider Register adapter unless current source evidence explicitly supplies it.
- Unknown accessibility, communication and availability information must remain `unknown`. Do not infer wheelchair access from `In-person`, infer response times from review counts, or infer availability from registration.
- No percentage quality score. User-visible match classes are `strong_match`, `possible_match`, and `needs_confirmation` only.
- Sponsored content/ads may render in clearly separated placements but must never change organic candidate acquisition, filtering, match class or sorting.
- Personalised access/communication requirements must be sent in a request body, not encoded into public URLs or analytics payloads.
- Preserve a complete non-AI and non-map path. Ask MapAble may translate user language into an editable typed request but does not decide regulatory facts or matching policy.
- WCAG 2.2 AA is a release gate. Automated axe checks are necessary but not sufficient; the final gate includes keyboard, screen-reader, 200% zoom/reflow and map-independent manual checks.
- Do not require diagnosis when functional access/communication requirements are enough.
- Do not touch Worker Screening canonical states in this plan. That is the next independent implementation programme.

## Current-State File Map

| Area | Current files | Planned role |
|---|---|---|
| Legacy Provider Finder | `app/provider-finder/page.tsx`, `app/provider-finder/ProviderFinderClient.tsx` | Compatibility entry; V2 behind flag |
| Demo provider model/data | `app/provider-finder/providers.ts` | Retain only transitional type surface if needed; remove production demo records |
| Official registry | `ProviderOutletRegistry` / `provider_outlets`, `prisma/seed-ndis-provider-outlets.ts` | Canonical official source for V2 |
| Registry docs | `docs/data/ndis-provider-registry-prisma.md` | Update after cutover |
| Official raw loader | `lib/ndis/list-providers-source.ts` | Preserve as ingestion source |
| Legacy public JSON hook | `lib/provider/finder/provider-outlets.ts`, `use-provider-outlets.ts` | Legacy compatibility only; not V2 source |
| NDIS registration groups | `app/provider-finder/regGroupOptions.ts` | Move pure taxonomy out of app layer |
| Outlet/Prisma mapping | `lib/ndis/map-provider-outlet-prisma.ts`, `lib/map/mappers/provider-outlet.ts` | Remove touched app-layer dependency |
| Existing evidence domain | `packages/domain-provider/src/index.ts` | Re-export V2 contracts/matcher |
| Existing result UI | `components/provider-finder/ProviderFinderResultCard.tsx` | Keep legacy; add V2 evidence card |
| Care linkage | `lib/provider/platform-org-resolver.ts`, `lib/provider/use-platform-care-link.ts` | Reuse with narrow identifiers |
| Unified shell | `components/layout/UnifiedParticipantNav.tsx`, `UnifiedParticipantShell.tsx` | Add participant entry without duplicating domain logic |
| SEO | `app/provider-finder/[suburb]/[service]/page.tsx`, `lib/seo/local-landing.ts`, `app/sitemap.ts` | Remove synthetic provider claims |
| Tests | `tests/intelligence/provider-workforce.test.ts`, `tests/a11y/*` | Extend with domain/API/a11y coverage |

---

## Task 1: Add Provider Search Contracts and Deterministic Matching

**Files:**
- Create: `packages/domain-provider/src/provider-search.ts`
- Modify: `packages/domain-provider/src/index.ts`
- Create: `tests/provider/provider-search-domain.test.ts`

### Step 1: Write the failing domain tests

Create tests for these invariants before implementation:

```ts
import { describe, expect, it } from "vitest";
import {
  evaluateProviderSearchCandidate,
  rankProviderSearchResults,
  type ProviderSearchCandidate,
  type ProviderSearchRequest,
} from "@mapable/domain-provider";

const baseRequest: ProviderSearchRequest = {
  services: ["Support Coordination"],
  fundingManagement: "ndia_managed",
  requirements: [],
};

it("excludes a known hard mismatch", () => {
  const result = evaluateProviderSearchCandidate(baseRequest, candidate({
    services: ["Therapeutic Supports"],
  }));
  expect(result.include).toBe(false);
  expect(result.conflicts).toContain("service:Support Coordination");
});

it("keeps required unknown evidence as needs confirmation", () => {
  const request: ProviderSearchRequest = {
    ...baseRequest,
    requirements: [{ key: "aac_support", level: "required", value: true }],
  };
  const result = evaluateProviderSearchCandidate(request, candidate({ evidence: [] }));
  expect(result.include).toBe(true);
  expect(result.classification).toBe("needs_confirmation");
  expect(result.unknownRequirements).toContain("aac_support");
});

it("does not convert registration into accessibility evidence", () => {
  const request: ProviderSearchRequest = {
    ...baseRequest,
    requirements: [{ key: "step_free_entrance", level: "required", value: true }],
  };
  const result = evaluateProviderSearchCandidate(request, candidate({
    registration: { status: "registered", source: "official_ndis_provider_finder" },
    evidence: [],
  }));
  expect(result.classification).toBe("needs_confirmation");
});

it("uses a stable deterministic tie-breaker", () => {
  const ranked = rankProviderSearchResults(baseRequest, [
    candidate({ id: "b", displayName: "Zulu Care" }),
    candidate({ id: "a", displayName: "Alpha Care" }),
  ]);
  expect(ranked.map((r) => r.provider.id)).toEqual(["a", "b"]);
});
```

The local `candidate()` test helper must set official registration to `registered`, a matching service and a matching geography by default. Do not hide unknown access evidence in the helper.

### Step 2: Run the targeted test and confirm failure

```bash
pnpm exec vitest run tests/provider/provider-search-domain.test.ts
```

Expected: fail because the V2 contracts/evaluator do not exist.

### Step 3: Implement the minimum domain contract

`packages/domain-provider/src/provider-search.ts` should contain Zod schemas/types similar to:

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
  location: z
    .object({
      suburb: z.string().trim().max(120).optional(),
      postcode: z.string().trim().max(16).optional(),
      state: z.string().trim().max(8).optional(),
    })
    .optional(),
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

export type ProviderRegistrationProjection = {
  status: "registered" | "ambiguous" | "source_unavailable";
  source: "official_ndis_provider_finder";
  sourceDate?: string | null;
  checkedAt?: string | null;
  registrationGroups: string[];
};

export type ProviderEvidenceFact = {
  key: string;
  value: boolean | string | string[] | null;
  state: ProviderEvidenceState;
  sourceLabel: string;
  checkedAt?: string | null;
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

Implement `evaluateProviderSearchCandidate()` and `rankProviderSearchResults()` as pure deterministic functions. Required known conflicts exclude. Required unknowns stay visible with `needs_confirmation`. Preferred unknowns/mismatches downgrade to `possible_match` but do not exclude. Do not calculate a universal percentage score.

For this first registered-provider-only source, NDIA-managed requests require `registration.status === "registered"`. Plan-managed/self-managed/private requests do not gain or lose rank from registration because all candidates in this official source are already registered; a later MapAble listing source can add unregistered candidates under separate evidence.

### Step 4: Re-export and run tests

Modify `packages/domain-provider/src/index.ts`:

```ts
export * from "./provider-search";
```

Run:

```bash
pnpm exec vitest run tests/provider/provider-search-domain.test.ts tests/intelligence/provider-workforce.test.ts
```

Expected: pass with existing provider/workforce evidence tests unchanged.

### Step 5: Commit

```bash
git add packages/domain-provider/src/provider-search.ts packages/domain-provider/src/index.ts tests/provider/provider-search-domain.test.ts
git commit -m "feat(provider-finder): add deterministic search contracts"
```

**Review gate:** Confirm the matcher does not read Prisma, React, Next.js or environment variables.

---

## Task 2: Remove Registration-Group and Identifier Logic from the App Layer

**Files:**
- Create: `packages/domain-provider/src/ndis-registration-groups.ts`
- Modify: `packages/domain-provider/src/index.ts`
- Modify: `app/provider-finder/regGroupOptions.ts`
- Create: `lib/ndis/provider-outlet-identifiers.ts`
- Modify: `app/provider-finder/outletToProvider.ts`
- Modify: `lib/ndis/map-provider-outlet-prisma.ts`
- Modify/Create tests: `tests/map-mappers.test.ts`, `tests/provider/provider-outlet-identifiers.test.ts`

### Step 1: Write failing tests for stable registration-group mapping and outlet identifiers

Cover:

```ts
expect(regGroupIndicesToCategories([34, 29])).toEqual([
  "Support Coordination",
  "Therapeutic Supports",
]);

expect(buildProviderOutletIdentifiers(outlet, 0)).toMatchObject({
  abn: "12345678901",
  slug: expect.any(String),
  id: expect.any(String),
});
```

Also test that identical source records produce identical identifiers across calls.

Run:

```bash
pnpm exec vitest run tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
```

Expected: fail before the pure helpers exist.

### Step 2: Move the registration-group taxonomy into the provider domain package

Put the existing 1–36 NDIS registration-group lookup and `regGroupIndicesToCategories()` in `packages/domain-provider/src/ndis-registration-groups.ts`. Re-export it from `packages/domain-provider/src/index.ts`.

Keep `app/provider-finder/regGroupOptions.ts` as a temporary compatibility re-export only:

```ts
export {
  NDIS_REGISTRATION_GROUPS as REG_GROUP_OPTIONS,
  regGroupIndicesToCategories,
} from "@mapable/domain-provider";
```

Do not keep two independently editable copies of the taxonomy.

### Step 3: Extract stable outlet identifiers

Create `lib/ndis/provider-outlet-identifiers.ts` with pure functions that produce the existing outlet `id`, `slug` and `outletKey` semantics from `ProviderOutlet` without constructing a legacy UI `Provider` object.

Update `app/provider-finder/outletToProvider.ts` to consume the helper for legacy compatibility. Update `lib/ndis/map-provider-outlet-prisma.ts` to use the helper directly instead of calling `mapOutletToProvider()`.

The dependency direction after this task should be:

```text
app/provider-finder -> lib/ndis helpers -> domain-provider
lib/ndis            -> domain-provider
```

not `lib/ndis -> app/provider-finder`.

### Step 4: Run tests and type-check

```bash
pnpm exec vitest run tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
pnpm type-check
```

### Step 5: Commit

```bash
git add packages/domain-provider/src app/provider-finder/regGroupOptions.ts app/provider-finder/outletToProvider.ts lib/ndis/provider-outlet-identifiers.ts lib/ndis/map-provider-outlet-prisma.ts tests/provider/provider-outlet-identifiers.test.ts tests/map-mappers.test.ts
git commit -m "refactor(provider-finder): isolate NDIS provider mapping"
```

**Review gate:** No new import under `lib/` or `packages/` may depend on `@/app/provider-finder/*`.

---

## Task 3: Build the ProviderOutletRegistry Reader and Provenance-Aware Projection

**Files:**
- Create: `lib/provider/finder/provider-registry-repository.ts`
- Create: `lib/provider/finder/provider-registry-projection.ts`
- Create: `lib/provider/finder/provider-search-service.ts`
- Create: `tests/provider/provider-registry-projection.test.ts`
- Create: `tests/provider/provider-search-service.test.ts`

### Step 1: Write failing projection tests

Use plain row fixtures rather than a real database. Cover:

- active official registry row maps to `registration.status === "registered"`;
- `sourceDate` and import/check time are preserved;
- registration groups become service labels;
- accessibility and availability are `unknown` unless a separate evidence overlay supplies them;
- registration never creates an accessibility fact;
- missing coordinates remain null, not fabricated.

Example:

```ts
const projection = projectRegistryRow({
  id: "outlet-1",
  abn: "12345678901",
  name: "Example Supports",
  active: true,
  state: "NSW",
  postcode: "2075",
  regGroup: [34],
  sourceDate: "2026-09-11",
  importedAt: new Date("2026-09-13T00:00:00Z"),
  updatedAt: new Date("2026-09-13T00:00:00Z"),
  latitude: null,
  longitude: null,
  // remaining selected fields...
});

expect(projection.registration.status).toBe("registered");
expect(projection.services).toContain("Support Coordination");
expect(projection.availability.state).toBe("unknown");
expect(projection.evidence.find((e) => e.key === "step_free_entrance")).toBeUndefined();
```

### Step 2: Run the projection test and confirm failure

```bash
pnpm exec vitest run tests/provider/provider-registry-projection.test.ts
```

### Step 3: Implement the repository boundary

Define a narrow reader interface in `provider-registry-repository.ts`:

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

Implement the production reader with `prisma.providerOutletRegistry`. Determine the current materialised snapshot by the most recently imported row. When a non-null latest `sourceDate` exists, constrain V2 search to that same `sourceDate`; this prevents rows absent from a newer official export from silently remaining in V2 results merely because an old materialised row is still `active=true`.

Repository filters may include official directory facts only: provider name/ABN, state, postcode and registration-group indexes. Do not query accessibility from free text.

### Step 4: Implement `provider-search-service.ts` using dependency injection

The service signature should allow a fake reader in tests:

```ts
export async function searchProviderRegistry(
  input: ProviderSearchRequest,
  deps: { registry: ProviderRegistryReader; now?: Date },
): Promise<ProviderSearchResponse>;
```

`ProviderSearchResponse` contains:

```ts
{
  interpretation: ProviderSearchRequest;
  results: ProviderSearchProjection[];
  resultSummary: {
    total: number;
    strongMatches: number;
    possibleMatches: number;
    needsConfirmation: number;
  };
  sourceState: {
    source: "official_ndis_provider_finder";
    sourceDate: string | null;
    importedAt: string | null;
    sourceUnavailable: boolean;
  };
  rulesVersion: "provider-finder-v2.1";
}
```

If the repository throws, the service must not return zero results as if there are no providers. It should throw/return a typed `SOURCE_UNAVAILABLE` outcome for the API layer.

### Step 5: Test matching and source outage

`tests/provider/provider-search-service.test.ts` must prove:

- query results use only the latest source date when available;
- source failure maps to `SOURCE_UNAVAILABLE`, not `not_found`;
- required unknown access evidence yields `needs_confirmation`;
- ordering is deterministic across repeated runs;
- no review/rating field exists in the V2 projection.

Run:

```bash
pnpm exec vitest run tests/provider/provider-registry-projection.test.ts tests/provider/provider-search-service.test.ts
```

### Step 6: Commit

```bash
git add lib/provider/finder/provider-registry-repository.ts lib/provider/finder/provider-registry-projection.ts lib/provider/finder/provider-search-service.ts tests/provider/provider-registry-projection.test.ts tests/provider/provider-search-service.test.ts
git commit -m "feat(provider-finder): project official registry with provenance"
```

**Review gate:** The application service must be testable without Prisma and must not infer unsupported accessibility/availability facts.

---

## Task 4: Add the V2 Search API, Funding Semantics and Default-Off Feature Flag

**Files:**
- Create: `lib/config/provider-finder-v2.ts`
- Create: `app/api/providers/search/route.ts`
- Create: `lib/provider/finder/provider-search-client.ts`
- Create: `tests/provider/provider-search-api.test.ts`
- Modify: `.env.example` or the repository's established environment documentation file if `.env.example` exists
- Modify: `docs/data/ndis-provider-registry-prisma.md`

### Step 1: Write API contract tests first

Test `providerSearchRequestSchema` validation through the route/service boundary for:

- valid POST body;
- invalid/malformed body -> 400;
- over-limit arrays -> 400;
- repository outage -> 503 with `code: "SOURCE_UNAVAILABLE"`;
- no matches -> 200 with `results: []` and `sourceUnavailable: false`;
- raw functional requirements are not echoed to logs/analytics by route code.

Run:

```bash
pnpm exec vitest run tests/provider/provider-search-api.test.ts
```

Expected: fail before the route exists.

### Step 2: Add feature flags

`lib/config/provider-finder-v2.ts`:

```ts
export const providerFinderV2Config = {
  serverEnabled: process.env.MAPABLE_PROVIDER_FINDER_V2_ENABLED === "true",
  clientEnabled:
    process.env.NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED === "true",
};
```

Both default to false. The client flag is only a presentation/routing hint; server policy must not trust it.

### Step 3: Implement `POST /api/providers/search`

Use:

- Zod parse of JSON body;
- existing IP-rate-limit utility for anonymous public use;
- `searchProviderRegistry()`;
- a public-safe error envelope.

Conceptual route:

```ts
export async function POST(request: Request) {
  if (!providerFinderV2Config.serverEnabled) {
    return Response.json(
      { error: "Provider Finder V2 is not enabled.", code: "FEATURE_DISABLED" },
      { status: 404 },
    );
  }

  const parsed = providerSearchRequestSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await searchProviderRegistry(parsed.data, {
      registry: prismaProviderRegistryReader,
    });
    return jsonOk(result);
  } catch (error) {
    if (isProviderSourceUnavailable(error)) {
      return Response.json(
        { error: "Provider registry is temporarily unavailable.", code: "SOURCE_UNAVAILABLE" },
        { status: 503 },
      );
    }
    throw error;
  }
}
```

Do not put access/communication requirements into query parameters.

### Step 4: Encode current funding semantics conservatively

Current official NDIS guidance checked when this plan was authored states that NDIA-managed funding requires registered providers, while self-managed/plan-managed participants can usually use registered or unregistered providers with service-specific exceptions. This first slice searches the official NDIS Provider Finder, so **every candidate is a registered-provider candidate**. Therefore:

- `ndia_managed`: require `registered` within this source;
- `plan_managed`, `self_managed`, `private`, `unknown`: do not exclude official registered candidates merely because the user may also have unregistered-provider options;
- UI/source notes must say that this source is the official registered-provider directory and is not a complete directory of unregistered options.

Do not hard-code the specialist-exception matrix in this first slice. Add that only when MapAble adds an unregistered-provider source and the current policy adapter is separately reviewed.

### Step 5: Implement typed browser client

`provider-search-client.ts` should POST only the validated typed request and return `ProviderSearchResponse`. It must surface the `SOURCE_UNAVAILABLE` code distinctly from an empty result set.

### Step 6: Run tests and type-check

```bash
pnpm exec vitest run tests/provider/provider-search-api.test.ts tests/provider/provider-search-service.test.ts
pnpm type-check
```

### Step 7: Commit

```bash
git add lib/config/provider-finder-v2.ts app/api/providers/search/route.ts lib/provider/finder/provider-search-client.ts tests/provider/provider-search-api.test.ts docs/data/ndis-provider-registry-prisma.md .env.example
git commit -m "feat(provider-finder): add provenance-aware search API"
```

If `.env.example` does not exist, omit it from the commit and document the flags in the repository's existing environment reference instead; do not create a second competing environment-documentation convention.

**Review gate:** Verify that anonymous search does not persist raw free-text or functional access requirements by default.

---

## Task 5: Build Evidence-First Provider Result Components

**Files:**
- Create: `components/provider-finder/v2/ProviderEvidenceLabel.tsx`
- Create: `components/provider-finder/v2/ProviderMatchLabel.tsx`
- Create: `components/provider-finder/v2/ProviderFinderResultCardV2.tsx`
- Create: `components/provider-finder/v2/ProviderSourceNotice.tsx`
- Modify: `lib/provider/use-platform-care-link.ts`
- Create: `tests/provider/provider-finder-result-card.test.tsx` if the repository's Vitest environment supports React component tests; otherwise cover rendering in the Playwright task and keep pure label-format tests in Vitest.

### Step 1: Write failing presentation tests

Verify the card text semantics:

- `registered` renders as `Official NDIS provider record` / `Registered provider`, not `Verified provider`;
- `unknown` accessibility renders `Not assessed` or `Needs confirmation`;
- no stars, review count, inferred response time or inferred availability appear;
- checked/source date appears when present;
- match classification has visible text independent of colour.

### Step 2: Implement evidence/status components

Use semantic text first, styling second. Example output:

```text
Northern Supports
Support Coordination · NSW 2075

Possible match

NDIS provider registration
Registered provider · Official NDIS Provider Finder
Source dated 11 Sep 2026

AAC/text communication
Not assessed

Current availability
Unknown
```

Do not use a universal green `Verified` badge.

### Step 3: Narrow the Care-link hook input

Change `usePlatformCareLink()` from the legacy `Provider` type to a minimal identifier contract:

```ts
export type PlatformCareLinkProviderRef = {
  abn?: string | null;
  slug?: string | null;
  outletKey?: string | null;
  name?: string | null;
};
```

This allows both legacy and V2 cards to reuse the existing ABN/registry resolver without importing `app/provider-finder/providers.ts` into `lib/provider`.

### Step 4: Run tests

```bash
pnpm exec vitest run tests/provider/provider-finder-result-card.test.tsx
pnpm type-check
```

If component-test infrastructure is not configured, replace the first command with a pure label-format test and leave full card assertions to Task 9 Playwright; do not install a new React testing stack solely for this task.

### Step 5: Commit

```bash
git add components/provider-finder/v2 lib/provider/use-platform-care-link.ts tests/provider
git commit -m "feat(provider-finder): add evidence-first result cards"
```

**Review gate:** Search the new V2 component directory for `rating`, `reviewCount`, `responseTime`, `verified profile`, and inferred accessibility language; none should be present.

---

## Task 6: Build the V2 Search Experience with List-First, Optional Map and Comparison

**Files:**
- Create: `components/provider-finder/v2/ProviderFinderV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderFiltersV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderResultsV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderCompareV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderMapV2.tsx`
- Create: `components/provider-finder/v2/ProviderFinderHumanHelp.tsx`
- Reuse where safe: `components/provider-finder/ProviderFinderAskPanel.tsx`, existing lazy map infrastructure
- Create: `tests/provider/provider-finder-view-model.test.ts`

### Step 1: Write failing view-model tests

Extract any non-trivial UI derivation into pure helpers and test:

- result counts by match class;
- comparison limited to 2–4 providers;
- map point list includes only results with real coordinates;
- list results remain complete when no coordinates exist;
- source outage produces an outage state, not an empty state;
- empty valid search produces a no-match state with requirement explanations.

### Step 2: Implement list-first V2 composition

Required structure:

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

The results collection uses semantic articles/list items. The map is an optional complementary region and must not be required to inspect, save, compare or request support.

### Step 3: Implement required/preferred filters

The UI must explicitly allow a user to mark a functional requirement as `Required` or `Preferred`. Initial supported keys should be bounded to the approved functional set and may render as unknown when no MapAble evidence overlay exists:

- home visit;
- telehealth;
- step-free premises;
- wheelchair-accessible transport;
- AAC/text communication;
- Auslan/interpreter support;
- quiet/low-sensory setting;
- assistance animals.

Do not keyword-search provider names/categories to fabricate these facts.

### Step 4: Integrate Ask MapAble as an optional interpreter

Reuse the existing Ask/guided-search surface only to produce/edit the same `ProviderSearchRequest`. Show the interpreted fields before or alongside search results. If Ask is disabled/unavailable, structured search remains complete.

### Step 5: Implement comparison and map synchronisation

Comparison exposes evidence dimensions and unknowns without an overall score. Map/list selection may synchronise visually, but selecting a marker must not steal focus from a screen-reader user's active result card.

### Step 6: Implement human-help panel

At minimum provide accessible links/actions for:

- get help from a person;
- report incorrect provider information;
- make a complaint/safety escalation through existing MapAble support pathways where those routes already exist.

Do not create fake support endpoints. Link only to routes verified in the repository; otherwise show the existing contact/help route.

### Step 7: Test and commit

```bash
pnpm exec vitest run tests/provider/provider-finder-view-model.test.ts
pnpm type-check
pnpm lint

git add components/provider-finder/v2 tests/provider/provider-finder-view-model.test.ts
git commit -m "feat(provider-finder): build accessible V2 search experience"
```

**Review gate:** Complete the search and provider inspection flow with the map component removed/disabled in a test render.

---

## Task 7: Wire Canonical and Legacy-Compatible Routes Without a Big-Bang Cutover

**Files:**
- Create: `app/support/providers/page.tsx`
- Create: `app/support/providers/ProviderFinderV2Client.tsx` only if a route-local client boundary is needed; otherwise import the shared component directly
- Modify: `app/provider-finder/page.tsx`
- Modify: `app/provider-finder/ProviderFinderClient.tsx` only for compatibility switch or leave untouched behind the old branch
- Modify: `components/layout/UnifiedParticipantNav.tsx`
- Create/Modify: tests under `tests/provider/provider-finder-routing.test.ts` and `tests/a11y/unified-shell.spec.ts`

### Step 1: Write failing routing/flag tests

Verify:

- with V2 flag off, `/provider-finder` continues to use the existing legacy path;
- with V2 flag on, `/provider-finder` and `/support/providers` render the same V2 search component/data contract;
- participant navigation points to `/support/providers` only when the V2 client-facing flag is enabled;
- no redirect loop exists;
- canonical metadata for the new route is correct.

### Step 2: Add `/support/providers`

This becomes the target route. Keep it publicly usable. Do not force authentication merely to search the official public provider directory.

When a signed-in participant enters through My MapAble, preserve their participant navigation context using existing shell conventions rather than duplicating a second Provider Finder implementation. If the current routing architecture cannot wrap an optional-auth public route in `UnifiedParticipantShell` without creating auth regressions, prefer shared V2 content plus consistent MapAble visual primitives in this slice and defer shell-wrapper refactoring to a separate bounded task; do not make public provider discovery auth-only.

### Step 3: Switch legacy page under the server flag

`app/provider-finder/page.tsx` chooses V2 only when the server flag is enabled; otherwise it renders the existing `ProviderFinderClient`.

The legacy URL remains valid throughout rollout.

### Step 4: Update participant navigation under the public flag

Use the existing navigation configuration pattern. Do not hard cut all users to `/support/providers` while the server-side V2 flag is off.

### Step 5: Run tests and commit

```bash
pnpm exec vitest run tests/provider/provider-finder-routing.test.ts
pnpm type-check
pnpm lint

git add app/support/providers app/provider-finder/page.tsx app/provider-finder/ProviderFinderClient.tsx components/layout/UnifiedParticipantNav.tsx tests/provider/provider-finder-routing.test.ts tests/a11y/unified-shell.spec.ts
git commit -m "feat(provider-finder): wire V2 routes behind feature flag"
```

**Review gate:** Both legacy-off and V2-on route states must build successfully before proceeding.

---

## Task 8: Remove Demo Provider Data from Production SEO and Discovery Paths

**Files:**
- Modify: `app/provider-finder/providers.ts`
- Create: `tests/fixtures/provider-finder/providers.ts`
- Modify: `lib/seo/local-landing.ts`
- Modify: `app/provider-finder/[suburb]/[service]/page.tsx`
- Modify: `app/sitemap.ts`
- Modify as needed: `lib/seo/provider-profile-json-ld.ts`, `components/DirectoryView.tsx`, map helpers that only import the legacy *type*
- Create: `tests/provider/provider-demo-data-boundary.test.ts`
- Modify/Create: `tests/seo/local-landing.test.ts`

### Step 1: Write a failing production-boundary test

The test should scan production TypeScript/TSX source and fail if `PROVIDERS` from `app/provider-finder/providers.ts` is imported outside tests/fixtures.

The boundary test must distinguish the generic word `Providers` from the exact demo constant/import path. A simple file scan is sufficient:

```ts
expect(offendingFiles).toEqual([]);
```

### Step 2: Move synthetic records to test fixtures

Move the 12 synthetic/demo records to `tests/fixtures/provider-finder/providers.ts` under a name such as `PROVIDER_FIXTURES`.

`app/provider-finder/providers.ts` may temporarily retain only legacy type definitions required by untouched compatibility components. Mark the type surface deprecated and point new code to `@mapable/domain-provider` V2 contracts.

Do not leave a production-exported synthetic `PROVIDERS` array.

### Step 3: Make local SEO source-driven

Refactor `lib/seo/local-landing.ts` so matching helpers accept explicit provider projections/registry candidates and never default to demo data. Keep the service taxonomy and curated seed suburbs if still useful.

`app/provider-finder/[suburb]/[service]/page.tsx` must query the official registry-backed service for actual results. If no official result is available, render an honest empty/related-search state; do **not** fall back to fictional neighbouring providers.

Do not emit synthetic rating/review structured data. Do not infer wheelchair accessibility from `In-person`. `LocalBusinessSchema` receives only source-supported properties.

### Step 4: Remove demo provider entries from sitemap generation

`app/sitemap.ts` must stop importing `PROVIDERS`. Keep curated local landing paths only if they are legitimate route inventory, or generate only registry-backed paths using a bounded server-side source. Do not generate provider profile URLs for fictional records.

### Step 5: Keep compatibility types without creating a second truth source

Files such as old map/profile components may continue importing a legacy `Provider` type during staged migration, but no production route may receive synthetic records from that module. If a touched helper can be converted cheaply to the V2 projection, do so; otherwise leave a documented compatibility boundary for a later migration.

### Step 6: Test and commit

```bash
pnpm exec vitest run tests/provider/provider-demo-data-boundary.test.ts tests/seo/local-landing.test.ts
pnpm type-check
pnpm lint

git add app/provider-finder/providers.ts tests/fixtures/provider-finder/providers.ts lib/seo/local-landing.ts app/provider-finder/[suburb]/[service]/page.tsx app/sitemap.ts lib/seo/provider-profile-json-ld.ts components/DirectoryView.tsx tests/provider/provider-demo-data-boundary.test.ts tests/seo/local-landing.test.ts
git commit -m "refactor(provider-finder): remove demo data from production paths"
```

Only add files to the commit that actually changed.

**Review gate:** Run repository search for the exact import path/constant and confirm remaining demo-provider usages are test fixtures or explicitly demo-only modules.

---

## Task 9: Add Accessibility, Failure-Mode and Commercial-Separation E2E Coverage

**Files:**
- Create: `tests/a11y/provider-finder-v2.spec.ts`
- Modify: `playwright.config.ts`
- Create/Modify: `tests/provider/provider-finder-commercial-separation.test.ts`
- Modify if required: provider V2 components for discovered accessibility defects

### Step 1: Add the Playwright project/test before fixing UI defects

Add a `provider-finder-v2` Playwright project or include the spec in the existing public project. Gate it with `NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED=true` and server flag in the test web server environment.

The E2E suite must cover:

1. page has one clear H1 and a main landmark;
2. keyboard-only search submission;
3. result-count update announced through `role=status`/live region;
4. provider result cards expose visible evidence text;
5. no colour-only match status;
6. a search can be completed and provider details inspected without opening the map;
7. selecting a list result does not unexpectedly move focus into the map;
8. source-unavailable state is distinguishable from zero results;
9. human-help action is keyboard reachable;
10. axe serious/critical violations are zero for the tested state.

### Step 2: Add commercial-separation invariant tests

Create a pure test proving that adding sponsored placement metadata does not change the result of `rankProviderSearchResults()`. Organic ranking must receive only organic candidates/evidence and must not consume ad bid, sponsorship or campaign fields.

### Step 3: Run targeted browser tests

Example local verification:

```bash
MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
pnpm exec playwright test tests/a11y/provider-finder-v2.spec.ts --project=provider-finder-v2
```

If the route requires a seeded database, use the repository's established test database/seed process. Do not point Playwright at production data.

### Step 4: Manual accessibility gate

Record evidence in the PR description or verification note for:

- keyboard-only critical flow;
- screen-reader spot check (NVDA/VoiceOver/TalkBack as locally available);
- 200% browser zoom/reflow;
- reduced-motion behaviour;
- map-independent completion;
- text/AAC-compatible path (no phone-only action).

Automated axe success alone is not sufficient.

### Step 5: Commit

```bash
git add tests/a11y/provider-finder-v2.spec.ts playwright.config.ts tests/provider/provider-finder-commercial-separation.test.ts components/provider-finder/v2
git commit -m "test(provider-finder): verify accessibility and ranking isolation"
```

**Review gate:** A sponsored-result component may appear visually, but no test or production matcher accepts sponsorship as a scoring input.

---

## Task 10: Final Verification, Documentation and Preview-Ready Gate

**Files:**
- Modify: `docs/data/ndis-provider-registry-prisma.md`
- Create: `docs/provider-finder/provider-finder-v2-release-checklist.md`
- Modify only if required by verified findings: code/tests from Tasks 1–9

### Step 1: Document the final source architecture

Update registry documentation to state clearly:

```text
Official NDIS Provider Finder export
  -> ProviderOutletRegistry
  -> provider-registry-repository
  -> ProviderSearchProjection
  -> deterministic matcher
  -> POST /api/providers/search
  -> Provider Finder V2 UI
```

Document the distinction between:

- official registered-provider evidence;
- MapAble verified evidence;
- provider-declared evidence;
- unknown/not assessed information.

Also document that `/api/providers/ndis/search` and the separate `ndis_providers` ingestion remain compatibility/agent surfaces for now and are **not** the canonical V2 UI source.

### Step 2: Create release checklist

`docs/provider-finder/provider-finder-v2-release-checklist.md` must contain concrete gates:

- feature flags default off;
- production registry populated from an official-source snapshot;
- source date visible;
- no demo-provider production dependency;
- no synthetic ratings/reviews;
- source outage tested;
- list-only flow tested;
- accessibility manual evidence recorded;
- Vercel preview green;
- runtime error scan clean for preview;
- rollback = disable V2 flags / restore legacy route;
- no production enablement without explicit authorisation.

### Step 3: Run full verification

Run from a clean install/worktree appropriate to the implementation environment:

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

Then targeted V2 browser suite:

```bash
MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
NEXT_PUBLIC_MAPABLE_PROVIDER_FINDER_V2_ENABLED=true \
pnpm exec playwright test tests/a11y/provider-finder-v2.spec.ts --project=provider-finder-v2
```

Document any **pre-existing** failure separately from an introduced failure. Do not waive an introduced failure.

### Step 4: Verify production is untouched

Before declaring the implementation branch ready for review, confirm:

- no Vercel production promotion was performed;
- no production environment value was changed;
- no DB migration was applied to production by this plan (none should be required for the first slice unless the implementation uncovers a proven blocker and the plan is formally revised);
- V2 flags remain default off;
- legacy `/provider-finder` path still has rollback compatibility.

### Step 5: Commit documentation

```bash
git add docs/data/ndis-provider-registry-prisma.md docs/provider-finder/provider-finder-v2-release-checklist.md
git commit -m "docs(provider-finder): add V2 release and rollback gates"
```

### Step 6: Independent whole-branch review

Before opening or updating a PR, run an independent review of the complete branch against:

- the approved architecture spec;
- this implementation plan;
- Provider Finder evidence/source rules;
- WCAG 2.2 AA critical-flow requirements;
- privacy and commercial-separation invariants.

Resolve blockers before calling the branch implementation-complete.

---

## Planned PR / Review Shape

This plan is intentionally suitable for one focused Provider Finder convergence branch, but execution should still create small task commits. If review size becomes excessive, split after Task 4 into two stacked PRs:

1. **Provider Finder V2 foundation:** Tasks 1–4 (contracts, registry projection, service, API, flags).
2. **Provider Finder V2 experience:** Tasks 5–10 (evidence UI, route convergence, demo-data retirement, accessibility, release gates).

Do not split the official source projection from its provenance/failure semantics, and do not merge the UI PR before the foundation it consumes is approved.

## Stop Conditions

Stop implementation and ask for a decision if any of the following occurs:

- current repository state has materially diverged from base SHA and changes the Provider Finder source model;
- official NDIS Provider Finder semantics no longer support the statement that its listings are registered providers;
- the provider registry in the intended environment is missing or materially incomplete;
- implementing V2 would require production secrets or direct production mutation;
- a schema migration becomes necessary despite this plan's migration-free first slice;
- a requested accessibility requirement can only be satisfied by inventing provider evidence;
- a commercial/ads component attempts to feed sponsorship into organic ranking;
- a test requires real participant data;
- an implementation choice would silently broaden this plan into Worker Screening, direct service booking, payments, AccessXR or autonomous AI execution.

## Definition of Done for This Implementation Programme

Provider Finder 2.0 is implementation-complete for review when the V2 feature-flagged path reads official `ProviderOutletRegistry` data, returns typed provenance-aware projections, applies deterministic matching, never substitutes unknown evidence with inference, works without map or AI, no longer uses synthetic provider records in production discovery/SEO paths, preserves Care handoff through explicit identifiers, passes targeted and repository-wide verification, and has a tested flag-based rollback path. Production enablement remains a separate decision.