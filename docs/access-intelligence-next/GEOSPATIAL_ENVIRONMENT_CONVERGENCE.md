# MapAble Intelligent Geospatial Environment — Repository Convergence

**Status:** proposed convergence architecture; documentation only  
**Claim state:** proposed / in-development composition of existing capabilities  
**Production activation:** none  
**Public coverage claim:** none  
**Repository baseline:** `main` as inspected 2026-09-13

## Decision

The intelligent geospatial environment is **not a new parallel MapAble platform**.

It is the participant-facing composition of the repository's existing canonical access domains:

1. **Access Infrastructure** — evidence, requirements, capabilities, compatibility and journeys.
2. **Living Access Fabric / Access Intelligence Next** — deterministic read projection, evidence compilation, temporal state and proof-carrying results.
3. **MapAble Go / Navigate** — personalised, evidence-aware route planning and route selection.
4. **Accessibility Data Fabric** — governed admission, licensing, normalisation and provenance for external datasets.
5. **Existing MapLibre map stack** — geospatial presentation, with list/non-map parity.
6. **A future Inclusion Observatory** — aggregate, non-person-scoring projection for community access gaps and infrastructure planning.

The product proposition remains:

> **MapAble makes access computable without reducing people to a score.**

The intended user outcome is to help a person answer:

> Can I get there, enter, move around, communicate, use the facilities, participate in what I am going there to do, and get home — given my selected access requirements and what is known about conditions now?

## Why this is convergence, not a new architecture

The repository already contains most of the required primitives:

- `AccessPlace` owns public-place identity.
- `AccessPassport` owns participant-selected functional requirements.
- `AccessObservationRecord` and evidence envelopes preserve provenance.
- `AccessCapability` describes what places, paths, vehicles, services and other entities provide.
- `AccessCompatibility` evaluates contextual fit rather than a universal accessibility score.
- `AccessJourney` and journey segments represent end-to-end participation.
- Access Intelligence Next provides the Living Access Graph and deterministic proof/fit projections.
- `lib/access/navigate/` already implements constraint-aware graph routing.
- `lib/go/route-service.ts` already produces multiple route options with evidence explanations and persists participant route choices.
- the repository uses MapLibre GL + OpenStreetMap for its primary web map stack.

Creating a second `Place`, passport, evidence store, map engine, routing engine or accessibility scoring system would violate current repository ownership rules and create conflicting sources of truth.

---

## Concept-to-repository mapping

| Product concept | Canonical repository home | Current state | Convergence decision |
| --- | --- | --- | --- |
| **AccessGraph** | `lib/access/infrastructure/**`, `AccessPlace`, `AccessObservationRecord`, place-graph APIs | In development; technical proof exists behind flags | Extend the existing graph. Do not create a second graph SoT. |
| **Access Twin** | `lib/access/intelligence-next/**`, Living Access Graph, Temporal Access Engine | Synthetic/shadow projection | Treat the community-scale twin as a **temporal read projection** over canonical evidence, not a second writable twin database. |
| **Detailed venue / indoor twins** | `AccessFloorPlan`, indoor platform, Epic 05 Accessibility Digital Twins | R&D / deferred | Keep as evidence-backed venue/precinct spatial detail linked to `AccessPlace`; public publication requires human review. |
| **Personal Access Fit Engine** | `AccessPassport`, Personal Access Compiler, Access Compatibility | Foundation exists, flag-gated | Compile participant-selected functional requirements into deterministic compatibility constraints. |
| **MapAble Navigate** | `lib/access/navigate/**`, `lib/go/**`, Journey Preflight | In development; current Go route service uses sandbox graph | Extend existing engine from sandbox to verified live graph behind an explicit flag. |
| **Evidence Exchange** | `lib/access/data-sources/**`, source registry, observation APIs, Access Integration Gateway seams | Registry foundation merged; first real ingestion PR open | Add exact dataset adapters incrementally; preserve licence/provenance/conflicts. |
| **Community Evidence** | observation APIs, Access Quests / field-validation seams | Partial / gated | Feed the same graph with moderation, privacy and correction workflows. |
| **Inclusion Observatory** | **New read-only aggregate projection** over governed open/cleared evidence | Not implemented | Create only after privacy/data-lane controls; never score individual disabled people. |
| **Participant-facing environment** | `/access`, existing MapLibre components, future Go/Navigate handoff | Partial | Compose existing surfaces into an Accessible Outing Planner rather than expose internal architecture terminology. |

