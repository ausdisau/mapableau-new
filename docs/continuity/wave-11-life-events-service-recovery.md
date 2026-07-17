# Wave 11 — Life Events & Service Recovery (Phase 36 index)

Phase 36 documentation for Wave 11 continuity and service recovery. Implementation detail, architecture, and runbooks live in the companion `wave-11-*.md` pack; this index links the Phase 36 topic files.

**Start here:** [`wave-11-architecture-and-risk-plan.md`](./wave-11-architecture-and-risk-plan.md) · [`wave-11-integrity-baseline.md`](./wave-11-integrity-baseline.md) · [`wave-11-operations-runbook.md`](./wave-11-operations-runbook.md)

## Phase 36 documentation set

| File | Topic |
|------|-------|
| [life-event-domain.md](./life-event-domain.md) | Life-event taxonomy and domain boundaries |
| [disruption-signals.md](./disruption-signals.md) | Signal types, validation, freshness |
| [participant-continuity-profile.md](./participant-continuity-profile.md) | Participant goals, essential support, preferences |
| [standing-recovery-instructions.md](./standing-recovery-instructions.md) | Narrow, revocable pre-authorisations |
| [service-dependency-graph.md](./service-dependency-graph.md) | Continuity graph nodes and edges |
| [criticality.md](./criticality.md) | Participant-defined criticality (not ranking) |
| [disruption-correlation.md](./disruption-correlation.md) | Multi-signal correlation |
| [impact-assessment.md](./impact-assessment.md) | Downstream impact computation |
| [continuity-cases.md](./continuity-cases.md) | Case lifecycle and states |
| [recovery-options.md](./recovery-options.md) | Deterministic option generation |
| [recovery-plans.md](./recovery-plans.md) | Draft, simulate, approve plans |
| [recovery-execution.md](./recovery-execution.md) | Approved-step execution |
| [care-continuity.md](./care-continuity.md) | Care adapter and shift disruption |
| [transport-continuity.md](./transport-continuity.md) | Transport adapter; no auto-cancel |
| [appointment-continuity.md](./appointment-continuity.md) | Non-clinical appointments only |
| [employment-continuity.md](./employment-continuity.md) | Employment disruption |
| [housing-continuity.md](./housing-continuity.md) | Housing disruption |
| [provider-failure.md](./provider-failure.md) | Provider substitution paths |
| [financial-continuity.md](./financial-continuity.md) | Explain-and-hand-off only |
| [civic-disruption-feeds.md](./civic-disruption-feeds.md) | External civic feed registry |
| [participant-communications.md](./participant-communications.md) | Notifications and consent |
| [emergency-boundary.md](./emergency-boundary.md) | No emergency automation |
| [capacity-reservations.md](./capacity-reservations.md) | Provisional holds (not confirmed) |
| [recovery-monitoring.md](./recovery-monitoring.md) | Post-approval monitoring |
| [continuity-outcomes.md](./continuity-outcomes.md) | Resolution and outcome recording |
| [continuity-reliability.md](./continuity-reliability.md) | Integrity, tests, audits |
| [aura-recovery-specialist.md](./aura-recovery-specialist.md) | AURA `service_recovery` specialist |
| [orchestration-remediation.md](./orchestration-remediation.md) | Orchestrator H-remediation |
| [wave-11-migration-runbook.md](./wave-11-migration-runbook.md) | Migration and enablement |

## Wave 11 pack (implementation reference)

- [wave-11-architecture-and-risk-plan.md](./wave-11-architecture-and-risk-plan.md)
- [wave-11-case-lifecycle.md](./wave-11-case-lifecycle.md)
- [wave-11-continuity-graph.md](./wave-11-continuity-graph.md)
- [wave-11-domain-adapters.md](./wave-11-domain-adapters.md)
- [wave-11-signal-taxonomy.md](./wave-11-signal-taxonomy.md)
- [wave-11-impact-and-detection.md](./wave-11-impact-and-detection.md)
- [wave-11-recovery-plans.md](./wave-11-recovery-plans.md)
- [wave-11-recovery-execution.md](./wave-11-recovery-execution.md)
- [wave-11-standing-instructions.md](./wave-11-standing-instructions.md)
- [wave-11-essential-support-boundary.md](./wave-11-essential-support-boundary.md)
- [wave-11-civic-feed-registry.md](./wave-11-civic-feed-registry.md)
- [wave-11-communications.md](./wave-11-communications.md)
- [wave-11-emergency-boundary.md](./wave-11-emergency-boundary.md)
- [wave-11-not-emergency.md](./wave-11-not-emergency.md)
- [wave-11-capacity-reservations.md](./wave-11-capacity-reservations.md)
- [wave-11-outcomes.md](./wave-11-outcomes.md)
- [wave-11-aura-service-recovery-specialist.md](./wave-11-aura-service-recovery-specialist.md)
- [wave-11-operations-runbook.md](./wave-11-operations-runbook.md)
- [wave-11-test-plan.md](./wave-11-test-plan.md)
- [wave-11-integrity-baseline.md](./wave-11-integrity-baseline.md)

## Disclaimers

- Continuity preserves **participant goals**, not merely bookings.
- Linked-service cancellation does **not** imply automatic cancellation.
- Disruption signals may be wrong or stale.
- External feed data remains **source attributed**.
- Participant criticality is **not** a ranking score.
- Essential support is **not** inferred from diagnosis.
- Recovery options are **participant controlled**.
- Standing instructions are **limited and revocable**.
- Clinical, legal, and emergency decisions remain **human**.
- Estimated costs are **not** available budget.
- Generated options are **not** confirmed capacity.
- Booking acceptance is **not** recovery completion.
- Participants can **reject all** options.
- No response is **not** consent.
- AURA **cannot** call emergency services automatically.
- No AI may create standing authority, choose a replacement worker without permission, approve additional spending, submit claims, change funding routes, determine legal emergencies, or close serious incidents.
