# Credential verification

Worker credentials on MapAble are classified by verification source. Self-declared credentials never satisfy assurance gates.

## Verification levels

| Source | Assured |
|--------|---------|
| `self_declared` | No |
| External registry / verified upload | Yes (with evidence) |
| Pending | No |

## Go-live impact

`workerTrustSatisfied` on `ProductionGoLiveAssessment` requires eligible workers without blocking clearance gaps.

See [worker screening and platform eligibility](./worker-screening-and-platform-eligibility.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Credential records in MapAble are not a substitute for NDIS worker screening registration.
