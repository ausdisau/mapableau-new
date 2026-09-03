# MapAble Unified Care & Support Guardian

**Status:** Phase 0–2 implemented (contracts + deterministic privacy/purpose router).  
**Production:** **Not production ready.** All `MAPABLE_GUARDIAN_*` flags default **false**.  
**Assurance:** `DOCUMENTED_INTENT` / `DESIGNED_CONTROL` / partial `IMPLEMENTED_CONTROL` — not independently assured.

## What this is

The Unified Care & Support Guardian is a **deterministic MapAble Core control plane**. It is:

- **Not** a conversational agent
- **Not** a second CareOS
- **Not** another system of record
- **Not** a free-roaming AI moderator

It classifies sensitivity, validates purpose / authority / consent, decides which inference environments may receive data, normalises model outputs into non-authoritative signals, applies deterministic policy, and routes safeguarding / complaints / incidents into **canonical** Core services.

### Fundamental rule

> **MODELS DETECT, CLASSIFY, REDACT, EXPLAIN AND SIGNAL.**  
> **MAPABLE CORE POLICY DECIDES AND ENFORCES.**

Models must never become: system of record, authorisation authority, statutory decision-maker, complaint adjudicator, incident-reportability assessor, capacity assessor, abuse substantiation system, or restrictive-practice decision-maker.

## Naming disambiguation

| Name | Location | Status |
|------|----------|--------|
| **Unified Care & Support Guardian** | `lib/ai/platform/guardian/` | This control plane |
| Deferred AURA Agent OS “Guardian” | `lib/aura/` (with Pocket / Memory) | Deferred product concept — **unrelated** |
| AURA Risk Harness | `lib/aura-harness/` | In-process risk harness — **not** this Guardian |

Do not conflate these.

## Placement in the control plane

```
MAPABLE CORE API
       │
       ▼
IDENTITY / TENANT GATE
       │
       ▼
PARTICIPANT AUTHORITY GATE
       │
       ▼
PURPOSE + CONSENT
       │
       ▼
PRIVACY PROCESSING DECISION
       │
       ▼
DATA CLASSIFICATION (canonical DataClass)
       │
       ▼
ProcessingSensitivity (derived)
       │
       ▼
INFERENCE ROUTING POLICY
  DEVICE_EDGE | MAPABLE_PRIVATE | APPROVED_EXTERNAL
       │
       ▼
GuardianModelSignal[]  (provenance = model_inference)
       │
       ▼
DETERMINISTIC GUARDIAN POLICY
       │
       ├── Participant confirmation
       ├── Human review (safeguarding gate)
       ├── Complaint / incident path (canonical SoRs)
       │
       ▼
GOVERNED ACTION KERNEL
       │
       ▼
DOMAIN SERVICE / AUDIT
```

The Guardian sits **before** consequential model-assisted action proposals reach the Action Kernel. The Action Kernel remains the execution boundary.

## Systems of record (reuse — do not duplicate)

| Concern | Owner |
|---------|-------|
| Data classes / provenance | `lib/ai/platform/types/classification.ts` |
| Capabilities / models | `lib/ai/platform/capabilities/` |
| Kill switches | `lib/ai/platform/policies/kill-switches.ts` |
| Safeguarding human boundary | `lib/ai/platform/policies/safeguarding-gate.ts` |
| Action execution | `lib/ai/platform/actions/` |
| Edge placement ladder | `lib/ai/platform/edge/` (mapped to zones; not replaced) |
| Consent / authority / audit | `lib/consent/`, `lib/authority/`, `lib/audit/` |
| Incidents | `lib/incidents/incident-service.ts` (`possibleReportableIncident` — never AI `isReportable`) |
| Complaints | Engagement dual-write (`Complaint` + `EngagementSubmission`) |
| Worker readiness | `lib/care/worker-eligibility.ts`, `lib/workforce/readiness/evaluate.ts` |
| Algorithm register | `lib/compliance/algorithm-register/` |
| Prohibited uses | `lib/careos/policy/unified-prohibited-uses.ts` |

