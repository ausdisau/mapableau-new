# MapAble Mission Portfolio

**Status:** documentation + TypeScript contracts only  
**Public claim allowed:** false  
**Inspection baseline:** post leadership train (#330 Starting Work DB, #341 Transport quotes, #346 Care recurring) on `main`

## Positioning

Care and support, connected.  
Strategic category: participant-controlled infrastructure for complete disability-support journeys.

## Architecture decision

Shared **Mission Framework** = coordination layer over canonical domain writers.

- **Do not** create a second mission source of truth (`CareOSMission` / universal `MissionInstance` DDL deferred until ADR + single writer).
- **Retain** Care, TransportTrip, Billing, Consent, AccessibilityProfile, Trust Fabric, Access Evidence as canonical writers.
- **Evolve** Starting Work journey projection (`StartingWorkJourneyProjection`) as the first accepted cross-domain coordination surface.
- **Case** remains interim operational case SoR.

Contracts live in `lib/mission-portfolio/contracts/`.  
Runtime seeds: `lib/convergence-os/seed/capabilities.ts` (keys prefixed `mission.*` / `vertical.*`).

## Documents

| Doc | Purpose |
| --- | --- |
| [DOMAIN_OWNERSHIP.md](./DOMAIN_OWNERSHIP.md) | Canonical owners and non-owners |
| [VERTICAL_REGISTRY.md](./VERTICAL_REGISTRY.md) | Ten Mission Packs + shared features |
| [PARTICIPANT_RIGHTS.md](./PARTICIPANT_RIGHTS.md) | Constitution, AI boundaries, prohibited scores |
| [DELIVERY_WAVES.md](./DELIVERY_WAVES.md) | Wave order and PR discipline |
| [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md) | Mission-pack build/partner/defer deltas |

## Feature flags (all default false — not enabled here)

See `.env.example` comments and [VERTICAL_REGISTRY.md](./VERTICAL_REGISTRY.md). Flags alone never authorise production use.

## Next PRs

1. **This PR** — registry, ownership, contracts, honesty tests  
2. Shared mission dependency projection (read-oriented; reuse Starting Work)  
3. Participant Service Standard + deterministic What Changed diff  

AT Continuity and later verticals start only after these foundations are accepted.
