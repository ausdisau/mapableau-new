# MapAble Transport — Release Readiness

## Go / no-go by capability

| Capability | Claim state | Decision |
| --- | --- | --- |
| Public safety model | production_ready | Go |
| Provider finder | production_ready | Go |
| Participant request/history | pilot | Pilot only — not “Available now” beyond signed-in pilot wording |
| Access profile | pilot | Pilot |
| Quote flow (sandbox) | sandbox/pilot | Pilot — sandbox labelled |
| Driver/vehicle eligibility | pilot | No-go for production_ready until runbooks + prod gates |
| Trip status / service records | pilot | No-go for production claim |
| Advisory routing | sandbox/pilot | Advisory only |
| Realtime WS | planned | No-go |
| Versioned pricing / Stripe path | planned | Scaffold only |
| Care+Transport on TransportTrip | planned/pilot | Confirmation-required path added; legacy booking path remains |
| GTFS (Prompt 16) | deferred | Out of MVP |
| Reliability engine (Prompt 17) | deferred | Out of MVP |

## Promotion rules

A capability moves to `production_ready` only when production has migrations, policies, integrations, monitoring, privacy controls, accessibility verification, operational ownership, runbooks, and passing release tests.

## Remaining blockers

1. Production DB migrate + encrypt key configured.
2. Driver UI fully migrated off legacy TransportBooking.
3. Realtime transport rooms not shipped.
4. Stripe/Xero transport settlement path incomplete.
5. Partner operator APIs absent — sandbox quotes only in many environments.

## Executive summary

Transport MVP foundation is adapted onto the Next.js/Prisma stack with honest public claims, domain extensions, fail-closed eligibility snapshots, access profile, sandbox quote acceptance, complaints, pricing rule scaffolding, and Care→TransportTrip confirmation path. Public site must not claim eligibility, live status, or routing as production-ready until gates pass.
