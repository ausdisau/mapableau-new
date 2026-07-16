# SLOs — supervised pilot

Apply when `ACCESS_INTELLIGENCE_PHYSICAL_MODE=supervised` for a named venue pilot. Demo/shadow use these as stretch targets, not contractual.

## Service level objectives

| SLO | Target | Window | Notes |
|-----|--------|--------|-------|
| Safety Kernel availability | ≥ 99.9% successful evaluations ( incl. denies ) | 30 d | Failures count as deny + error budget burn |
| Dispatch success (approved actions) | ≥ 99% `succeeded` among non-cancelled | 30 d | Excludes mock-only drills if tagged |
| Dispatch latency P95 (queue → terminal) | ≤ 15 s for door/lift mocks; ≤ 60 s for real adapters | 7 d | Per adapter class |
| Approval wait P95 (pending → approved/cancelled) | ≤ 5 min during staffed hours | 7 d | Outside hours excluded or separate bucket |
| Idempotent replay correctness | 100% duplicate keys no second execute | 30 d | Any miss = severity-1 incident |
| Audit completeness | 100% transitions have event row | 30 d |
| Observation freshness for dispatch | 100% denials when required telemetry stale | 30 d | Fail-closed proof |
| False live enablement | 0 unapproved live flag changes | 30 d |
| Passport log violations | 0 detected passport bodies in logs/metrics | 30 d |
| Concierge route text present | 100% successful routes include step instructions | 30 d |
| Accessibility regression | 0 Sev-1 WCAG blockers on physical routes | per release |
| Mean time to disable dispatch (kill switch) | ≤ 5 min | drill quarterly | See incident IR-01 |

## Error budget policy

- Burn > 50% of 30 d budget on dispatch success or kernel availability ⇒ freeze live roadmap work; stay supervised or drop to shadow.
- Any idempotency miss or passport log leak ⇒ immediate dispatch disable + IR playbook.

## Reporting

Pilot & Evaluation Console patterns (de-identified) plus physical metrics dashboards. Do not include personal fit scores tied to named individuals in external reports.

## Related

[SAFETY_CASE.md](./SAFETY_CASE.md) · [OBSERVABILITY.md](./OBSERVABILITY.md) · [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
