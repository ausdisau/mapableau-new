# Provider Finder regulatory evidence | draft integration
**Repository:** `ausdisau/mapableau-new`
**Feature branch:** `feat/provider-finder-regulatory-evidence-20261031`
**Source branch:** `main` at `2301ace85779ff77de3e46f42c07dd39f0c87472`
**Status:** Implemented on draft branch. Not merged, deployed or independently runtime tested.

## Existing MapAble building blocks reused
- `app/provider-finder/ProviderFinderClient.tsx` — Next.js/Tailwind filter and list/map entrypoint.
- `components/provider-finder/ProviderFinderResultCard.tsx` — accessible list and provider actions.
- `lib/map/mappers/provider-outlet.ts` — adapts `public/data/provider-outlets.json` imported provider outlets.
- `lib/provider/finder/use-provider-outlets.ts` — React Query cache of the imported local dataset.
- `app/api/providers/map/route.ts` — existing MapLibre map-pin endpoint using Neon imported data.
- Draft #627 provides a dedicated service map; draft #628 adds authenticated conversational search and optional consented profiles. **Neither PR is merged into this branch.** Reconcile the stacks before merging.

## Implemented changes
- `lib/provider/finder/evidence.ts` — normalized local directory activity status and explicit evidence states, no substring-based positive registration.
- `components/provider-finder/ProviderRegulatoryEvidence.tsx` — accessible disclosure of source, import activity, unknown live registration, unknown worker clearance and official human verification links.
- `lib/map/mappers/provider-outlet.ts` — carries explicit `source=ndis_import` and local activity, separately from legacy `registered` Boolean.
- `ProviderFinderResultCard.tsx` — removes unverified availability, response times, star claims and misleading verification label.
- `ProviderFinderClient.tsx` — replaces the legacy registration Boolean funding filter with **local directory activity only**, and explains that access preferences are not proof of access features.
- `tests/provider-finder/provider-regulatory-evidence.test.ts` — regression coverage for negative statuses, AAC statements, provenance and unknown screening.

## Known limitations and hard release blockers
1. **Old URL filter labels still say "NDIS registered" / "Private / self-funded"** in the sidebar while now filtering local directory active/inactive status. Update labels and query semantics before user release; never describe local-active as current registered or funding eligible.
2. Do not infer screening clearance, training or safe service from provider registration. There is no NWSD connector, Commission live registry lookup or authorised worker verification.
3. The main app still needs WCAG 2.2 AA, AAC, keyboard, screen-reader, list/map parity and integration tests; no local full Next.js build was possible in this isolated environment.
4. PR #628 introduces additional source/profiles and a draft migration requiring independent staged security review; **do not apply its migration** as part of this patch.
5. Confirm registration by ABN via current Commission Provider Register. Imported directory activity is historical and not current Commission status. Do not present demo sample records as recommendations.
6. Legacy `Provider.registered` remains for compatibility in unrelated components and must be audited before a production release, as other call sites can still misuse it.

## Suggested validation
```bash
pnpm exec vitest run tests/provider-finder/provider-regulatory-evidence.test.ts
pnpm type-check
pnpm lint:app-rest
pnpm lint:components
pnpm lint:lib
```
Run all CI, security and accessibility checks; collect source timestamp and real data verification; require human release approval. No production database or deployment modifications are part of this change.
