# Hazard log — Physical Systems

Living hazard register for demo → supervised pilot. Residual risk accepts **no live hardware** until checklist + roadmap gates clear. Update when modes or adapters change.

## Field definitions

| Field | Meaning |
|-------|---------|
| ID | Stable hazard id |
| Title | Short name |
| Description | What can go wrong |
| Severity | 1–5 (5 = life-safety / severe harm) |
| Likelihood | 1–5 in current architecture |
| Risk | Severity × Likelihood |
| Causes | Contributing factors |
| Mitigations | Controls in product/process |
| Residual | Risk after mitigations (L/M/H) |
| Modes | Where hazard is relevant |
| Owner | Role accountable |
| Status | open / mitigated / accepted / closed |

## Hazards (≥12)

| ID | Title | Description | Sev | Like | Risk | Causes | Mitigations | Residual | Modes | Owner | Status |
|----|-------|-------------|-----|------|------|--------|-------------|----------|-------|-------|--------|
| H01 | Unauthorised door unlock | Remote unlock without valid visit/context | 5 | 2 | 10 | Injection, approval bypass | Agent cannot execute; kernel; approval; time bounds | M | supervised, live | Safety lead | mitigated |
| H02 | Lift called to wrong floor under outage | User stranded or directed into outage | 4 | 3 | 12 | Stale incident, twin drift | Live incident on twin; freshness deny; route-engine hard reject | M | all | Twin owner | mitigated |
| H03 | Demo mistaken for live building | Ops act on fictional measurements | 3 | 4 | 12 | Weak labelling | Fictional banners; accreditation `synthetic-demo`; mock flags | L | demo | Product | mitigated |
| H04 | Double dispatch of unlock | Two unlocks / extended hold-open | 4 | 2 | 8 | Retries without idempotency | Idempotency keys; state machine | L | supervised, live | Gateway owner | mitigated |
| H05 | Alarm override via agent | Fire/life-safety disabled | 5 | 1 | 5 | Missing prohibit list | Immutable prohibited registry | L | all | Safety lead | mitigated |
| H06 | Passport oversharing to venue | Excess disability detail disclosed | 4 | 3 | 12 | Broad share defaults | Field-level consent; Trust Kernel; approval card | M | all | Privacy lead | mitigated |
| H07 | False exact width from photo | Bad fit decision / unsafe advice | 3 | 4 | 12 | Uncalibrated Scout photo | No exact mm without calibration; ai_inference labelled | M | demo, scout | Evidence lead | mitigated |
| H08 | Supervised approval under fatigue | Rubber-stamp dangerous action | 4 | 3 | 12 | High volume, poor UX | Rate limits; clear effect summary; dual control high-risk | M | supervised | Venue ops | open |
| H09 | Shadow action assumed executed | Staff believe dry-run ran on BMS | 3 | 3 | 9 | Ambiguous UI | Shadow badges; `executed: false` in logs | L | shadow | Product | mitigated |
| H10 | Live flag enabled prematurely | Actuation before readiness | 5 | 2 | 10 | Config error | Live disabled by default; separate env; checklist | M | live | Eng manager | mitigated |
| H11 | SSRF to internal BMS | Attacker reaches building network | 5 | 2 | 10 | Open URL config | Allowlists; env-only URLs; no user adapter URL | M | supervised, live | Security | mitigated |
| H12 | Evac route confusion | Accessible visit route used as fire exit advice | 5 | 2 | 10 | Copy ambiguity | Explicit non-evac disclaimer (Core safety governance) | M | all | Product | mitigated |
| H13 | Sensory overload from live regions | Chat/status spam harms users | 3 | 3 | 9 | Aggressive aria-live | Live-region restraint ([ACCESSIBILITY.md](./ACCESSIBILITY.md)) | L | all | A11y lead | mitigated |
| H14 | Adapter timeout mid-unlock | Uncertain door state | 4 | 3 | 12 | Network loss | `timed_out` state; ops playbook; fail-closed retries | M | supervised, live | Gateway owner | open |

## Review cadence

- Before any mode promotion (demo → shadow → supervised → live).
- After every incident (link playbook id).
- Quarterly in supervised pilot.

## Related

[THREAT_MODEL.md](./THREAT_MODEL.md) · [SAFETY_CASE.md](./SAFETY_CASE.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
