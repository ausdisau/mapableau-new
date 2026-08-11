# MapAble Access Infrastructure

**Status:** foundational framework / documentation / schema contracts  
**Public claim:** none — not a live national registry, certification scheme, or universal accessibility score  
**Programme home:** Living Access Fabric (`docs/access-intelligence-next/`) implements compilers and projections against this framework

## Proposition

> **MapAble Access Infrastructure is a person-controlled, evidence-backed system for describing access requirements, describing the capabilities of environments and services, and determining how people can complete journeys and participate in Australian community life.**

Short form: **MapAble makes access computable — without reducing people to a score.**

## Definition of access

A person's practical ability to **enter, understand, navigate, use, participate in and safely leave** an environment, service, journey or digital system on terms consistent with their own requirements, preferences, dignity and autonomy.

Access is the interaction of:

**Person + task + environment + service + information + support + time + journey context.**

It is not synonymous with wheelchair access, and it is not merely standards compliance.

## Doctrine (non-negotiable)

1. **Access is personal** — never assume one definition works for everyone.
2. **Access is contextual** — requirements depend on activity and journey.
3. **Access is evidence** — replace vague labels with observable capabilities and provenance.
4. **Access is end-to-end** — a usable destination is useless if the person cannot reach it.
5. **Access enables participation** — the goal is work, study, travel, healthcare, social life and community participation on the person's own terms.

## ACCESS Framework

| Letter | Principle | Meaning |
| --- | --- | --- |
| **A** | Agency and autonomy | The person controls requirements, disclosure, assistance and decision-making |
| **C** | Capability requirements | Functional requirements, not diagnosis labels, drive matching |
| **C** | Context | Criticality, timing, activity and disclosure scopes on every requirement |
| **E** | Environment capability | Machine-readable what an entity provides — not a single rating |
| **S** | Supports and adjustments | Four-state compatibility including adjustment paths |
| **S** | Source, safety and assurance | Provenance, confidence, freshness and dispute status on every claim |

See [ACCESS_FRAMEWORK.md](./ACCESS_FRAMEWORK.md).

## Canonical technical objects

| Object | Role |
| --- | --- |
| `AccessRequirement` | Participant-selected functional need (passport attribute) |
| `AccessCapability` | What an entity (place, vehicle, service, workplace…) provides |
| `AccessObservation` | Evidence for a capability claim |
| `AccessAdjustment` | Agreed alternative that can resolve a barrier |
| `AccessCompatibility` | Contextual match result (never a universal score) |
| `AccessJourney` | Whole-of-journey segment graph from preparation to return |

See [SCHEMA.md](./SCHEMA.md), [ONTOLOGY.md](./ONTOLOGY.md), [API_CONTRACTS.md](./API_CONTRACTS.md).

## Ownership (constitution)

| Concept | Owner | Notes |
| --- | --- | --- |
| Public place identity | `AccessPlace` | C-011 — never create a second place SoT |
| Presentation preferences | `AccessibilityProfile` | UI / digital prefs — not functional matching SoT |
| Functional requirements | `AccessPassport` | C-010 — participant-controlled |
| Evidence provenance | `AccessEvidenceEnvelopeRecord` + `AccessObservation` | Append-only; no silent overwrite of places |
| Fit / proof / graph projection | Access Intelligence Next | Shadow / synthetic until promoted |
| Accreditation scores | Presentation layer only | Useful for discovery; **not** access decisions |

## Maturity stages

| Stage | Capability |
| --- | --- |
| 1. Discover | Find places with access information |
| 2. Evidence | Measurements, photos, provenance, confidence |
| 3. Personalise | Apply the person's Access Passport |
| 4. Match | Compatibility and adjustments |
| 5. Journey | End-to-end accessible journey evaluation |
| 6. Coordinate | Arrange transport, supports and adjustments |

## Related docs

- [ACCESS_FRAMEWORK.md](./ACCESS_FRAMEWORK.md)
- [ONTOLOGY.md](./ONTOLOGY.md)
- [SCHEMA.md](./SCHEMA.md)
- [API_CONTRACTS.md](./API_CONTRACTS.md)
- [COMPATIBILITY_ENGINE.md](./COMPATIBILITY_ENGINE.md)
- [CONSENT_AND_DISCLOSURE.md](./CONSENT_AND_DISCLOSURE.md)
- [TRANSPORT_ADAPTER.md](./TRANSPORT_ADAPTER.md)
- [CARE_ADAPTER.md](./CARE_ADAPTER.md)
- [JOBS_ADAPTER.md](./JOBS_ADAPTER.md)
- [MIGRATION.md](./MIGRATION.md)
- [ACCESSIBILITY_ACCEPTANCE.md](./ACCESSIBILITY_ACCEPTANCE.md)
- [ADR-001-access-infrastructure-core.md](./ADR-001-access-infrastructure-core.md)
- [GOVERNANCE.md](./GOVERNANCE.md)
- [../access-intelligence-next/README.md](../access-intelligence-next/README.md)
- [../strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md) (Lane 4 Infrastructure)
- [../convergence-os/CONSTITUTION.md](../convergence-os/CONSTITUTION.md) (C-010 / C-011 / C-012)

## Feature flags (defaults OFF)

| Flag | Purpose |
| --- | --- |
| `MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED` | Master switch |
| `MAPABLE_ACCESS_PASSPORT_ENABLED` | Passport / requirements / disclosure writers |
| `MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED` | Compatibility evaluate/persist |
| `MAPABLE_ACCESS_JOURNEY_ENGINE_ENABLED` | Whole-journey persistence |
| `MAPABLE_ACCESS_TRANSPORT_COMPATIBILITY_ENABLED` | Transport vertical slice |
| `MAPABLE_ACCESS_CARE_MATCHING_ENABLED` | Care adapter (Phase 3) |
| `MAPABLE_ACCESS_JOBS_COMPATIBILITY_ENABLED` | Jobs adapter (Phase 4) |
| Cross-vertical orchestration | Hard-off until Phase 5 |

## Australian policy anchors (citation only)

This framework is informed by ABS SDAC 2022, Australia's Disability Strategy (social model), AIHW functioning/disability framing, the Whole Journey Guide, DDA 1992, Premises Standards 2010, Transport Standards 2002 (reform ongoing), and WCAG 2.2 AA digital baselines. MapAble does **not** claim legal compliance certification through this infrastructure.
