# MapAble Transport — Product Requirements

## North star

Accessibility-first, privacy-preserving transport request, quote, dispatch, trip, evidence, and billing for Australia, integrated with MapAble Care without silent cross-module data sharing.

## Actors

| Actor | Goals |
| --- | --- |
| Participant | Access profile, request trips, receive fit-checked quotes, confirm, track status, confirm/dispute/complain, receive honest funding/invoice context |
| Authorised delegate | Act within consent scope with visible “acting for” attribution |
| Operator (dispatcher) | Quote, assign eligible drivers/vehicles, dispatch, monitor |
| Fleet manager | Vehicles, credentials, expiries, prestart status — not participant financials |
| Driver | Assigned trips only, prestart, controlled state machine, consented location, offline-tolerant events |
| Operator compliance / admin | Overrides (documented), incidents, complaints, claim registry, pricing rules |

## Truthful product language

| Term | Meaning |
| --- | --- |
| Requested | Participant submitted a transport request |
| Quoted | One or more operator/sandbox quotes exist; not yet accepted |
| Booked / participant confirmed | Participant accepted a quote; trip exists |
| Assigned | Eligible driver and vehicle assigned with eligibility snapshot |
| Advisory estimate | Route/ETA/distance from routing adapter — not operator-confirmed |
| Pilot / sandbox | Deterministic or non-production integration; must be labelled |
| Potentially claimable | Funding context only — not “NDIS Covered” |

## MVP (Prompts 0–15, 18–20)

- Access profile, request/quote/accept flow, dashboard, trip detail
- Fail-closed eligibility, privacy masks, encrypted exact locations
- Operator dispatch + fleet, driver field on `TransportTrip`, realtime with polling fallback
- Evidence, incidents, complaints, attestations; versioned pricing; Care+Transport with confirmation
- Accessibility, security, tests, release readiness, claim registry sync

## Phase two (deferred: Prompts 16–17)

- GTFS / GTFS-Realtime journey planning and service alerts
- Reliability engine, fallback dispatch, coordinator multi-participant view

## Explicitly out of scope

- Emergency dispatch (always direct to 000)
- Representing MapAble as a transit operator
- Auto-booking from Care without confirmation
- Participant photography as default evidence
- Fake live ETAs or funding approval when integrations are absent
