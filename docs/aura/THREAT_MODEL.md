# AURA — THREAT MODEL

See also: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [BRANCH_AND_DOMAIN_RECONCILIATION.md](./BRANCH_AND_DOMAIN_RECONCILIATION.md).

## Summary

MapAble **AURA** (Accessibility · Understanding · Routing · Agency) is a participant-controlled accessibility assistant. It is **ASI-ready** in the safety sense: capability growth must not automatically expand authority, personal-data access, or write permission.

**Foundational rule:** Agents interpret, retrieve, compare, simulate, draft and recommend. Participants decide. Deterministic MapAble services execute.

## Wave 1 status

Wave 1 (read-only) ships on branch `cursor/mapable-aura-wave1-6ea8`:

- CareOSMission as canonical mission SoT (+ AuraMissionExtension)
- Capability leases; authority ceiling **L2_RECOMMEND**
- Proof-carrying plans + independent verifier
- Stop AURA protocol
- Accessibility Mission mode on `/ask`
- Taylor @ Harbour Civic synthetic flagship
- **No** application writes; **no** Prisma in agent tools; physical actuation **off**

## Topic focus: THREAT MODEL

This document covers **THREAT MODEL** for AURA operators and reviewers. Production enablement requires gates in PRODUCTION_READINESS.md. Do not claim AURA is an ASI, autonomous case management, or generally production-ready while release gates remain open.

## Wave 2 additions

| Threat                            | Control                                                  |
| --------------------------------- | -------------------------------------------------------- |
| Counterfactual mutation injection | Allowlisted category/operation; schema validation        |
| Simulated result as real          | `simulated: true` + disclaimer on every result           |
| Hard requirement weakening        | Explicit rejection                                       |
| Late result after stop            | AbortController + `discardIfStopped` + stop-state checks |
| Replay tampering                  | Hash chain verification                                  |
| Sensitive offline pack content    | Exclusion list; HTML without secrets                     |
| Cross-user mission / audit        | Ownership checks on every route                          |
| Unlimited simulations             | Max runs per mission                                     |
| Recursive planning                | One automatic challenge cycle                            |

## Wave 3 additions

| Threat | Control |
| --- | --- |
| Accidental execution | Kill-switch flags + execution guard |
| Shadow-to-live confusion | UI copy + `futureExecutionApproval: false` |
| Disclosure expansion | Purpose allowlists + verifier |
| Proposal hash substitution | Canonical hash verify |
| Direct write-tool registration | Forbidden tool list + tests |
| Client-forged shadow result | Server-built evaluation only |

## Related paths

- `lib/aura/`
- `app/api/intelligence/aura/`
- `components/aura/`
- `tests/aura/`