---

## Canonical ownership rules

These rules are mandatory for this programme.

### Public place identity

`AccessPlace` remains the only canonical public-place identity.

Imported datasets may create **pending moderation candidates** through governed ingestion, but must not silently establish a second place catalogue.

### Functional access requirements

`AccessPassport` remains the participant-controlled source for functional requirements used in matching and routing.

Do not derive requirements from diagnosis labels.

`AccessibilityProfile` remains presentation/digital-preference state and must not become the functional matching source of truth.

### Evidence

Evidence is append-only and provenance-aware.

An observation may be:

- community reported;
- venue reported;
- assessor observed;
- independently verified where the workflow permits it;
- machine inferred and explicitly unverified;
- expired/outdated;
- disputed/conflicting;
- unknown.

**Unknown never means inaccessible, and unknown never means accessible.**

### Compatibility

Compatibility is contextual to:

- participant-selected requirements;
- activity;
- route/journey;
- timing;
- known temporary conditions;
- acceptable adjustments;
- evidence quality and freshness.

Do not persist a universal venue-accessibility score as truth.

### Accreditation

Accreditation may be shown as a discovery/presentation signal only.

It must not override feature-level evidence or be treated as a personal compatibility decision or legal-compliance certification.

---

## Target runtime composition

```text
External open / authorised datasets
Council and transport GIS
Venue/operator assertions
Community observations
Assessor evidence
Governed machine-derived proposals
            |
            v
Accessibility Data Source Registry
  licence + attribution + admission gate
            |
            v
Dataset / integration adapters
  normalise + fingerprint + source identity
            |
            v
Access Infrastructure
  AccessPlace
  AccessObservation
  AccessCapability
  provenance / freshness / conflicts
            |
            v
Living Access Fabric
  ontology
  AQL
  temporal state
  Living Access Graph
  proof-carrying projections
       /                 \
      v                   v
Personal Access       Inclusion Observatory
Compiler / Fit        aggregate access gaps only
      |
      v
MapAble Navigate / Go
  hard constraints
  soft preferences
  temporary barriers
  uncertainty cost
  route alternatives
      |
      v
Participant-facing Accessible Outing Planner
  compare -> explain -> choose -> travel -> report
```

Application services remain the only authorised writers. Models may draft, classify or explain but do not self-promote evidence, publish observations, grant consent or execute consequential actions.

---

## Accessibility Data Fabric

The data layer should be federated rather than assuming one national accessibility dataset.

### Existing source classes

Reuse the current constitutional source zones:

- **OPEN_EVIDENCE** — public or openly reusable environmental/system evidence where exact reuse terms permit operational ingestion.
- **CONTROLLED_RESEARCH** — secure research assets; only disclosure-cleared aggregate findings may cross the research firewall.
- **PARTICIPANT_CONTROLLED** — purpose-bound personal information; never part of bulk external data ingestion.

### Dataset admission contract

Every operational dataset must have an exact dataset-level record when reuse terms vary below portal level.

The admission layer must fail closed when:

- a source is controlled research;
- participant-controlled personal information is presented to bulk ingestion;
- dataset-level reuse terms have not been established;
- operational import is not explicitly enabled;
- required licence metadata is missing; or
- required attribution is missing.

### Provenance envelope

Imported assertions should be able to carry:

- `dataSourceId`;
- publisher/source record identifier;
- source URI;
- retrieval timestamp;
- observation timestamp where known;
- content hash;
- licence identifier;
- attribution;
- verification state;
- confidence where used;
- machine-derived indicator;
- import/adapter version.

### Conflict behaviour

Preserve:

- `CREATE` — new assertion;
- `DUPLICATE` — same record and content;
- `SUPERSEDE` — source record changed upstream;
- `CONFLICT` — another source asserts a materially different value.

A conflict is evidence to surface and review, not permission to discard inconvenient observations.

### Immediate ingestion dependency

