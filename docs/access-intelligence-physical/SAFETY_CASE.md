# Safety case — before live mode

Argument: **Physical Systems may enable live dispatch only after demo, shadow, and supervised modes have produced evidence that Safety Kernel, Action Gateway, and adapters behave fail-closed under realistic misuse and failure.**

Live remains **disabled by default** (`ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED` unset/false).

## Claims and evidence

### C1 — Agent cannot actuate

| Evidence | Source |
|----------|--------|
| Agent tool modules do not import adapters | Architecture + contract tests |
| Propose tools create `draft`/`proposed` only | State machine tests |
| Prompt-injection suite cannot reach `dispatching` | Threat T1 tests |

### C2 — Safety Kernel fails closed

| Evidence | Source |
|----------|--------|
| Unknown mode / stale telemetry / missing binding ⇒ deny | Unit tests |
| Prohibited registry immutable | Unit tests |
| Kernel errors ⇒ deny | Unit tests |

### C3 — Demo proves UX and twin integrity without hardware

| Evidence | Source |
|----------|--------|
| Harbour Civic fictional labelling visible | UI smoke |
| Mocks return `mock: true` | Adapter tests |
| Fit/route/confidence unchanged vs Core | Engine regression |

### C4 — Shadow proves observation → decision → dry-run chain

| Evidence | Source |
|----------|--------|
| Real or recorded observations ingested with provenance | Shadow pilot logs |
| Actions logged with `executed: false` | Action event audit |
| No adapter sockets opened | Network / adapter `connected` asserts |

### C5 — Supervised proves human-in-the-loop control

| Evidence | Source |
|----------|--------|
| Every dispatch has approval actor + timestamp | Audit |
| Cancel path never dispatches | State machine tests |
| SLOs in [SLOS.md](./SLOS.md) met for pilot window | Pilot console metrics |
| Hazard log reviewed; H08/H14 accepted or mitigated | [HAZARD_LOG.md](./HAZARD_LOG.md) |

### C6 — Live enablement is explicit and reversible

| Evidence | Source |
|----------|--------|
| Dual control to set live flag | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Rollback kills dispatch within RTO | Incident drills |
| Checklist signed | [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) |

## Mode progression gate

```
demo ──pass C1–C3──► shadow ──pass C4──► supervised ──pass C5 + SLOs──► live (C6)
```

Skipping a gate is a **safety case violation**.

## Residual risk statement

Even after C1–C6, Physical Systems does not claim legal compliance certification, emergency evacuation authority, or zero residual risk for building control. Live pilots remain venue-scoped with manual fallback procedures.

## Related

[SAFETY_KERNEL.md](./SAFETY_KERNEL.md) · [SLOS.md](./SLOS.md) · [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