Legacy Replit chat guardrails (`server/chat-guardrails.ts`, Drizzle safeguarding tables) are **compatibility-only / not production SoR**. See [guardian/CHAT_GUARDRAILS_CONVERGENCE.md](./guardian/CHAT_GUARDRAILS_CONVERGENCE.md).

## Implementation layout

```
lib/ai/platform/guardian/
  contracts.ts
  processing-sensitivity.ts
  purpose-policy.ts
  privacy-gate.ts
  processing-router.ts
  guardian-policy.ts
  guardian-service.ts
  reason-codes.ts
  audit.ts
  index.ts
  providers/
    contracts.ts
    registry.ts
    policy.ts
```

Config: `lib/config/guardian.ts`  
API (flag-gated): `POST /api/ai/guardian/evaluate`  
Tests: `tests/ai-platform/guardian/`

## Feature flags (fail closed)

| Flag | Default |
|------|---------|
| `MAPABLE_GUARDIAN_ENABLED` | false |
| `MAPABLE_GUARDIAN_MODEL_INFERENCE_ENABLED` | false |
| `MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED` | false |
| `MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED` | false |
| `MAPABLE_GUARDIAN_SAFEGUARDING_SIGNALS_ENABLED` | false |
| `MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED` | false |

When Guardian is disabled, AI-assisted Guardian functionality degrades; manual complaint / incident flows remain available.

## Processing sensitivity (derived)

Canonical `DataClass` is never replaced. Guardian derives `ProcessingSensitivity`:

| DataClass | ProcessingSensitivity |
|-----------|----------------------|
| public | D0_PUBLIC |
| operational | D1_INTERNAL |
| participant_pii | D2_PERSONAL |
| health_sensitive, safeguarding | D3_SENSITIVE |
| financial, credentials_secrets, legal_privileged | D4_RESTRICTED |

Unknown / unclassified → **more restrictive**. Never auto-downgrade.

## Processing zones

1. **DEVICE_EDGE** — local pre-detection / redaction where possible  
2. **MAPABLE_PRIVATE** — MapAble-controlled inference (default for D2/D3 needing models)  
3. **APPROVED_EXTERNAL** — external processor only after explicit policy

**Failover:** private unavailable → deterministic / human / retry — **never** silent cloud fallthrough.

## Hierarchy

```
PARTICIPANT RIGHTS
      ↓
PURPOSE + AUTHORITY + CONSENT
      ↓
PRIVACY + SAFEGUARDING POLICY
      ↓
MODELS AS SUBORDINATE SENSORS
      ↓
HUMAN REVIEW WHERE REQUIRED
      ↓
PARTICIPANT DECISION
      ↓
DETERMINISTIC EXECUTION
      ↓
AUDIT + CHALLENGE + REMEDY
```

## Related docs

- [PROCESSING_AND_PRIVACY.md](./guardian/PROCESSING_AND_PRIVACY.md)
- [SAFEGUARDING_BOUNDARY.md](./guardian/SAFEGUARDING_BOUNDARY.md)
- [CHAT_GUARDRAILS_CONVERGENCE.md](./guardian/CHAT_GUARDRAILS_CONVERGENCE.md)
- [GOVERNED_ACTION_KERNEL.md](./GOVERNED_ACTION_KERNEL.md)
- [AGENTIC_NERVE_CENTRE.md](./AGENTIC_NERVE_CENTRE.md)
- [docs/governance/](../governance/) — assurance templates (`DOCUMENTED_INTENT`)

## Release gate language

Do **not** label this work NDIS compliant, APP compliant, ISO certified, or safe for production from implementation alone. Use: *Implemented control*, *Tested control*, *Requires human assurance*, *Requires independent assurance*.