PR #586 (`feat/access-nptm-access-graph-ingestion`) is the first real dataset ingestion proof and should remain the first operational convergence target.

Do not implement another National Public Toilet Map importer in this programme.

After that slice is reviewed, additional adapters can be considered individually for:

- OpenStreetMap pedestrian/access attributes;
- exact Transport for NSW datasets after dataset-level reuse terms are registered;
- GTFS / GTFS-Realtime where licensing, semantics and service quality are established;
- local council GIS layers such as paths, kerb ramps, crossings, accessible parking and civic facilities;
- venue/operator access information;
- community/field observations.

A portal URL alone is not ingestion authorisation.

---

## Access Twin definition

For community-scale access intelligence, **Access Twin** is a product concept, not a second storage authority.

It is a time-aware projection of:

- place identity;
- feature-level capabilities;
- paths and route segments;
- entrances and indoor/precinct detail when available;
- transport access evidence;
- facilities;
- temporary barriers and outages;
- evidence confidence/freshness;
- conflicting observations;
- service and participation context where permitted.

### Temporal states

The projection should be capable of distinguishing:

- currently supported by fresh evidence;
- likely stale;
- temporarily unavailable;
- reported changed and awaiting review;
- conflicting;
- unknown/not assessed.

### No duplicate twin SoT

The Living Access Fabric reads canonical domain records and compiles a view suitable for reasoning.

Detailed indoor or sector twins under Epic 05 remain linked spatial models and evidence artefacts; they do not replace `AccessPlace`, evidence or participant requirements.

---

## Personal Access Fit

The system evaluates **person-selected functional requirements**, not diagnoses and not presumed capability.

Examples include:

- step-free route required;
- minimum clear width;
- maximum acceptable gradient;
- kerb ramp requirement;
- surface types to avoid;
- accessible toilet required;
- Changing Places required;
- lift access required;
- minimise transfers;
- sensory environment preferences;
- hearing augmentation preference;
- communication access;
- assistance-animal access;
- selected support/assistance arrangements.

### Compatibility states

Reuse the canonical four-state vocabulary:

- `compatible`;
- `compatible_with_adjustment`;
- `uncertain`;
- `incompatible`.

The user interface should explain **why** rather than display an opaque score.

### Dignity of risk

The engine must not decide whether a person is allowed or capable of making a journey.

A preferred explanation is:

> This route includes a segment steeper than your selected preference. A longer alternative avoids that segment.

The participant chooses.

---

## Navigate convergence

`lib/access/navigate/route-planner.ts` and `scoring.ts` are the canonical pedestrian/access routing core for this programme.

They already implement:

- graph routing;
- stairs exclusion;
- minimum-width constraints;
- maximum-slope constraints;
- kerb-ramp checks;
- avoided surfaces;
- unknown/low-confidence policy;
- uncertainty penalties;
- temporary barrier exclusion;
- multiple objectives.

### Current boundary

`lib/go/route-service.ts` currently calls `getSandboxGraph()` and returns `isLiveEvidence: false`.

This is the most important engineering boundary between the existing demonstrator and the desired intelligent geospatial environment.

### Target route strategies

Keep multiple explainable strategies rather than one claimed "best" route:

- **Reliable** — highest useful evidence confidence/freshness;
- **Easier** — lower physical demand against the selected profile;
- **Simpler** — fewer transfers/decision points where data supports it;
- **Fastest accessible** — shortest candidate that passes hard constraints, with uncertainty surfaced;
- optional user-defined strategy later.

### Cost model

Conceptually:

```text
route_cost =
  travel_cost
  + soft_access_penalties
  + evidence_uncertainty
  + temporary_disruption_risk
  + transfer_complexity
```

Hard constraints exclude a segment before ranking.

Low-confidence or stale evidence must never be silently upgraded to "verified accessible" just to complete a route.

---

## End-to-end journey model

The planner should reason across the whole participation chain, for example:

```text
home
 -> local path
 -> kerb ramp
 -> crossing
 -> transit stop
 -> accessible vehicle / service
 -> interchange
 -> lift
 -> destination path
 -> entrance
 -> internal route
 -> facilities
 -> activity
 -> return journey
```

