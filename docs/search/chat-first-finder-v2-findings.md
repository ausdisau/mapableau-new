# Chat-first Provider Finder v2 — baseline findings

**Status:** development-preview brief. Not a live chatbot redesign and not production registration.
**Inspected HEAD:** `a8b7bfbb850563673a3622a49d73341c3c37d0fb` (`main`, 2026-11-17). The brief’s SHA `4b8e848d…` is **not in this repository**.
**PRD file:** `PRD_Chat_First_Provider_Finder_v2.md` was not in the tree; the implementation brief is the spec.
**Layout:** there is no `apps/web`. Work is in the root Next.js App Router app. Expo / `apps/independence` / `apps/places` are out of scope.

## Overlap

| Item | Note |
| --- | --- |
| [#184](https://github.com/ausdisau/mapableau-new/pull/184) | Stale June 2026 chat-first split. Replaces the form, not flag-gated. **Do not revive.** |
| [#638](https://github.com/ausdisau/mapableau-new/pull/638) | Merged regulatory-evidence copy. Card labels in `evidence.ts` already avoid “Verified profile / Available this week”. |

## Dual sources (do not merge)

| Surface | Source | Freshness |
| --- | --- | --- |
| Finder list/cards | `public/data/provider-outlets.json` via `lib/provider/finder/provider-outlets.ts` | JSON `"date": "30 January 2026"`. `fetchProviderOutlets` previously dropped `date`. |
| Chat snippets / SQL | Prisma `ndis_providers` (`source_id`, `source_updated_at`, `ingested_at`) | Only when ingested. Empty in many preview/dev environments. |
| Live registration | [NDIS Commission Provider Register](https://www.ndiscommission.gov.au/provider-registration/find-registered-provider) | **Not** in this app. |

NDIS Commission page (retrieved 17 Nov 2026, Australia/Sydney): live registration is the Provider Register. NDIS Digital Platform / SIL transitional rules (apply by 1 October 2026) affect **paid matching and platform operation**, not just chat UI. Keep regulated activity disabled. A provider name or imported `Active` flag does **not** verify a worker’s clearance, high-intensity competence, or current capacity.

## Blocking defects (file / line at inspection)

1. **Name-only FTS concatenation** — `lib/provider/finder/ndis-search-from-applied.ts` joined provider name, query, suburb and service into `q`. `lib/ingestion/ndis-providers-search.ts` applied `to_tsvector('english', provider_name) @@ plainto_tsquery`. Suburb and service were searched as provider names. Map route parsed state/postcode but not suburb ILIKE (`app/api/providers/map/route.ts`).
2. **`registered` from group length** — `ndisRowToCopilotResult` and `lib/map/mappers/ndis-provider.ts` set `registered: registration_groups.length > 0`. Groups-on-file is not live Commission registration.
3. **Snapshot date dropped** — outlets JSON has `date`; fetch returned `data` only.
4. **Chat unmounted after search** — `app/provider-finder/ProviderFinderClient.tsx` rendered `ProviderFinderAskPanel` only when `!searchSubmitted`.
5. **Chat POST unvalidated** — `app/api/provider-finder/chat/route.ts` cast JSON; no Zod, no history bound. Session store is an in-memory `Map` (`lib/ai/agent-sessions/provider-finder-session.ts`). Rate limit is also process-local (`lib/api/ip-rate-limit.ts`, `docs/operations/RATE_LIMITING.md`) and is **not** globally enforceable across instances.
6. **No Skip / Not sure** on `components/guided-search/GuidedSearchChoiceChips.tsx`.
7. **Weak empty state** — “Try broadening…” only; no edit / confirm-broaden / directory / human support.
8. **`aria-live="polite"` on the full chat log** — `GuidedSearchMessageList.tsx` re-announced streaming tokens.
9. **Demo ratings** — `app/provider-finder/providers.ts` fixture ratings; `[suburb]/[service]/page.tsx` + `DirectoryView` emitted stars and “NDIS registered”.
10. **Card copy already honest** in `ProviderFinderResultCard` / `getProviderEvidence` (availability unknown, registration not independently verified). Remaining work is provenance dates, search mapping, and layout.

## Preview decision

- **GO** only as an internal, flag-off-by-default, human-reviewed preview.
- **NO-GO** for production, paid matching, booking, or any live registration/availability claim.
- Rollback for layout: unset `MAPABLE_PROVIDER_FINDER_CHAT_FIRST_V2_ENABLED`. Search-mapping and label honesty stay (correctness, not the preview chrome).
- Guest axe for `/provider-finder` already exists in `tests/a11y/route-shells.spec.ts`. That is not WCAG 2.2 AA evidence. Manual NVDA/VoiceOver/400% zoom remain `NOT_RUN`.

## Quality gates (this branch)

- Targeted vitest for finder/chat-first files: pass.
- Targeted eslint on touched finder files: pass after import-order fix in `app/api/providers/chat-search/route.ts` (pre-existing order on `main`).
- `pnpm type-check` still fails on **pre-existing** errors outside this slice: `lib/ads/discovery/provider-discovery.ts`, `lib/marketplace/accessimart-review-adapter.ts`, `tests/dashboard/participant-workspace-flags.test.ts`. No new tsc errors in finder files.
