# Wave 11 — Life Events & Service Recovery: architecture & risk plan

> Wave 11 adds a *projection* over existing incidents, complaints, bookings,
> and AURA executions to reason about life-events, service continuity, and
> deterministic service-recovery plans. **It does NOT create a second
> incident/complaint/booking/execution system.** Wave 2–10 protections (Case
> model, consent-v2, disclosure gateway, wallet, delegation, AURA safety
> envelope, tenant scoping, invoice/billing approvals) are preserved as
> the source of truth. See `wave-11-integrity-baseline.md`.

## Locked decisions

1. Continuity uses `ContinuityCase` — a projection linked *optionally* to the
   existing `Case`. Adapters bridge to Care, Transport, Appointments
   (non-clinical), Employment, Housing, Provider-Failure, and Finance
   (finance is explain-and-hand-off only, no approval authority).
2. `lib/continuity/continuity-intelligence-service.ts` (Y3 continuity
   intelligence) stays as-is. Wave 11 modules live in subdirectories under
   `lib/continuity/` and `lib/life-events/`.
3. A continuity case is opened BEFORE any status is mutated on a linked
   service. Executable status mutations are only performed via an approved
   recovery plan step.
4. All idempotency keys are deterministic. `Date.now()` is prohibited in
   any key that lives longer than a single request.
5. Care cancellation MUST NOT auto-cancel linked transport. The care
   cancellation raises a continuity signal, opens a continuity case, and
   surfaces goal-preserving options for a human decision.
6. **Essential support is participant-defined.** Never inferred from
   diagnosis, plan type, or NDIS category. See `wave-11-essential-support-boundary.md`.
7. Standing recovery instructions are narrow, revocable, rechecked at
   execution time, and cannot authorise Wave-10-prohibited actions,
   emergency dispatch, or financial approvals.
8. AURA `service_recovery` is a NEW specialist manifest, distinct from
   Wave 10 `recovery` (which handles account recovery only).
9. **No emergency-service automation.** AURA cannot call 000, dispatch an
   ambulance, contact the police, or trigger a fire brigade. Every plan
   containing such a step is blocked at the emergency boundary.
10. **No auto life events from history**, no auto standing instructions,
    no auto external civic feeds. Civic feed registrations default to
    disabled; individual signals from an activated feed are only used
    when validated + fresh.
11. External signals are untrusted until validated. Stale signals cannot
    drive destructive action.
12. Continuity preserves **participant goals**, not merely their bookings.
    Cancelling one booking is always preferable to violating a goal or
    essential support.
13. Push commits; do NOT open a PR (the environment publishes PRs).

## H remediation — orchestrator audit findings

The pre-Wave-11 `lib/orchestration/care-transport-orchestrator.ts` had four
integrity bugs that Wave 11 fixes as its first change:

| # | Finding | Wave 11 fix |
|---|---|---|
| 1 | `propagateCareShiftStatusToTransport` auto-cancelled the linked transport whenever a care shift was cancelled — silently violating the participant's goal (they may still need the ride). | Cancellation now emits a `ContinuitySignal`, opens/updates a `ContinuityCase` with category `transport`, and does NOT mutate transport status. Only an approved recovery-plan step can change transport status. |
| 2 | The propagation event's idempotency key used `Date.now()`, so the "already processed" check was defeated for any repeat call. | Deterministic key `cancel-${shiftId}-${transportBookingId}`; the orchestration row is upserted rather than re-created. |
| 3 | `createLinkedTransportFromCareRequest` fell back to the placeholder "Address to be confirmed" and coerced `preferredDate` to `new Date()` if missing — producing executable bookings from placeholder data. | Explicit refusal: `OrchestrationInvalidError("PLACEHOLDER_ADDRESS")` and `OrchestrationInvalidError("MISSING_PREFERRED_DATE")`. Callers must save the linked transport as a draft first, or throw. |
| 4 | `listPendingRescheduleRequests(coordinatorId?)` ignored `coordinatorId`, was unscoped by organisation, unpaged, and returned a global queue. | New signature `listPendingRescheduleRequests({ organisationId, coordinatorId?, status?, limit?, cursorId? })`. Fails closed if `organisationId` is missing. Coordinator filter is honoured. Stable ordering + pagination. Compatibility mode is documented — legacy callers must fetch by id directly. |

