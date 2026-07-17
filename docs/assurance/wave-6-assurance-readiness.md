# Wave 6 assurance readiness

Implementation overview for MapAble NDIS Wave 6 internal assurance controls.

## Scope

Wave 6 adds registration cyber assurance, evidence governance, go-live gates, and admin visibility. It extends existing `SecurityFramework` / `SecurityControl` models — it does not replace them.

## Implementation areas

| Area | Location | Purpose |
|------|----------|---------|
| Frameworks & controls | `lib/assurance/frameworks`, `lib/assurance/controls` | Internal control catalogues |
| Evidence | `lib/assurance/evidence` | Checksums, classification, freshness |
| Testing | `lib/assurance/testing` | Control tests and operating effectiveness |
| Readiness | `lib/assurance/readiness` | Evaluation and projection |
| Go-live | `lib/assurance/go-live` | Production gate — flags alone never pass |
| Registration | `lib/assurance/registration` | NDIS digital platform pathway tracking |
| NDIA partnership | `lib/assurance/ndia-application` | Application state only (no credentials) |
| Admin UI | `app/admin/assurance` | Read-only operational visibility |

## Acceptance criteria summary

1. **Controls seeded** — internal baseline, privacy (APP), NDIS quality safeguards, and NDIA digital platform catalogues available via `assurance:backfill-frameworks`.
2. **Evidence linkable** — `AssuranceEvidence` records with checksums; legacy `SecurityEvidence` thin pointers maintained.
3. **Tests block readiness** — failed, blocked, partial, or not-run test results block operating status.
4. **Exceptions governed** — approved, non-expired exceptions only; empty exceptions never support approval.
5. **Go-live gated** — `ProductionGoLiveAssessment` requires assurance, registration, worker trust, and rollback plan — not feature flags alone.
6. **Registration tracked** — `NdisRegistrationApplication` with 0137 group flag; status ≠ platform approval.
7. **NDIA partnership tracked** — boolean flags for myID/RAM configuration; no secret storage.
8. **Auditor export** — JSON bundle under `artifacts/assurance/`; restricted evidence excluded.
9. **Scripts support `--dry-run`** — all assurance scripts DB-optional in dry-run mode.
10. **Admin pages accessible** — semantic lists/tables with amber disclaimers.

## Regulatory references (titles only)

- *How to connect to our systems*
- *Connecting with NDIA systems*
- *Mandatory registration and transition pathways for NDIS digital platforms*
- *Apply for registration*
- *Registration groups or classes of support*
- *NDIS Practice Standards and Quality Indicators*
- *Australian Privacy Principles*

## Related docs

See also [controls and evidence](./controls-and-evidence.md), [go-live readiness](./go-live-readiness.md), and [disclaimers](./disclaimers.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- MapAble does not claim SOC 2, ISO 27001, or NDIS digital platform certification from this work.
