# MapAble Service Cartography

**Rights-first algorithms for service discovery, accessible journeys, scheduling,
service gaps, resource efficiency, equity analysis and public-policy scenarios.**

> **Status: experimental open-source reference library, v0.1.0.** All examples
> use synthetic records. Nothing here authorises real services, determines NDIS
> funding or eligibility, changes support arrangements, or makes clinical or legal
> decisions. It is not an API, database, service provider or production application.

## Why this exists

A disability support service is not genuinely available merely because it appears
on a map. It must be suitable for the person's stated needs, accessible in practice,
within a real availability window, supported by evidence and chosen or authorised
by that person. Financial savings must not be allowed to displace consent, safety,
communication access or essential support.

Service Cartography maps **services, dependencies, access conditions, resource
constraints, service gaps, evidence and options**, while recognising that people
with disability remain the primary decision-makers about their own goals and
lives. Its domain logic is intentionally decoupled from providers, NDIS APIs,
commercial payment systems, AI models and political parties.

## Algorithms and status

| Module | Public function | Purpose |
| --- | --- | --- |
| Consent scope | `checkConsent` | Fail-closed, purpose/recipient/time-scoped grants |
| Evidence currency | `assessEvidence` | Prevent stale, disputed, reported or unbounded evidence being treated as verified |
| Rights-gated matching | `matchServices` | Rank only suitable, verified, available, consented options; no auto-match |
| Service dependency graph | `planServiceDependencies` | Detect missing, unverified or cyclic service dependencies |
| Accessibility-aware routing | `findAccessibleRoute` | Directed shortest verified path respecting participant-supplied path constraints |
| Regional gap analysis | `analyseServiceGaps` | Aggregate unmet requests vs verified capacity; preserve unknowns/suppress small cells |
| Resource scheduling | `proposeServiceSchedule` | Generate conflict-free proposals for verified slots; no booking execution |
| Economic scenarios | `modelEconomicScenario` | Estimate fiscal/capacity gaps without redefining support needs |
| Equity screening | `auditServiceEquity` | Descriptive service-fulfilment disparities; review required, not discrimination findings |
| Political-label neutrality | `checkPolicyLabelInvariance` | Counterfactual relabelling regression test for economic modelling |
| Continuity alerting | `detectContinuityGaps` | Flag cancellations without fallback / unknown critical service status |
| Audit payload | `createDecisionAuditEvent` | Structured decision metadata for a host-managed immutable ledger |

All functions are synchronous, deterministic for supplied inputs, network-free and
side-effect-free at the application/service boundary. No third-party runtime packages,
telemetry, API keys, external services or live participant records are required.

## Quick start

Requires Node 20+ and a TypeScript 5.x compiler (installed with `npm install` or
available on your PATH).

```sh
npm install
npm test
npm run demo
```

`npm test` compiles TypeScript and runs the Node built-in test suite.

### Example: rights-first options

```ts
import { matchServices } from '@mapable/service-cartography';

const result = matchServices({
  request, // participant-defined requirements and chosen provider preferences
  offers,  // currently verified synthetic or permitted operational data
  grants,  // a purpose- and recipient-scoped grant (not a general account flag)
  at: '2026-11-18T03:00:00Z',
});

// result.status: 'consent_required' | 'invalid_request' |
//                'no_verified_match' | 'advisory_options'
// result.ranked: advisory options only; not service bookings.
```

See `examples/demo.mjs` for complete, executable synthetic fixtures.

## Code vs data licenses

Source code is released under the **Apache License, Version 2.0** (see `LICENSE`).
The license does **not** release the MapAble trademark, user records, provider
records, participant profiles, scraped service data, partner APIs or photos. All
third-party data require independent lawful access and licensing. No private data
is included in this package. Confirm code ownership and trademark attribution
before publication on an organisational GitHub repository.

## Critical architecture boundaries

1. **Rights are gates, not percentages.** Mandatory consent, communication
   capability, verified availability and participant exclusions are checked
   before score-based suggestions. Cost is relevant only among acceptable options.
2. **Unmet need stays visible.** Funding ceilings do not change the number of
   support units stated in the input; no automated support cuts or allocations.
3. **Unknown is not zero.** Missing provider supply does not imply no supply;
   unverified paths are not represented as safe or traversable.
4. **Human decisions remain human.** Outputs explicitly require confirmation
   and/or review. The host must prevent any suggested outcome becoming an
   executable action without separate authorisation and safety checks.
5. **Do not equate a label invariance test with political neutrality.** A model
   may still encode bias through its data, assumptions, constraints and outcomes.
6. **No personhood or disability severity score.** Operational reliability,
   provider capacity, journey suitability and aggregated service gaps are the
   subject of the algorithms, not the worth or productivity of people.
7. **No automatic legal/clinical judgement.** A `verified` flag must come from
   an independently assured upstream process, not from self-report or AI text.

## What is not implemented

No identity provider, consent persistence, encrypted database, worker screening,
NDIA integration, live traffic data, external provider vetting, payment execution,
legal claiming advice, real-time alerts, automated accessibility certification,
secure multi-tenant API, availability feeds, production web UI, or independently
validated fairness assessment. A five-record disclosure threshold is not a
privacy guarantee. The scheduling heuristic is not globally optimal.

For deployment and design gates see `docs/RELEASE_GATES.md` and
`docs/THREAT_MODEL.md`.

## Integration with MapAble

The canonical MapAble repository currently has separate web and mobile install
roots. Suggested first integration: add this library as a controlled package in
`apps/web/packages/service-cartography`, build and test it separately, and wire
it **only to a synthetic, feature-flagged advisory preview** before any real
service data is processed. Do not change production routes, migrations or payments.

See `docs/INTEGRATION_MAPABLE.md` for the handoff steps and acceptance criteria.

## Participatory governance

Contributors and reviewers should include people with diverse disabilities and
communication preferences. Cost savings and computer-generated scores do not
justify denial of necessary support. Review standards: `docs/RIGHTS_CONTRACT.md`,
`docs/GOVERNANCE.md` and `CONTRIBUTING.md`.

## Authoritative starting references

- [National Disability Insurance Scheme Act 2013, sections 4, 5 and 17A](https://www.legislation.gov.au/C2013A00020/2026-10-01/2026-10-01/text/original/epub/OEBPS/document_1/document_1.html)
- [NDIS Practice Standards Rules 2018, current compilation](https://www.legislation.gov.au/F2018L00631/2026-06-26/2026-06-26/text/original/pdf)
- [United Nations CRPD Article 12](https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities/article-12-equal-recognition-before-the-law.html)
- [OAIC Australian Privacy Principles Guidelines](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines)

These links are background references, not an assurance or legal certification.
Their currency must be checked before a real-world launch.
