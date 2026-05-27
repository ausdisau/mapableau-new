# MapAble strategy — accessible transport

## Problem

People with disability need transport that matches **mobility requirements**, **verified accessible fleet**, **trained drivers**, and **safeguarding** — not generic ride-hail matching on price and ETA alone.

## Approach

Build on the existing `TransportTrip` scheduling domain: human dispatch, consent-gated data sharing, advisory routing only, and optional NDIS billing linkage with human approval.

## Primary users

- **Participants** — book trips, confirm outcomes, dispute when needed
- **Family / nominees** — summary trip visibility with `transport.trip_access` consent
- **Provider dispatchers** — accept, assign, pool (phase 2), recover service
- **Verified drivers** — status progression, handover and safety checks

## Key metrics

- Handover and pre-start check completion rate
- Eligibility mismatch rate at assign time (should fall as matching improves)
- Dispatcher time per assign
- Trip confirm vs dispute rate
- Phase 2: passengers per locked ride run

## Non-goals

- Autonomous dispatch or vehicle assignment
- Automatic NDIS payment or Commission submission
- Peer-to-peer unverified drivers
- Surge pricing / gig payouts

## Tracks

1. **MVP managed rides** — mobility schema, consent UX, dispatch UI, handover, booking bridge (flagged)
2. **Pooling** — `RideRun`, strictest-wins mobility, human lock
3. **On-demand queue** (optional later) — still human assign