A destination may have excellent internal access while the journey to it contains an unresolved barrier. The UI must expose that distinction.

Use `AccessJourney` and journey segments rather than introducing a new itinerary source of truth.

---

## Inclusion Observatory

The Inclusion Observatory is the principal **new** domain in this convergence.

It should be a read-only aggregate analytical projection, not a participant risk or vulnerability engine.

### Purpose

Help councils, communities, advocates, planners and MapAble identify structural barriers such as:

- inaccessible or disconnected pedestrian networks;
- missing kerb-ramp/crossing evidence;
- accessible toilet and Changing Places coverage gaps;
- gaps between accessible public transport and community destinations;
- areas with high volumes of unknown/stale access information;
- service-access deserts;
- accessible employment/recreation/community participation opportunity gaps;
- recurring barrier/disruption patterns;
- infrastructure remediation opportunities.

### Prohibited uses

The Observatory must not:

- score an individual's disability, vulnerability, worth or likely compliance;
- expose participant route histories;
- map controlled-research microdata;
- join research microdata to MapAble user IDs;
- infer that low complaint rates mean discrimination is absent;
- make automated legal-breach determinations;
- rank neighbourhoods with one opaque universal "accessibility score".

### Output model

Prefer domain profiles and transparent denominators, for example:

```text
Pedestrian network evidence       74% observed / 52% fresh
Step-free civic destinations      68% supported by current evidence
Accessible toilet coverage        41% within selected catchment
Transport-to-destination chain    57% complete
Unknown / unassessed evidence      29%

Critical evidence gap:
No current Changing Places evidence within the selected catchment.
```

Aggregate population or rights evidence may be used only through the applicable source/data-governance rules.

### Hard dependency

Do not implement person-linked Observatory analytics before the mobility/privacy data-lane work is complete.

For an initial Observatory slice, use only open environmental evidence and disclosure-cleared aggregates.

---

## Participant-facing product: Accessible Outing Planner

The smallest coherent participant-facing vertical slice should be an **Accessible Outing Planner** inside the existing Access/Go experience.

### Flow

1. Search/select a destination using canonical `AccessPlace`.
2. Load participant-selected functional requirements from the authorised access profile/passport path.
3. Present feature-level destination evidence with status, date and limitations.
4. Produce several route alternatives from the existing Navigate engine.
5. Explain hard-constraint conflicts, uncertainty, stale data and temporary disruptions.
6. Provide a non-map list/step representation with equivalent essential information.
7. Let the participant select a route; selection remains theirs.
8. During or after the journey, allow reporting/correction through the governed evidence workflow.
9. Record journey outcome only with an explicit purpose and privacy boundary; outcome does not become a universal assumption about other users.

### Destination card example

```text
Community Library

Fit against your selected requirements: compatible with one unknown segment

Step-free entrance       Verified — observed 2026-08-21
Entrance clear width     910 mm — measured
Accessible toilet        Verified
Quiet space              Venue reported
Path from nearest stop   1 segment not assessed

[Compare journeys]
[Show evidence]
[Report a change]
```

Do not use colour alone for evidence state.

---

## UI / map architecture

Extend the existing MapLibre stack; do not introduce a competing map framework for this programme.

### Map responsibilities

Map-space geometry:

- route polylines;
- paths;
- precinct/venue geometry where available;
- catchments and analytical areas.

Screen-stable UI:

- barrier/evidence icons;
- confidence/verification badges;
- selected-location indicators;
- labels and interactive controls.

### Accessibility requirements

Every critical map interaction requires an equivalent non-map route:

- destination results as list/cards;
- route alternatives as ordered steps;
- evidence details as structured text/table;
- previous/next controls where dense map features need sequential inspection;
- keyboard and screen-reader operation;
- visible focus;
- 44x44 CSS pixel or larger critical targets;
- zoom/reflow without loss of function;
- reduced-motion behaviour;
- no colour-only status;
- plain-language explanations;
- AAC-compatible text interaction;
- human assistance path.

Automated accessibility checks are necessary but not sufficient; manual assistive-technology and lived-experience testing remains a release gate.

---

## Existing APIs and services to reuse

### Evidence / graph