## Signal → case → plan → execution flow

```
signal (validated + fresh)         standing instruction (active + narrow)
        │                                        │
        ▼                                        ▼
   correlationService                     evaluateStandingInstruction
        │                                        │
        ▼                                        ▼
  openOrExtendContinuityCase  <──────────────────
        │
        ▼
   buildRecoveryOptions (deterministic)
        │
        ▼
   draftRecoveryPlan → simulateRecoveryPlan (ZERO external writes)
        │
        ▼
   participant/delegate/coordinator approval
        │
        ▼
   startRecoveryExecution (deterministic idempotency key)
        │
        ├──> completed
        ├──> failed → compensating action
        └──> execution_unknown → HUMAN reconciliation
```

## Emergency boundary

`lib/aura/safety/emergency-boundary.ts` refuses to invoke:

- 000 / triple zero
- Ambulance / police / fire dispatch
- Mental health crisis dispatch
- Any after-hours safety line

Plans whose narrative claims an emergency dispatch action are blocked with
`EmergencyBoundaryError`.

## Financial recovery boundary

`lib/continuity/finance/finance-recovery-service.ts` refuses to approve or
submit any invoice, claim, refund, or payment. All finance recovery paths
produce a summary and hand off to a billing coordinator.

## What this wave deliberately does NOT do

- Modify Case, incidents, complaints, bookings, or AURA execution schemas
  beyond adding an optional back-relation on `Case`.
- Introduce automatic life-event detection from history.
- Trust external civic feeds by default.
- Grant AURA any new financial authority.
- Allow AURA to close a safeguarding case or alter consent.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A tenant with legacy code still calls the old `listPendingRescheduleRequests()` signature | Medium | Silent global queue exposure | The new signature throws `OrchestrationInvalidError("RESCHEDULE_QUEUE_UNSCOPED")` when unscoped; scripts `audit-unscoped-recovery-queries` catches remaining callers. |
| A standing instruction is used past its expiry | Medium | Wrong-authority write | Instructions rechecked at execution; expired instructions never authorise. |
| A civic feed becomes stale during a disaster | High | Wrong recovery advice | Feeds have `freshnessTtlMinutes`; stale feeds cannot drive destructive action. |
| AURA suggests a life event that never happened | Low | Bad UX | `aiSuggested=true` and `status=draft` — nothing takes effect until a human confirms. |
| Financial recovery leaks through a domain adapter | Low | Regulatory breach | `FINANCIAL_PROHIBITED_ACTION_SLUGS` blocklist is the single source of truth; `assertNotFinancialApproval` is called at every boundary. |
| Emergency dispatch attempted by AURA | Low | Safety and legal breach | `EmergencyBoundaryError`; specialist manifest lists emergency actions in `prohibitedActionSlugs`; narrative scan for "will call 000" style claims. |
| Coordinator queue exposure across tenants | Medium | Data leak | `listContinuityCases` fails closed without `organisationId`; audit script `audit-unscoped-recovery-queries` enforces at CI. |

## Compatibility mode for legacy reads

`OrchestrationRescheduleRequest` gains two optional fields (`coordinatorId`,
`organisationId`) and two new indexes. Existing rows without those fields
are still readable via `prisma.orchestrationRescheduleRequest.findUnique`
by primary key. Broad, unscoped listing is no longer supported.

## Test surface (Wave 11)

See `wave-11-test-plan.md`. At least 50 vitest cases across
`tests/continuity/` and `tests/life-events/`, plus dry-run scripts.
