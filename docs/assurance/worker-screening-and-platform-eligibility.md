# Worker screening and platform eligibility

Worker platform trust gates platform work based on clearance and banning-order status.

## Rules

| Status | Platform work |
|--------|---------------|
| `eligible` | Allowed (subject to other gates) |
| `pending_clearance` | **Not eligible** |
| `source_unavailable` | Banning check inconclusive — **not clear** |
| `blocked` / `blocksPlatformWork` | Blocked |

## Credential verification

- `self_declared` credentials are **not verified**
- Verified credentials require external source confirmation

See [credential verification](./credential-verification.md) and [worker platform trust](./worker-platform-trust.md).

## Audit

`pnpm assurance:audit-worker-trust` (wrapper: `scripts/audit-worker-trust-readiness.ts`)

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- MapAble eligibility assessments do not replace NDIS worker screening checks.