- `POST /api/access-infrastructure/observations`
- `GET /api/access-infrastructure/observations`
- `GET /api/access-infrastructure/graph/places/[placeId]`
- `GET /api/access-intelligence-next/graph`

### Journey intelligence

- existing Access Intelligence Next journey-preflight APIs/surfaces;
- proof-carrying result vocabulary;
- temporal/change-review infrastructure.

### Participant routing

- `POST /api/go/routes/plan`
- Go route-plan persistence and selection;
- access-navigation route APIs as they converge under the existing plan.

Do not introduce public versioned APIs merely to satisfy this document. Public/enterprise API work remains a separate governed programme.

---

## Current evidence ledger

| Capability | Claim state | Repository evidence | Consequence |
| --- | --- | --- | --- |
| MapLibre/OSM map stack | Implemented | existing map components/dependencies | Reuse; no new map engine. |
| Access Infrastructure doctrine/schema | Implemented foundation | `docs/access-infrastructure/**`, `lib/access/infrastructure/**` | Canonical model. |
| Access Graph technical proof | In development; G3 engineering complete | `docs/innovation/E01_ACCESS_GRAPH_G3_STATUS.md` | Keep behind flags; no national/live claim. |
| Living Access Fabric | Synthetic/shadow | `docs/access-intelligence-next/**` | Use as read/fit projection; no production truth claim. |
| Evidence persistence | Optional/gated | Access Intelligence Next persistence | Not automatically production truth. |
| Personal routing engine | In development | `lib/access/navigate/**` | Extend rather than replace. |
| Participant Go routing | In development | `lib/go/route-service.ts` | Current graph is sandbox; live transition is a major gate. |
| External source registry | Implemented foundation | `lib/access/data-sources/registry.ts` | Exact-source admission before ingestion. |
| NPTM ingestion | Open PR #586 | `feat/nptm-access-graph-ingestion` | Reuse/review; do not duplicate. |
| Public transit / council federation | Proposed / partial | adapter seams and roadmap | Verify exact datasets/licences before enabling. |
| Digital twins | R&D | Epic 05 + indoor/floor-plan anchors | Keep evidence-backed and secondary to canonical place/evidence model. |
| Inclusion Observatory | Proposed/new | no concrete implementation found | Build later as aggregate read projection. |

---

## Known inconsistencies to reconcile separately

Some older repository comments/docs still state that `AccessPassport` is absent on `main`, while current code includes Prisma access-passport operations and canonical ownership references.

Do not create a replacement passport to resolve this documentation drift. Treat executable schema/code and the convergence constitution as the higher-authority source, then clean stale comments in a separate focused maintenance change.

---

## Smallest safe implementation sequence

### Slice 0 — this document

Converge terminology and ownership. No runtime change.

### Slice 1 — first real external evidence

Review/finish PR #586 rather than duplicate it.

Exit evidence:

- exact dataset and licence provenance retained;
- idempotent import behaviour;
- duplicate/supersede/conflict tests;
- pending-moderation/publication boundary;
- feature flags off by default;
- no accessibility guarantee derived from government publication alone.

### Slice 2 — live graph provider boundary

Introduce a typed graph-provider interface between Go/Navigate and graph source.

Keep sandbox as fallback and add a disabled-by-default live provider that can read canonical evidence graph segments when sufficient data exists.

Required tests:

- live provider unavailable -> honest fallback/advisory state;
- unknown segment never becomes verified;
- stale/conflicting evidence retained;
- graph source visible in response;
- no route fabricated when hard constraints cannot be satisfied.

### Slice 3 — evidence-aware route convergence

Complete the current personalised-routing plan:

- Reliable / Easier / Simpler / Fastest strategies;
- segment-level evidence snapshots;
- uncertainty and freshness cost;
- temporary outage/barrier handling;
- route invalidation/reroute.

### Slice 4 — Accessible Outing Planner UI

Compose destination evidence + route choices in the existing participant Access/Go surface.

Map/list parity and manual AT review are mandatory.

### Slice 5 — community change reporting

Use existing observation/quest/gateway seams rather than direct writes to published place truth.

Add correction/dispute workflow and moderation.

