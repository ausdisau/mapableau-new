# MapAble Transport — Implementation Checklist

Adapted prompts. Defer 16–17.

## Stage A — Foundation (Prompt 0 + PC-0)

- [x] `.cursor/rules/mapable-transport.mdc`
- [x] `docs/transport/PRODUCT_REQUIREMENTS.md`
- [x] `docs/transport/CURRENT_STATE_AUDIT.md`
- [x] `docs/transport/ARCHITECTURE_DECISIONS.md`
- [x] Production-claim registry + `GET /api/transport/features`

## Stage B — Routes + public shell (Prompt 1 + PC-4 sync)

- [x] Canonical `/transport/*` routes and compatibility redirects
- [x] Public page driven by claim registry
- [x] Recommended planned wording for eligibility, service records, advisory routing

## Stage C — Domain (Prompt 2)

- [x] TransportAccessProfile
- [x] TransportQuote
- [x] TransportPricingRule
- [x] TransportLocation (encrypted)
- [x] Eligibility snapshot on assignment
- [x] Idempotency on trip events
- [x] Zod/types shared
- [x] Migration `20260716140000_transport_mvp_domain`

## Stage D — Runtime (Prompts 3–6)

- [x] State machine gaps (quote lifecycle, incident_hold, billing hold, settled)
- [x] Expanded eligibility + snapshots
- [x] Location crypto + audit filtering on events
- [x] Profile/request/quote/dashboard APIs
- [x] Advisory routing + sandbox quote adapters

## Stage E — Participant (Prompts 7–9)

- [x] Access Profile UI
- [x] Request/quote wizard (sandbox options on trip detail)
- [x] Dashboard API + trip detail quote honesty

## Stage F — Operations (Prompts 10–13)

- [x] Operator dispatch entry + fleet shell
- [x] Driver entry + offline queue module
- [x] Realtime polling fallback hook
- [x] Complaints API + attestations on quote accept
- [ ] Full driver UI migration off TransportBooking (remaining)
- [ ] WebSocket transport rooms (planned)

## Stage G — Financial + Care (Prompts 14–15)

- [x] Pricing rule model + selection helpers
- [x] Funding labels (never NDIS Covered)
- [x] Care+Transport → TransportTrip with explicit confirmation
- [ ] Stripe/Xero settlement wiring (scaffold only)

## Stage H — Hardening (Prompts 18–20)

- [x] SECURITY_AND_PRIVACY.md + a11y report scaffold
- [x] Transport CI workflow + unit tests
- [x] Sandbox seed script
- [x] RELEASE_READINESS.md + checklist close

## Deferred

- [ ] Prompt 16 — GTFS / transit alerts
- [ ] Prompt 17 — Reliability / coordinator / admin compliance depth
