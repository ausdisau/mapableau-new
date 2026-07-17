# AURA — Branch and Domain Reconciliation

**Inspected:** 2026-07-16  
**Working branch:** `cursor/mapable-aura-wave1-6ea8` (from `cursor/ai-canonical-place-binding-6ea8`)  
**Base lineage:** post-#263 `main` (`fdd22bb3`) + Access Intelligence Wave 0–5 (`ca55afdc`)

## Current branch and base

| Fact             | Value                                              |
| ---------------- | -------------------------------------------------- |
| Remote           | `ausdisau/mapableau-new`                           |
| Parent AI branch | `cursor/ai-canonical-place-binding-6ea8` (PR #266) |
| `main` HEAD      | Merge PR #263 competitor upgrade                   |
| AURA branch      | `cursor/mapable-aura-wave1-6ea8`                   |

## Existing Access Intelligence architecture (reused)

Present on this lineage via PR #266 port:

- **Canonical place:** `AccessPlace` binding (`lib/access-intelligence/place-binding.ts`)
- **Passport:** `AiAccessPassport` / domain `AccessPassport` (`schemas.ts`)
- **Engines (authoritative):** fit, confidence, route, route-cost, coverage, counterfactual, decision
- **Living Twin:** Harbour Civic Centre demo (`living/harbour-civic.ts`)
- **Agent:** `createAccessIntelligenceAgent` → AI SDK 6 `ToolLoopAgent`
- **Consent/audit composition:** `consent-durable.ts`, `audit.ts` → `ConsentRecord` / `AuditEvent`
- **Expansion Systems 1–10:** reliability, journey, guides, mapper, events, widget, regional, missions (`CoordinationMission`), employment, regression

## Existing CareOS architecture

| Component              | On `main` / AI branch? | Location when present                               |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| `CareOSMission`        | **No**                 | CareOS tips e.g. `agent/careos-platform-completion` |
| `lib/careos/`          | **No**                 | Same                                                |
| `intelligence/` fabric | **No**                 | CareOS / mapable-intelligence-fabric                |
| Session consent        | **No**                 | `intelligence/consent/session-consent.ts` on fabric |
| CloudEvent outbox      | **No**                 | CareOS tips                                         |

**Decision:** Introduce the **canonical `CareOSMission`** table (and minimal event spine) on this branch so AURA does **not** invent `AuraMission`. Full CareOS writers (`canonical-mission-service`) consolidate when CareOS PRs merge; AURA uses a thin mission service that matches the CareOS field contract.

## Existing CSI kernel

| Component                                       | On this branch?                                |
| ----------------------------------------------- | ---------------------------------------------- |
| CSI AGI kernel (`lib/care-intelligence/kernel`) | **No** — `feat/care-support-intelligence` only |

**Decision:** AURA does **not** port the CSI research kernel. Bounded specialists are deterministic tool bundles. CSI may later advise cognition; it must not gain write authority.

## Canonical mission model

**Chosen:** `CareOSMission` (`careos_missions`) as mission source of truth.  
**AURA state:** `AuraMissionExtension` child record (passport, authority ceiling, stop, proof-plan version).  
**Not chosen as mission SoT:** `CoordinationMission` (Access Intelligence SC console) — may link later; must not fork mission identity.

## Canonical consent model

- **Durable:** `ConsentRecord` + `lib/consent/*`
- **Request-scoped (AURA):** explicit module selection stored on the mission (`modulesJson` + lease issuance). Does **not** silently create durable consent.
- **AccessibilityProfile:** opt-in per mission; default **off**.

## Canonical audit and outbox

- **Audit:** `AuditEvent` via `lib/audit/audit-event-service.ts`; AURA witness adds `correlationId` metadata.
- **Outbox:** not on this branch. Wave 1 records witness events in-process + `AuditEvent` when Prisma enabled. CloudEvent outbox deferred to CareOS consolidation.

## AI SDK tools and provider configuration

- AI SDK 6 (`ai` ^6), `@ai-sdk/google`, gateway pattern from Access Intelligence
- `ToolLoopAgent`, `Output.object`, `stepCountIs`
- AURA: `createAuraAgent(ctx)` with leased tools only; **no Prisma in tool closures**

## Overlapping models and services

| Concern    | Retain                                     | Consolidate                    | Do not create                         |
| ---------- | ------------------------------------------ | ------------------------------ | ------------------------------------- |
| Place      | `AccessPlace`                              | AI twin FKs already bound      | Second place table                    |
| Passport   | `AiAccessPassport` / domain AccessPassport | Rename to AccessPassport later | Parallel passport                     |
| Mission    | `CareOSMission` (new on this branch)       | Later merge CareOS writers     | `AuraMission`                         |
| SC mission | `CoordinationMission`                      | Link by id optional            | Dual SC universe                      |
| Consent    | `ConsentRecord`                            | AI durable composition         | Second consent DB                     |
| Audit      | `AuditEvent`                               | AI audit mirror → correlate    | Sole reliance on `AiAccessAuditEvent` |

## Files to retain

- `lib/access-intelligence/**` engines, harbour twin, tools patterns
- `lib/consent/**`, `lib/audit/**`
- `app/ask/**` as primary entry (extend, do not replace)
- `components/copilot/**` for existing Co-Pilot path

## Files to consolidate

- Mission creation → CareOSMission service (AURA + future CareOS)
- Request-scoped module consent → mission `modulesJson` + leases
- Access specialist tools → wrap existing Access Intelligence engines without Prisma

## Migrations required

1. `CareOSMission`, `CareOSMissionEvent` (minimal CareOS spine)
2. `AuraMissionExtension`, `AuraCapabilityLease`, `AuraPlanArtifact`, `AuraPlanEvidenceLink`, `AuraPlanVerification`
3. Wave 3–5 tables staged but unused while flags off: `AuraActionProposal`, `AuraMemoryCard`, `AuraOutcomeRecord`

## Implementation waves

See `IMPLEMENTATION_PLAN.md`. **Wave 1 is mandatory** on this PR.

## Risks

| Risk                                    | Mitigation                                                |
| --------------------------------------- | --------------------------------------------------------- |
| CareOSMission schema drift vs CareOS PR | Match CareOS tip field names; document reconcile on merge |
| Dual mission with CoordinationMission   | Explicit SoT = CareOSMission; AI SC links later           |
| Model over-authority                    | Hard L2 ceiling; leases; verifier                         |
| False reassurance from Harbour demo     | Label synthetic; unknowns preserved                       |

## Rollback

1. Set `MAPABLE_AURA_ENABLED=false` (default).
2. Ignore new Prisma tables (expand-contract).
3. `/ask` falls back to existing CopilotPanel only.
4. No physical actuation or write execution flags to disable further.