### Slice 6 — additional exact data adapters

Prioritise sources that materially improve the pilot geography. Each source receives its own licensing/admission decision and adapter tests.

### Slice 7 — Inclusion Observatory foundation

Only after privacy/data-lane boundaries are in place:

- environmental and aggregate read models;
- transparent denominators;
- accessibility-gap layers;
- non-map analytical equivalents;
- no participant scoring or identifiable mobility analytics.

### Slice 8 — detailed twins where justified

Promote Epic 05 only when evidence density, indoor spatial governance and real participant value justify it.

Do not make digital twins a prerequisite for basic Access/Navigate value.

---

## Suggested pilot geography

Use a bounded geography before national graph claims.

The existing Ku-ring-gai Local Access Guide work is a suitable candidate because it already models list-first place evidence and explicit unknown states, but pilot selection still requires product/co-design approval and sufficiently licensed source data.

A pilot should be measured by journey usefulness and evidence quality, not by the number of map pins.

---

## Acceptance tests for the geospatial environment

### Evidence safety

- Unknown does not resolve to accessible or inaccessible.
- AI/machine-derived evidence cannot self-promote to verified.
- Conflicting observations remain visible and do not silently overwrite one another.
- Expired observations surface as stale/outdated.
- Every external assertion retains source/licence/attribution metadata where required.

### Personal fit

- Required constraints are never relaxed by ranking or model explanation.
- Soft preferences alter ranking, not hard eligibility.
- Diagnosis is not required for functional matching.
- Adjustments can change a result to `compatible_with_adjustment` only when the adjustment is explicit and evidenced.

### Routing

- Stairs exclusion works where stairs are disallowed.
- Minimum width and slope constraints work.
- Temporary barriers/outages can invalidate a route.
- Low-confidence/stale evidence incurs uncertainty or exclusion according to policy.
- No viable route returns an honest no-route/advisory state.
- Route explanations identify important unknowns and sources.

### Accessibility UX

- Map has list/step parity.
- Essential meaning does not rely on colour.
- Full keyboard operation and visible focus.
- Screen-reader semantics and live updates.
- 200%+ text zoom/reflow; target 400% review for critical surfaces.
- Reduced-motion support.
- 44x44 CSS pixel or larger critical targets.
- Voice control is optional, never required.
- AAC/text interaction remains first-class.
- Manual AT/lived-experience testing before participant-facing pilot.

### Privacy / rights

- Participant passport fields remain private unless purpose-bound disclosure is authorised.
- Aggregate analytics cannot expose individual route histories.
- Controlled-research microdata cannot enter operational stores.
- Supporter/delegate access is scoped, time-bounded and revocable.
- The participant remains the decision owner for route/activity choice.

---

## Release gates

Do not promote this programme to a public "intelligent national accessibility map" claim until evidence supports that wording.

At minimum require:

1. disability-led co-design evidence for the participant-facing journey;
2. rights/privacy review;
3. technical proof using non-synthetic environmental evidence;
4. a controlled pilot with rollback and monitoring;
5. manual assistive-technology and lived-experience testing;
6. evidence-quality/freshness metrics;
7. incident/correction/support ownership;
8. explicit geographic/data-coverage disclosure.

Feature flags remain fail-closed until the relevant gate is approved.

---

## Non-goals

This convergence does **not** authorise:

- a universal accessibility score;
- disability, vulnerability or capacity scoring;
- automatic legal-compliance findings;
- automated accreditation;
- AI publication of verified evidence;
- AI relaxation of participant hard constraints;
- national accessibility or route-coverage claims;
- silent location tracking;
- participant-level commercial/research analytics;
- production use of controlled research microdata;
- replacement of vehicle-routing services with pedestrian Navigate;
- a second `AccessPlace`, passport, evidence store, map engine or routing engine.

---

## Repository next decision

The next engineering decision is **not** whether to build another geospatial platform.

It is whether the evidence graph is ready to become a bounded live input to the existing Navigate/Go routing stack for one controlled geography.

Until that is proven, keep:

- source ingestion incremental;
- live-routing flags off;
- sandbox/synthetic labels explicit;
- participant-facing claims conservative;
- map/list evidence transparent.
