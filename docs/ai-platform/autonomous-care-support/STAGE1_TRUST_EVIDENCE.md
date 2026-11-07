# Autonomous Care & Support — Stage 1 Trust Evidence

**Decision:** ALLOW WITH SAFEGUARDS  
**Waiver:** W-ACS-1 (see `docs/remediation/FEATURE_FREEZE.md`)  
**Branch:** `cursor/acs-stage1-trust-af0e`  
**Flags:** `MAPABLE_PEP_ENABLED` default **false**

## Gaps closed

| ID | Fix | Evidence |
|----|-----|----------|
| C1 | Shared `lib/consent/purpose-consent.ts`; Navigator thin caller; `checkConsent` optional purpose/fields/action | `tests/autonomous-care-support/consent-purpose-enforcement.test.ts` + Navigator phase1 |
| C2 | Programme authority writer dual-writes `delegateId`/`actions`; evaluator accepts grantee or delegate | Code in `lib/programmes/authority/participant-authority-service.ts` |
| C3 | Postgres `ProgrammeAuraStop` + `durable-stop.ts`; execution gate checks durable stop | `tests/autonomous-care-support/durable-stop-aura.test.ts` |
| C4 | `assertParticipantTenantAccess` fail-closed | `tests/autonomous-care-support/cross-tenant-deny.test.ts` |
| ACS-PEP | `lib/aura-harness/pep/**` adapters use shared consent + durable stop | `tests/aura-harness/pep/*` |
| Revocation | Consent revoke bumps protected-read invalidation epoch | `tests/autonomous-care-support/revocation-invalidation.test.ts` |

## Synthetic negatives

| Case | Status |
|------|--------|
| N1–N2, N6 cross-tenant / forged claim | Pass |
| N3 / N11 revoke + invalidation | Pass |
| N4–N5 purpose / fields | Pass |
| N7 durable stop | Pass |
| N8 AAC ≠ capacity | Contract fixture pass |
| N9 proposal-only ceiling | Pass |
| N10 idempotency | Deferred to Stage 3 (Temporal) — documented |
| N12–N13 standing instruction | Deferred to Stage 3 — design note only |
| N14 clinical red lines | Contract list pass |
| P4 exact-purpose allow | Pass |

## Still frozen / not authorised

Private ParticipantRAG/ProviderRAG, Temporal Cloud, Redis-as-consent, L2 standing-instruction store, physical/clinical sole control, production flag enablement.

## Verification commands

```bash
pnpm exec vitest run tests/autonomous-care-support tests/aura-harness/pep tests/navigator/phase1-foundation.test.ts
pnpm exec tsx scripts/ci/check-production-claims.ts
pnpm exec tsx scripts/ci/check-feature-dependencies.ts
```

**Stage 1 does not authorise Stage 2 automatically** — Stage 2 proceeds only after this evidence and a separate PR.
