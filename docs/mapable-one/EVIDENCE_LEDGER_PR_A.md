# Evidence ledger — PR A MapAble One Unified Visual System

Recorded at implementation start. Times in Australia/Sydney.

| Item | Observed path / commit / deployment | Source timestamp | Status | Risk | Owner |
|------|--------------------------------------|------------------|--------|------|-------|
| Repository main tip | `origin/main` @ `f89cc8f90468f5c9001b898a47cc153a0c3ad514` (Care Scheduler #733 merge) | 2026-11-21 ~08:10 AEDT | Verified | Branch must re-fetch before merge | Eng |
| Design tokens SoT | `app/index.css`, `packages/ui/src/tokens/index.ts`, `lib/brand/styles.ts` | Inspected | Implemented | Parallel token layers (transport-booking) stay scoped | Design |
| Role shells | `AuthenticatedRoleAppShell`, `DashboardAppShell`, provider/worker layouts | Inspected | Implemented | Flag must not bypass guards | Eng |
| Provider metrics | `lib/provider/provider-control-panel-service.ts` | Inspected | Implemented | Org-scoped only | Eng |
| Worker today | `app/worker/today/page.tsx`, `workerProfileForUser` (first active profile) | Inspected | Implemented | Multi-affiliation deferred to PR B | Eng |
| Approved logos | `public/brand/*`, `lib/brand/constants.ts` | Inspected | Verified | Campaign logo provisional — not swapped | Brand |
| Ad collateral ZIP | Not present in Cursor uploads | 2026-11-21 | Missing | Provisional hex from master prompt §4 | Brand |
| Reference packs (Transport/Cartography/Search/MUAI/AD One/Agentic) | Not present in workspace | 2026-11-21 | Missing | Do not invent pack contents | Eng |
| MapAble One ops hub (#735) | Draft PR; `/provider/one` + `MAPABLE_ONE_OPERATIONS_HUB_ENABLED` on Search #728 | Open draft | In development | Distinct flag; PR A does not add `/provider/one` | Eng |
| Transport stack #730/#731/#734 | Open drafts | Open | In development | Preserve routes; no parallel booking SoT | Eng |
| Baseline CI | tsc ads/marketplace; duplicate `/ecosystem`; expired audit allowlist | Seen on #730–#734 | Historical / baseline | Do not mislabel as PR A regressions | Eng |
| Production domain SHA | Not independently verified this run | — | Not independently verified | No production claim | Ops |
| Platform-wide skin | `html.mapable-one` + AuthenticatedRoleAppShell / DashboardAppShell / MapAbleAppShell / MyMapAbleAppShell | PR A implementation | Implemented (flag-gated) | Must keep both env flags in sync | Eng |

## Explicitly NOT performed

- Production deploy, DNS, merge to main, flag enablement
- Logo replacement from campaign artwork
- Schema migration, identity federation, payment/dispatch enablement
- Fabricated bookings, participant PII, workforce credentials, or KPI numbers as live
