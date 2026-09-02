# MapAble Innovation — Gap Analysis

**Document type:** Current state vs target innovation architecture  
**Status:** Prompt 00 baseline  
**Date:** 2026-09-02  
**Baseline reference:** [architecture-baseline.md](./architecture-baseline.md)

> **MRFF disclaimer:** Historical 2016–2021 MRFF strategy references are architecture precedents only — not 2026 funding policy or grant eligibility proof.

---

## Target architecture (prompt series)

The innovation programme targets a modular layout. **Do not introduce services merely because they appear in the target** — establish whether an equivalent capability already exists first.

```
apps/
  web/          → repo root (Next.js)
  mobile/       → apps/android, apps/independence, apps/companion
packages/
  accessibility/, accessibility-evidence/, routing/, maps/
  data-ingestion/, provenance/, consent/, analytics/, api/, research/, ui/
services/
  accessibility-events/, routing-worker/, evidence-worker
```

Infrastructure candidates: Vercel, Neon PostgreSQL, PostGIS (evaluate), PostHog, Temporal (where justified), OSM/Overture, MapLibre, Valhalla or compatible routing.

---

## REUSE / EXTEND / REFACTOR / NEW / DEFER matrix

| Target capability | Classification | Current anchor | Gap |
|-------------------|----------------|----------------|-----|
| Web application shell | **REUSE** | Repo root Next.js 15 | Docs reference wrong `apps/web/` path |
| Identity & auth | **REUSE** | NextAuth, `lib/auth/*` | — |
| Organisation tenancy | **REUSE** | `Organisation`, `OrganisationMember` | Multi-tenant v2 flagged |
| Consent service | **EXTEND** | `lib/consent/*`, `ConsentRecord` | No purpose-bound data lanes; no PostHog sanitizer |
| Co-design governance domain | **NEW** | `docs/co-design-protocol.md`, `ResearchProject` | No `CoDesignProgramme`, `CoDesignParticipant`, payment records; no `packages/research/` |
| Accessibility evidence graph v1 | **EXTEND** | `lib/access/infrastructure/`, `lib/access/intelligence-next/evidence/` | Shadow/flag-gated; freshness bugs in tests; no PostGIS |
| Provenance ledger | **EXTEND** | `lib/access/infrastructure/provenance.ts` | Single-file vocabulary; no cross-domain provenance chain |
| Data ingestion pipeline | **NEW** | Partial OSM adapters in `lib/integrations/adapters/` | No `packages/data-ingestion/`; no idempotent ingestion; no license metadata model |
| Evidence resolution service | **NEW** | Partial in intelligence-next | No `currentBestEvidence` / `conflictingObservations` API |
| Personalised accessible routing | **EXTEND** | `lib/access/navigate/`, `lib/go/route-service.ts` | Three engines; sandbox graph; no `FunctionalMobilityProfile` package |
| Real-time accessibility events | **EXTEND** | `AccessTemporaryBarrier` | No Waze-like event network; no corroboration/moderation |
| Field validation workflow | **NEW** | Partial observation APIs | No image redaction; no contributor reputation; no accessible contribution UI |
| Offline regional packs | **NEW** | `lib/accesscast/offline-store-contract.ts` | Not implemented |
| Privacy data lanes | **NEW** | Plan 08 documented only | `posthog-sanitizer.ts` missing; no lane consent middleware |
| Governed AI evidence pipeline | **EXTEND** | `lib/access/intelligence-next/` partial | No `packages/accessibility-ai/`; no proposal→validation flow |
| Enterprise accessibility API | **EXTEND** | `app/api/v1/access/route.ts` partial | No full `/api/v1/accessibility/*`; no webhooks |
| MapAble+ commercialisation | **EXTEND** | `lib/billing/*`, Stripe | Commercial truth separation not enforced in code |
| Impact measurement dashboard | **NEW** | Portfolio KPIs documented | No VAJSR dashboard; no accessible chart equivalents |
| Health research pilot | **EXTEND** | `lib/research/research-project-service.ts` | No `ResearchJourney` protocol; synthetic-only default |
| Personal access passport | **REUSE** | `AccessPassport`, trust fabric | Absorbed into Prompts 04 + 08; not on critical path as standalone |
| Accreditation OS | **DEFER** | `lib/access/accreditation*` | Parallel track; feeds graph via publication pipeline |
| Access intelligence vision (CV R&D) | **DEFER** | Exploratory docs | Superseded by governed AI pipeline (Prompt 09) |
| Digital twins | **DEFER** | `docs/innovation/epics/05-accessibility-digital-twins.md` | Post-demonstrator; evidence-backed only |
| PostGIS spatial queries | **DEFER** | Not used today | Evaluate at national graph scale vs app-side geo |
| Valhalla routing | **DEFER** | Not present | Evaluate vs extend `lib/access/navigate` |
| Temporal workflows | **DEFER** | Scaffold only | Use only where durable multi-step processing justified |

