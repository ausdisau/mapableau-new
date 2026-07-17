# AURA Wave 3 — Action Proposals

Authority: **L3_PROPOSE**. External actions: **zero**.

## Guarantee

AURA may draft, verify, and shadow-evaluate immutable proposals. It must not send messages, create bookings, publish reports, share Passports/Visit Plans, notify supporters, or call write adapters.

Participant “Accept for shadow evaluation” ≠ execution approval. Wave 4 requires a new execution-specific approval.

## Supported types

- venue_verification_request
- visit_plan_share
- supporter_notification
- transport_request
- barrier_report

## Implementation

`lib/aura/proposals/index.ts` — create, hash, verify, review, revise, shadow, cancel, expiry, execution guard.

Direct Access Intelligence write tools remain outside the AURA tool registry.

## Flags

- `MAPABLE_AURA_PROPOSALS_ENABLED`
- `MAPABLE_AURA_PROPOSAL_REVIEW_ENABLED`
- `MAPABLE_AURA_SHADOW_EVALUATION_ENABLED`
- Write/delivery/physical must stay `false`
