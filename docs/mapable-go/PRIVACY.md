# MapAble Go — Privacy

**Claim state:** IN_DEVELOPMENT

## Location sensitivity

Precise location requires explicit consent purpose. Separate:

- CURRENT_LOCATION — active navigation window only
- ROUTE_HISTORY — optional, consent-gated (future)
- BARRIER_REPORT — location of report
- ACCESS_TELEMETRY — deferred, flag off

## Controls

- `GoLocationSession`: purpose, precision level, expiry, revocation
- No continuous background tracking in slice 1
- Audit events exclude precise coordinates
- Minimum necessary precision for each purpose

## Consent scopes

- `go.current_location`
- `go.route_history` (reserved)
- `go.barrier_report`