---

## Capability gaps by prompt phase

### Prompts 01–04 (foundation moat)

| Prompt | Missing capability | Severity |
|--------|-------------------|----------|
| 01 Co-design governance | First-class co-design entities, role separation, payment records, research consent ≠ service consent audit tests | High |
| 02 Evidence graph | Production graph with PostGIS indexes (if adopted), conflicting observation resolution, provenance enum completeness | High |
| 03 Provenance & ingestion | Source adapters (OSM, Overture, GTFS), license metadata, idempotent ingestion, reconciliation without silent overwrite | High |
| 04 Personalised routing | `FunctionalMobilityProfile`, hard/soft constraints, multiple route strategies, evidence explanation per segment, live graph (not sandbox) | High |

### Prompts 05–09 (operating system)

| Prompt | Missing capability | Severity |
|--------|-------------------|----------|
| 05 Real-time events | Event network, moderation, corroboration, route invalidation, anti-poisoning | Medium |
| 06 Field validation | Accessible contribution UI, image privacy pipeline, evidence state machine | Medium |
| 07 Offline mobile | Regional packs, secure local persistence, freshness UI | Medium |
| 08 Privacy lanes | Four-lane architecture, PostHog deny-list, retention policies | **Critical** (blocks 09–13) |
| 09 AI evidence | `packages/accessibility-ai/`, proposal queue, no direct write to truth tables | Medium |

### Prompts 10–13 (translation)

| Prompt | Missing capability | Severity |
|--------|-------------------|----------|
| 10 Health research | `ResearchJourney` protocol, VAJSR metrics, de-identified exports | Medium |
| 11 Enterprise API | Full v1 accessibility surface, tenant isolation, webhooks | Medium |
| 12 MapAble+ | Commercial truth separation enforcement, audit records | Medium |
| 13 Impact dashboard | Multi-domain metrics, accessible chart alternatives | Medium |

### Prompts 14–15 (release)

| Prompt | Missing capability | Severity |
|--------|-------------------|----------|
| 14 Demonstrator | Pilot scorecard implementation, ops runbooks, production gate workflow | Medium |
| 15 Release gate | Independent review artifact | Process |

---

## Schema implications (cross-cutting)

| Area | Current | Target change |
|------|---------|---------------|
| Evidence graph | `AccessObservationRecord` | Add edge/node model, provenance states, freshness indexes |
| Co-design | `ResearchProject` only | `CoDesignProgramme`, `CoDesignParticipant`, `ResearchConsent`, `ContributionPayment` |
| Events | `AccessTemporaryBarrier` | Generalise to accessibility event network with verification state |
| Privacy | `ConsentRecord` | Add `dataLane`, purpose-bound scopes, retention metadata |
| Research | `ResearchProject` | `ResearchJourney`, `ResearchJourneyEvent` |
| Commercial | Billing models exist | `CommercialDataAccessAudit` for enterprise API metering |

