# Participant Agency Memory + Preference Graph

Prompt 05 — participant-controlled long-term memory for explicitly chosen
preferences, exclusions, communication methods, goals, and prior decisions.

**Not** hidden LLM memory. **Not** psychological profiling. **Not** behavioural scoring.

## Architecture

```
Participant
    │
    ▼
Agency Memory Controls (inspect / edit / revoke / export / pause / disable AI)
    │
    ▼
Preference / Decision Graph (explicit edges only)
    │
    ▼
Context Fabric (scoped retrieval — never full graph injection)
    │
    ▼
Mission Runtime personalisation (confirmed memory only)
```

## Canonical ownership

| Concern | Owner | Notes |
|---------|-------|-------|
| Long-term Agency Memory / preference graph | `lib/ai/platform/agency-memory/` | Prompt 05 SoT for nerve-centre personalisation |
| CareOS operational preference keys | `CareOSParticipantPreference` + `intelligence/preferences/` | Action Kernel dual-writes via Agency Memory bridge |
| Access / digital / sensory prefs | `AccessibilityProfile` | Operational passport — not replaced |
| Goals in participant words | `LifeIntent` | `mission_preference` / `PURSUES` may reference |
| Navigator pilot memory | `lib/ai/navigator/memory/` | Separate product surface — not merged |
| Context Fabric scoped retrieval | `lib/ai/platform/context-fabric/` | Minimum relevant memory only |
| Consent / audit | existing consent + `createAuditEvent` | No bundled consent |

## CORE RULE

Persist as participant memory **only** when:

1. the participant explicitly supplied it, **or**
2. the participant explicitly confirmed a proposed memory item.

Model inference may create a **proposed** item at most. It can never auto-confirm.

## Memory categories (governed)

`communication`, `access`, `care`, `transport`, `jobs`, `provider_preference`,
`provider_exclusion`, `privacy`, `disclosure`, `interaction`, `mission_preference`

### Prohibited (never create)

`compliance`, `motivation`, `personality`, `loneliness`, `capacity`, `intelligence`,
`risk_tolerance`, `emotional_instability`, `credibility`, `deservingness`, and related
inferred trait labels.

## States

`proposed` → `confirmed` → (`superseded` | `revoked` | `expired`)

Only **confirmed** memory affects mission personalisation.

## Preference graph edges (explicit only)

`HAS_PREFERENCE`, `EXCLUDES`, `PREFERS`, `CHOOSES`, `PURSUES`

Correlation-based inference is forbidden (`inferEdgesFromCorrelation` throws).

## Feature flags (fail-closed)

```
MAPABLE_AGENCY_MEMORY_ENABLED=false
MAPABLE_AGENCY_MEMORY_MODEL_CONTEXT_ENABLED=false
```

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ai/agency-memory` | Inspect snapshot + presentation |
| POST | `/api/ai/agency-memory` | Propose / explicitly supply memory |
| POST | `/api/ai/agency-memory/confirm` | Participant confirmation |
| POST | `/api/ai/agency-memory/revoke` | Revoke future use |
| POST | `/api/ai/agency-memory/delete` | Delete (audit versions retained) |
| GET | `/api/ai/agency-memory/export` | Structured + human-readable export |
| POST | `/api/ai/agency-memory/controls` | Pause personalisation / disable AI |

No public arbitrary write of inferred traits.

## My MapAble UI

`/my/control/preferences` — My Preferences, What MapAble Remembers, Why, Where Used,
Who Can See. Linked from Privacy & control. WCAG 2.2 AA targets: min 44px targets,
focus rings, plain language, semantic headings.

## Delegates

Family / support opinion is stored as `delegate_proposed` with
`requiresParticipantConfirmation: true`. It is **not** a participant preference until
confirmed. Delegates cannot exceed declared authority domains.

## Persistence

In-memory store matching Prompts 01–04. If durable Prisma persistence is required,
stop and produce **Prompt 05A** persistence spec — do not weaken deletability or
inspectability.

## Action Kernel wiring

`save_participant_preference` upserts CareOS preference **and**, when Agency Memory is
enabled, creates a confirmed Agency Memory item (approval binding already required).

## Privacy

- Tenant-scoped keys — cross-tenant reads return empty / forbidden
- Purpose-bound categories (`jobs`, `disclosure`) stay out of broad retrieval
- Pause personalisation / disable AI still allow manual preference management
- Export covers confirmed memory only

## Authority changes

**NONE.** No new autonomous write authority. No production flags enabled.
