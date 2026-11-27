# MapAble Support Intelligence v0.1

Participant-directed discovery, support needs assessment and evidence-backed service matching inside MapAble Search.

## Components

| Component | Path |
|-----------|------|
| Facade | `lib/support-intelligence/` |
| Spider | `lib/support-intelligence/spider/` |
| SNA | `lib/support-intelligence/sna/` + existing `lib/intake/support-needs-assessor.ts` |
| SMA | `lib/support-intelligence/sma/` |
| Regulatory Evidence Gateway | `lib/support-intelligence/regulatory/` |
| Worker Verification Gateway | `lib/support-intelligence/worker-verification/` |
| Demand Intelligence | `lib/support-intelligence/demand/` |
| APIs | `app/api/support-intelligence/*` |
| OpenAPI | `docs/api/openapi-support-intelligence.yaml` |
| Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Readiness | [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md) |

## Safeguards (non-negotiable)

- No unauthorised worker-screening database crawling
- No invented registration, vacancy or competency claims
- No AI determination of NDIS eligibility or funding
- No automated high-risk support authorisation
- No commercial influence over organic matching rankings
- No sensitive participant information in public search indexes
- Human review for regulatory conflicts, uncertain identity matches and complex support requirements
- Booking, payment and autonomous dispatch remain disabled

## Quick status

```sh
curl -s localhost:3000/api/support-intelligence/status | jq .
```