All changes must use reversible migrations or documented forward-only rollback procedures.

---

## API implications

| Gap | Current | Target |
|-----|---------|--------|
| Internal typed services before public API | Mixed — some logic in route handlers | Extract to `packages/api/` or `lib/` service layers |
| Versioned accessibility API | Partial `app/api/v1/access/` | `/api/v1/accessibility/*`, `/api/v1/routes/*`, `/api/v1/barriers/*` |
| Research APIs | Minimal surface | `app/api/research/`, `app/research/` UI |
| Webhook integration | None for partners | Signed partner events (lift outage → route recalculation) |

---

## Mobile implications

| Gap | Current | Target |
|-----|---------|--------|
| Go routing wired to native | Android scaffold; flags default off | End-to-end route planning in travel feature |
| Offline packs | Contract only (`accesscast-offline`) | Downloadable regional packs with checksum validation |
| Secure token storage | Partial | No auth tokens in AsyncStorage |
| Accessibility AT support | Partial | Screen reader, Dynamic Type, switch access, reduced motion tested |

---

## Privacy implications

| Gap | Risk |
|-----|------|
| No data lane separation | Research/mobility/commercial datasets may commingle |
| PostHog sends LLM events only today | Future product analytics may leak precise routes without sanitizer |
| No automated participant deletion API | GDPR/Privacy Act compliance gap |
| Co-design protocol exists but no technical enforcement | Tokenistic participation risk without domain model |

Prompt 08 is a **hard gate** before Prompts 09–13.

---

## Migration risks

| Risk | Mitigation |
|------|------------|
| 15k-line monolithic schema | Small, reviewable migrations per prompt; consider domain boundaries long-term |
| CI uses `prisma db push` not migrate-from-zero | Document production runbook separately from CI |
| Dual place models (`AccessPlace` vs `AccessiblePlace`) | Consolidation plan in Prompt 02 |
| Sandbox → live graph migration | Feature flags; parallel run with comparison tests |

---

## Deployment risks

| Risk | Mitigation |
|------|------------|
| Vercel build OOM | Existing mitigations in `next.config.ts`; monitor on large schema changes |
| Neon connection pooling | Use `DIRECT_URL` for migrations only |
| Feature flag sprawl | Centralise in `lib/config/*`; document in each plan |
| False-safe routing defects | Block demonstrator deploy (Prompt 14 gate) |

---

## Testing requirements (programme-wide)

| Suite | Purpose | Status |
|-------|---------|--------|
| Vitest unit/integration | Domain logic | 2142 passing; 3 pre-existing failures |
| False-safe accessibility | unknown ≠ inaccessible | Partial — needs expansion in Prompts 02, 04 |
| Privacy lane regression | Commercial cannot access mobility fields | Planned Prompt 08 |
| Playwright + axe | WCAG automated checks | CI exists; manual matrix NOT_RUN |
| Cross-tenant API isolation | Enterprise API | Planned Prompt 11 |
| Offline resilience | Network loss, corrupt packs | Planned Prompt 07 |

---

## Deferred architectural decisions

| Decision | Options | Defer to |
|----------|---------|----------|
| PostGIS adoption | Continue app-side geo vs enable PostGIS on Neon | Prompt 02 evaluation |
| Pedestrian routing engine | Extend `lib/access/navigate` vs Valhalla | Prompt 04 |
| Temporal usage | DB mirror vs Temporal for events/ingestion | Prompts 05, 03 (only if justified) |
| Package extraction | Keep `lib/` vs extract `packages/*` | Incremental per prompt |

---

## Related documents

- [Architecture baseline](./architecture-baseline.md)
- [Implementation roadmap](./implementation-roadmap.md)
- [Research translation model](./research-translation-model.md)
- [Superpowers plans](../superpowers/plans/README.md)
