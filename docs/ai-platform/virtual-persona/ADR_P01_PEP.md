# ADR — P01 Deterministic Policy Enforcement Point

**Status:** Accepted for synthetic / default-off harness module  
**Date:** 2026-11-06 (Australia/Sydney)  
**Scope:** `lib/aura-harness/pep/**` under existing W-AA-1 path waiver  
**Non-goals:** OPA/Rego, Prisma migrations, live route wiring, merging dual authority writers, durable Stop AURA, ParticipantRAG/ProviderRAG

## Context

Virtual Persona P02 shipped as synthetic UI without a server PEP. Protected retrieval and tool calls must not trust client headers, model output, or org membership alone. MapAble Core already owns identity (`getCurrentUser`), consent (`ConsentRecord` + purpose-aware `verifyPurposeConsent`), and identity-side delegated authority (`hasParticipantAuthority`).

## Decision

1. Place a typed, default-deny PEP under `lib/aura-harness/pep/` (W-AA-1), not a second consent ledger under `lib/consent/pep/`.
2. Gate with `MAPABLE_PEP_ENABLED === "true"` (default false). When disabled, evaluation returns `pep_disabled` and must not alter live product behaviour (no callers wired in this unit).
3. Fail-closed order: stop AURA → prohibited use → required IDs → non-empty tenant + membership for delegates → exact-purpose consent → identity authority for delegation → audit.
4. Reuse Navigator `verifyPurposeConsent` pattern (or injectable equivalent) — never bare `checkConsent` for protected AI reads.
5. Prefer identity `hasParticipantAuthority` (`delegateId` / `domain` / `actions`). Document programmes twin as unresolved C2; do not merge writers in P01.
6. Ignore untrusted client claims (`role`, `tenant`, `consent`) on the request — they never allow access.
7. No OPA in P01. No automatic grants, revocations, or permission mutations from this module.

## Consequences

- Callers must opt in after the flag is enabled and adapters are injected/wired.
- P03 RAG remains blocked until PEP suite is green and a separate retrieval-path freeze waiver exists.
- Dual authority writers remain a known risk for any code still using programmes evaluators.

## Related

- [`DELIVERY_STATE.md`](./DELIVERY_STATE.md)
- [`../VIRTUAL_PERSONA_P00_RECONCILIATION.md`](../VIRTUAL_PERSONA_P00_RECONCILIATION.md)
- [`../../remediation/FEATURE_FREEZE.md`](../../remediation/FEATURE_FREEZE.md)
