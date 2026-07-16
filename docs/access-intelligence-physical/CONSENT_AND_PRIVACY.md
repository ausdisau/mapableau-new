# Consent and privacy — Physical Systems

Extends Core [PRIVACY_AND_CONSENT.md](../access-intelligence/PRIVACY_AND_CONSENT.md) and [TRUST_KERNEL.md](../access-intelligence/TRUST_KERNEL.md) for physical observation and action contexts.

## Principles

1. **Functional requirements only** — Access Passports never store or require a diagnosis; Concierge must not infer requirements from medical labels.
2. **Field-level sharing** — Venue Ops / verification / action justification receive only approved field keys (`shareWithVenue` / Trust Kernel `fieldsPermitted`).
3. **Purpose-bound** — Same fields cannot be reused for a new purpose without new consent/approval.
4. **Minimisation into tools** — Agent tool payloads omit userId and non-essential PII; action records store element ids and effect summaries, not passport bodies.
5. **No silent external writes** — Messaging, passport share, and physical dispatch require explicit approval surfaces.

## Physical-specific rules

| Scenario | Rule |
|----------|------|
| Scout photo | May create observation with source type; must not attach health notes; faces should be avoided or blurred in production guidance |
| Responsive Venue alert | Share visit-relevant constraints only (e.g. “step-free required”), not full passport |
| Action justification | Ops see capability need (“door width ≥ X”) when that field was approved — not diagnosis |
| Simulator | Synthetic passports only (≥16 coverage set from Living Twin); no production PII in sims |
| Research export | De-identify via Pilot console patterns; physical action logs strip personal fields |

## Sensitive actions (approval)

Core: `requestVenueVerification`, `submitBarrierReport`, `shareAccessPassport`, `shareVisitPlan`.

Physical additions: `proposePhysicalAction` (to `proposed`), `approvePhysicalDispatch` (supervised), `shareVisitConstraintsWithVenue`.

Cancelled approval ⇒ no Gateway queueing.

## Logging

Do **not** log: passport JSON, health notes, raw chat transcripts, full addresses, photo binaries by default.

Do log: action id, place/element ids, check codes, mode, actor role, outcome.

## Retention

Follow venue/pilot agreements. Demo in-memory data is ephemeral. Prisma physical tables should define TTL/archive for observations containing media references.

## Related

[OBSERVABILITY.md](./OBSERVABILITY.md) · Core [PRIVACY_AND_CONSENT.md](../access-intelligence/PRIVACY_AND_CONSENT.md) · [RIGHTS_CONSENT_AND_AUDIT.md](../access-intelligence/RIGHTS_CONSENT_AND_AUDIT.md)
