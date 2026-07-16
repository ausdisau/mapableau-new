# MapAble Transport — Implementation Checklist

Adapted prompts. Defer 16–17.

## Stage A — Foundation (Prompt 0 + PC-0)

- [x] `.cursor/rules/mapable-transport.mdc`
- [x] `docs/transport/PRODUCT_REQUIREMENTS.md`
- [x] `docs/transport/CURRENT_STATE_AUDIT.md`
- [x] `docs/transport/ARCHITECTURE_DECISIONS.md`
- [x] Production-claim registry + `GET /api/transport/features`

## Stage B — Routes + public shell (Prompt 1 + PC-4 sync)

- [ ] Canonical `/transport/*` routes and compatibility redirects
- [ ] Public page driven by claim registry
- [ ] Recommended planned wording for eligibility, service records, advisory routing

## Stage C — Domain (Prompt 2)

- [ ] TransportAccessProfile
- [ ] TransportQuote
- [ ] TransportPricingRule
- [ ] TransportLocation (encrypted)
- [ ] Eligibility snapshot on assignment
- [ ] Idempotency on trip events
- [ ] Zod/types shared

## Stage D — Runtime (Prompts 3–6)

- [ ] State machine gaps (quote lifecycle, incident_hold, billing hold, settled)
- [ ] Expanded eligibility + snapshots
- [ ] Location crypto + audit
- [ ] Profile/consent/request/quote/dashboard APIs
- [ ] Advisory routing + sandbox quote adapters

## Stage E — Participant (Prompts 7–9)

- [ ] Access Profile UI
- [ ] Request/quote wizard
- [ ] Dashboard + trip detail honesty

## Stage F — Operations (Prompts 10–13)

- [ ] Operator dispatch quote/assign UX
- [ ] Fleet workspace
- [ ] Driver field on TransportTrip + offline queue
- [ ] Realtime transport rooms + polling fallback
- [ ] Evidence/incidents/complaints/attestations

## Stage G — Financial + Care (Prompts 14–15)

- [ ] Versioned pricing + funding labels
- [ ] Stripe/Xero participant-paid path
- [ ] Care+Transport → TransportTrip with confirmation

## Stage H — Hardening (Prompts 18–20)

- [ ] SECURITY_AND_PRIVACY.md + a11y pass
- [ ] Test pyramid + CI
- [ ] Sandbox seed
- [ ] RELEASE_READINESS.md + checklist close

## Deferred

- [ ] Prompt 16 — GTFS / transit alerts
- [ ] Prompt 17 — Reliability / coordinator / admin compliance depth
