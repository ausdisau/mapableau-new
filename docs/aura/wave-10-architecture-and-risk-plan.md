# MapAble Wave 10 — AURA Architecture and Risk Plan

**AURA (Automated Utility & Reasoning Assistant)** is MapAble's Wave 10
participant-controlled agent surface. It is a **bounded execution layer** —
not unrestricted LLM tool use. This document consolidates the Phase 1 audit
findings, the separation of decision responsibilities, and the risk framing
that governs every AURA change.

## What AURA is not

AURA is not sentient. AURA does not have consciousness, feelings, agency, or
lived experience. AURA is not artificial general intelligence.

AURA is not:

- a legal representative or substitute decision-maker
- a medical practitioner, mental-health clinician, or diagnostic tool
- an NDIS planner or NDIA-appointed reviewer
- a financial adviser, tax adviser, or auditor
- a delegate, guardian, or nominee

AURA cannot:

- create enduring self-goals (goals are participant- or delegate-initiated)
- escalate its own permissions
- modify safety policies or authority envelopes
- spawn unrestricted sub-agents
- impersonate a participant or delegate
- release its own kill switch
- approve invoices, claims, or payments (Billing specialist is explain-only)
- grant, alter, or withdraw consent (only the participant can)
- appoint or alter legal delegation
- decide whether an incident is reportable
- close a safeguarding case
- activate a production integration

All participant data egress continues to route through Wave 9's mandatory
`discloseParticipantData` gateway and the consent-v2 directive layer. Wave 8
tenant context (`Organisation.id`) is required on every mutation.

## Separation of decision responsibilities

Every AURA-influenced outcome is composed of four distinct decision layers.
AURA is deliberately kept out of the last two.

| Layer                          | Who decides                       | Where                              |
| ------------------------------ | --------------------------------- | ---------------------------------- |
| Deterministic rules            | Wave 4-5 matching, Wave 7 pilot rules, Wave 8 tenant policy | `lib/matching/`, `lib/pilot/`, `lib/tenancy/` |
| Model-produced suggestions     | AURA agent (bounded)              | `lib/aura/agents/`, `lib/ai-platform/models/` |
| Human decisions                | Participant, delegate, provider staff, safety officer, admin | Approvals + UI          |
| Irreversible actions           | Human decisions **only**          | Downstream services (Wave 4-9 domains) |

AURA can produce plan suggestions and prepare tool inputs. It cannot commit an
irreversible action without a bound human approval whose `inputHash` still
matches at execution time.

## Legacy AI matching (Waves 4-5)

Legacy AI matching is retained as **advisory only**. The Phase 1 audit found
that the previous `ai-match-service.ts` fabricated an "AI score" from the
deterministic rule score. Wave 10 corrects this:

- `ruleScore` is deterministic (from `runCareWorkerMatch`)
- `modelCommentaryScore` is populated only when an active
  `MatchingModelVersion` has a real provider; otherwise it is null. AURA never
  invents an independent score from the rule output.
- `acceptAiCandidate` runs in a single transaction, checks tenant ownership,
  requires an approved `FairnessReview` when human review is required, and
  leaves the candidate untouched on any validation failure.
- Worker candidate pools are scoped by `careRequest.assignedOrganisationId`
  when known (fail closed instead of pulling a global top-50).
- The accept API asserts the caller can act for the care request's tenant.

## The bounded execution invariants

The runtime enforces these invariants for every AURA execution:

1. No authority envelope → no execution (`envelope_missing`).
2. Empty permission list → deny (`empty_permissions`).
3. `evaluateAuthority` composes envelope + consent + delegation +
   tenant policy + entitlement into a single decision.
4. Plans are DAGs. `validatePlanGraph` rejects unknown actions, unknown
   tools, unknown parents, cycles, forward references, and unbounded loops.
5. Simulation writes to nothing external (`externalWrites === 0`).
6. Approvals bind an `inputHash`. Any change invalidates the approval.
7. Executions use a durable state machine with `execution_unknown` for
   partial-success ambiguity; compensation is the only path out of a failed
   high-risk step.
8. Tools live in a registry. Raw Prisma, raw SQL, raw shell, arbitrary HTTP,
   `eval` and any envelope-modifying tool are explicitly prohibited.
9. MCP servers must be registered, approved, conformance-tested, version-pinned
   and production-activated before use. When `AURA_MCP_ENABLED=false` the
   gateway returns `not_configured`.
10. A2A is disabled by default. When enabled, every peer request maps to an
    internal AURA goal; peers cannot reach participant data outside the
    disclosure gateway.
11. Memory is participant-controlled. Model output is never auto-saved.
    Prohibited memory classes (medical diagnosis, legal advice, kill-switch,
    permission grant, credentials, passwords) are rejected outright.
12. Safety holds pause AURA. Kill-switch release requires a human safety
    officer; AURA cannot release its own hold.
13. Untrusted content (tool outputs, MCP responses, participant messages,
    external documents, emails) cannot grant authority, modify policy, or
    release safety holds — even if it appears to include a directive.

## Threat notes

- **Prompt injection**: All untrusted content is wrapped with a boundary and
  any embedded `system:` / `policy:` / `you are now` directives are stripped.
  Authority attempts whose origin is an untrusted source are denied.
- **Cross-tenant leakage**: Wave 8 organisation context is required. AURA does
  not cross tenants except through the disclosure gateway.
- **Silent skid to production**: Every model, prompt, tool, MCP server, and
  A2A peer has an explicit `productionActivated` flag defaulting to `false`.
- **Runaway compensation**: `execution_unknown` requires human resolution.
- **Approval drift**: `inputHash` binding rejects stale approvals.
- **Model self-update**: `isOnlineSelfUpdateAllowed()` returns `false`.

## Cross-links

- Wave 8 governed multi-organisation production scale — `docs/platform/`
- Wave 9 participant-controlled credentials and federation —
  `docs/federation/`
- Selective disclosure threat model — `docs/security/selective-disclosure-threat-model.md`
