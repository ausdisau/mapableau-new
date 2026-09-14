# MapAble Essential Services Registry Design

**Date:** 2026-09-14  
**Status:** Approved design direction; implementation follows only after written-spec review  
**Repository:** `ausdisau/mapableau-new`  
**Design base:** `f25ad3d4368ed17ec1cafac73cf53fd8d07b0152`  
**Primary delivery path:** C -> B -> A  
**Claim state:** Proposed unless a section explicitly says Verified live, Implemented not independently verified, In development, or Historical.

## 1. Decision

Build the **MapAble Essential Services Registry (ESR)** as a shared MapAble Core capability that lets a person with disability record the services, devices, people, infrastructure and fallback arrangements their daily life depends on; understand the functional impact of a disruption; and activate participant-controlled continuity options without creating a surveillance system, diagnosis-based vulnerability score, or automated emergency authority.

The first implementation remains inside `mapableau-new` (Stage C), uses existing MapAble identity, consent, delegation, audit and mobile foundations, and is deliberately designed for later extraction into reusable Australian Disability Ltd packages (Stage B) and selectively self-controlled infrastructure (Stage A).

## 2. Current repository state and evidence ledger

| Item | Claim state | Current evidence | Confidence | Design consequence |
|---|---|---|---|---|
| MapAble web platform | Verified live in repository | `apps/web` is the web platform in the current unified repository | High | ESR web surfaces should follow existing web/API conventions rather than create a second web app |
| MapAble Companion | Implemented, not independently verified | `apps/companion` is an Expo foundation with auth, Communication Passport sync, encrypted offline Visit Pack intent, notifications, device enrolment/revocation and Stop AURA | High | Extend `apps/companion`; do not create another mobile product |
| Mobile contracts | Implemented, not independently verified | `mobile-contracts/` defines shared Zod contracts and accessibility principles | High | ESR contracts must live in shared schemas, not mobile-only types |
| Consent, delegation and audit | Implemented / in development depending path | Existing MapAble Core consent, disclosure receipt, delegate and audit patterns | High | Reuse MapAble Core; no duplicate permission ledger |
| Foreground location | Implemented, not independently verified | Browser geolocation helpers exist in the current repository | High | Foreground location can be adapted later; it is not an R1 dependency |
| PostGIS | Not implemented | Repository architecture documents explicitly say PostGIS is not currently used | High | R1 uses ordinary relational storage; PostGIS enters only when spatial query value is proven |
| Persistent background location | Proposed | No production persistent location service is established in current evidence | High | Separate feature gate and later native phase |
| Essential Services Registry | Proposed | No existing canonical ESR domain found | High | New Core domain required |
| Secondary Essential Services taxonomy | Proposed policy framework | Disability policy evidence supports continuity problems but not this exact taxonomy | High | Product must distinguish evidence-backed facts from Australian Disability Ltd policy classification |

## 3. Problem

People with disability can depend on combinations of mainstream infrastructure and disability-specific services that are individually treated as separate systems but are functionally linked in daily life.

Examples:

- mobile connectivity may be required for cloud AAC, NRS access, remote support and emergency contact;
- electricity may be required for wheelchair charging, AAC, hoists, environmental controls or respiratory equipment;
- accessible transport may be required to reach healthcare, employment or food;
- a support worker may be required for transfers, meals, toileting, communication support or leaving home;
- a station lift or kerb ramp may be a critical dependency in an otherwise available transport network.

MapAble currently has multiple domain modules that can encounter these dependencies, but no single participant-controlled source of truth describes **what the person relies on, why it matters, what happens if it fails, and what fallback the person has chosen**.

## 4. Product principles

1. **Capability-first, not diagnosis-first.** Model the functions a person needs to carry out and what supports those capabilities.
2. **Participant-controlled.** The person decides what enters the registry, how important it is, who can see it and what fallback is acceptable.
3. **No vulnerability score.** ESR may classify service criticality and functional impact; it must not assign a score to the human being.
4. **Dependency does not imply incapacity.** Needing support, AAC, mobility equipment, family assistance or continuous services never reduces decision-making authority.
5. **Relationship does not imply authority.** Family, supporters, workers and delegates have only the permissions explicitly granted or otherwise lawfully established.
6. **Collection does not imply sharing.** Especially for location, health/safety information and family/support contacts.
7. **Continuity before automation.** The first useful output is a clear participant-owned fallback plan, not autonomous intervention.
8. **Provenance for status.** Every outage/status claim says where it came from and how fresh it is.
9. **Accessible without AI.** Critical flows remain fully usable when AI is unavailable or declined.
10. **Accessible without a smartphone.** Web access remains supported.
11. **Fail closed for regulated actions.** No emergency dispatch, clinical judgement, NDIS entitlement decision or binding service action is created by ESR alone.
12. **C -> B -> A.** Build inside MapAble, extract validated generic contracts, internalise infrastructure only where justified.

## 5. Scope

### 5.1 Release 1 scope

R1 proves one end-to-end participant journey across three capability classes:

- `COMMUNICATION`
- `MOBILITY`
- `PERSONAL_SUPPORT`

R1 supports:

1. create, edit, archive and delete a dependency;
2. describe why it matters in the participant's own words;
3. connect one dependency to one or more capabilities;
4. define one or more participant-chosen fallback options;
5. set service criticality as `ROUTINE`, `IMPORTANT` or `CRITICAL`;
6. manually report a status observation;
7. deterministically compute which registered capabilities may be affected;
8. show the relevant continuity plan;
9. create auditable events for material changes;
10. manage sharing/permissions using existing Core controls;
11. generate an offline Essential Service Card for the Companion app;
12. support accessible web and native presentations over the same semantic contracts.

### 5.2 Explicitly out of scope for R1

- continuous background location;
- automatic utility outage feeds;
- automatic telco outage feeds;
- direct NRS, Triple Zero, NSW or Victoria emergency integration;
- NDIS plan retrieval or funding decisions;

Any future NDIS-related integration or funding logic is time-sensitive and must be verified against current official NDIA/NDIS Commission sources at implementation time; this specification does not establish current NDIS entitlement, claimability, registration or API access.
- predictive human-risk scoring;
- clinical monitoring;
- automatic family/supporter notification;
- automatic replacement-worker dispatch;
- automatic emergency escalation;
- PostGIS migration;
- autonomous AI action;
- production enablement of unverified regulated integrations.

## 6. Canonical terminology

### Capability

A function or outcome the person wants or needs to maintain, such as communicating, moving, eating, transferring, accessing healthcare, leaving home or charging essential equipment.

### Dependency

A service, device, person, infrastructure element or resource that the participant identifies as contributing to a capability.

### Dependency edge

A directed relationship showing that one registered item depends on another.

Example:

`AAC communication -> cloud AAC service -> mobile internet`

### Service criticality

Participant-selected importance of the dependency to continuity:

- `ROUTINE` — interruption is inconvenient but normally tolerable;
- `IMPORTANT` — interruption materially affects participation or daily functioning and a fallback may be needed;
- `CRITICAL` — the participant has identified that interruption requires prompt continuity action.

These labels describe the **service dependency**, not the person's worth, capacity, vulnerability or eligibility.

### Status observation

A time-bounded claim about service availability with source, timestamp, freshness and provenance.

### Continuity plan

The participant-controlled set of fallback options and preferred actions for a dependency or affected capability.

### Essential Service Card

A deliberately minimal, offline-capable subset of the participant's chosen continuity information for use when connectivity or a normal service is unavailable.

### Secondary Essential Service

A **Proposed** Australian Disability Ltd policy classification for a service that may not be classified as primary infrastructure but whose interruption can prevent a person with disability from accessing essential functions or primary services.

The product must never present this proposed classification as an existing government legal designation unless future authoritative policy establishes it.

## 7. Architectural ownership

### 7.1 MapAble Core remains authoritative for

- identity;
- roles and organisation membership;
- participant/delegate relationships;
- consent and purpose;
- disclosure receipts;
- audit events;
- messaging/notification policy;
- complaints/incidents where applicable;
- accessibility and communication preferences;
- feature flags.

ESR must not create competing versions of these systems.

### 7.2 ESR owns

- capability records;
- dependency records;
- dependency edges;
- service criticality;
- continuity plans and fallback options;
- status observations;
- deterministic dependency-impact calculation;
- ESR-specific evidence/provenance;
- Essential Service Card projection;
- ESR-specific participant sharing views.

### 7.3 Domain modules consume ESR through adapters

Potential consumers include:

- Navigate;
- Transport;
- Care;
- Personal Agency / My MapAble;
- Companion;
- future Open Emergency Communications Fabric (OECF).

No consumer receives unrestricted registry access. Each adapter requests a purpose-limited projection.

## 8. Proposed repository structure

```text
mapableau-new/

lib/
  essential-services/
    domain/
      capability.ts
      dependency.ts
      continuity.ts
      status.ts
      errors.ts
    graph/
      dependency-graph.ts
      impact-engine.ts
    permissions/
      policy.ts
      projections.ts
    continuity/
      plan-service.ts
      card-projection.ts
    status/
      observation-service.ts
      freshness.ts
    evidence/
      provenance.ts
    audit/
      events.ts

app/
  my/
    essentials/
      page.tsx
      dependency/
      continuity/
      sharing/

  api/
    essential-services/
      dependencies/
      capabilities/
      continuity/
      status/
      card/

mobile-contracts/
  schemas/
    essential-services.ts

apps/
  companion/
    src/
      essential-services/
        screens/
        components/
        storage/
        sync/
        notifications/

components/
  essential-services/

tests/
  essential-services/
  a11y/
```

Exact paths may be adjusted during implementation to follow directly inspected current patterns, but the ownership boundaries above are normative.

## 9. Domain model

### 9.1 EssentialCapability

Purpose: record a participant-defined functional capability supported by one or more dependencies.

Proposed fields:

```text
id
principalId
kind
label
participantDescription
status
createdAt
updatedAt
archivedAt?
```

R1 `kind` enum:

```text
COMMUNICATION
MOBILITY
PERSONAL_SUPPORT
```

Future kinds may include `HEALTH`, `ENERGY`, `TRANSPORT`, `FOOD`, `HOUSING`, `SAFETY`, but these are not required in R1.

### 9.2 EssentialDependency

```text
id
principalId
name
category
criticality
participantDescription
providerOrganisationId?
externalReference?
status
createdAt
updatedAt
archivedAt?
```

R1 dependency categories:

```text
SERVICE
DEVICE
PERSON_SUPPORT
INFRASTRUCTURE
RESOURCE
```

### 9.3 EssentialDependencyLink

```text
id
principalId
fromType
fromId
toType
toId
relationship
createdAt
```

R1 relationships:

```text
REQUIRES
SUPPORTS
BACKUP_FOR
```

The graph must be acyclic for `REQUIRES` relationships in R1. Cycles return a typed validation error.

### 9.4 ContinuityPlan

```text
id
principalId
dependencyId?
capabilityId?
title
participantInstructions
status
createdAt
updatedAt
```

### 9.5 ContinuityAction

```text
id
planId
kind
label
instructions
priority
requiresExternalExecution
requiresParticipantConfirmation
contactRef?
resourceRef?
```

R1 `kind` values:

```text
USE_BACKUP
CONTACT_PERSON
CONTACT_PROVIDER
USE_OFFLINE_RESOURCE
CHANGE_ROUTE
HUMAN_HELP
OTHER
```

R1 actions are recommendations/instructions only. `requiresExternalExecution=true` is descriptive metadata; ESR does not execute the external action.

### 9.6 ServiceStatusObservation

```text
id
principalId
dependencyId
status
sourceType
sourceReference?
observedAt
receivedAt
expiresAt?
confidence
notes?
createdByPrincipalId?
```

Status:

```text
AVAILABLE
DEGRADED
UNAVAILABLE
UNKNOWN
```

Source type:

```text
OFFICIAL
PROVIDER_REPORTED
PARTICIPANT_REPORTED
COMMUNITY_REPORTED
SYSTEM_OBSERVED
```

Confidence:

```text
VERIFIED
CORROBORATED
UNVERIFIED
```

R1 manual participant observations use `PARTICIPANT_REPORTED`. No manual report is silently relabelled `OFFICIAL`.

## 10. Deterministic impact engine

The impact engine answers:

> Given one or more current status observations, which registered capabilities or downstream dependencies may be affected?

It must not answer:

> How vulnerable is this person?

### 10.1 Inputs

- participant-scoped capability graph;
- latest usable status observation per dependency;
- freshness policy;
- active continuity plans.

### 10.2 Outputs

```text
AffectedCapability {
  capabilityId
  impactState
  causes[]
  staleEvidence[]
  continuityPlanIds[]
}
```

`impactState`:

```text
UNAFFECTED
POSSIBLY_AFFECTED
AFFECTED
UNKNOWN
```

### 10.3 Core rules

1. `UNAVAILABLE` on a directly required dependency propagates `AFFECTED` to its downstream capability unless another active dependency relationship explicitly satisfies the same requirement.
2. `DEGRADED` propagates `POSSIBLY_AFFECTED` unless deterministic domain logic says otherwise.
3. Expired observations do not remain active; they produce `UNKNOWN` or fall back to a newer valid observation.
4. `COMMUNITY_REPORTED` and `UNVERIFIED` status cannot be represented as an official outage.
5. The engine never changes service criticality.
6. The engine never triggers emergency services.
7. The engine never changes delegate authority.
8. The engine may surface a continuity plan but cannot execute consequential actions.

## 11. Status freshness and provenance

Every status display must show, programmatically and visually:

- current state;
- source type;
- observed time;
- freshness or expiry;
- verification state where relevant;
- correction/report path.

Examples:

```text
Unavailable
Reported by you 8 minutes ago
```

```text
Possible disruption
Community report; not verified
```

```text
Status unknown
Last observation expired 2 hours ago
```

Stale data must never be silently presented as current.

## 12. Participant journeys

### 12.1 Create a dependency

1. Participant opens **My Essentials**.
2. Participant chooses a capability or creates one in R1 supported categories.
3. Participant names the service/device/support in their own language.
4. Participant optionally adds why it matters.
5. Participant selects service criticality.
6. Participant defines one or more fallback options or explicitly chooses `No fallback recorded`.
7. Participant reviews what will be stored and who can access it.
8. Save creates the dependency, relevant links and an audit event.

No diagnosis field is required.

### 12.2 Report a disruption

1. Participant opens dependency.
2. Chooses `Available`, `Degraded`, `Unavailable`, or `I am not sure`.
3. Optional plain-language note.
4. Status observation is recorded with provenance.
5. Impact engine recomputes affected capabilities.
6. Participant sees the selected continuity options.
7. Participant may dismiss, edit status, or ask for human help.

### 12.3 Review a continuity plan

1. Participant sees the affected capability.
2. System shows the participant's own stored fallback instructions first.
3. Optional system suggestions are separately labelled and cannot overwrite participant instructions.
4. Any contact/share action passes Core permission checks.
5. Participant can update, cancel or stop sharing.

### 12.4 Supporter/delegate access

1. Supporter signs in under their own identity.
2. ESR queries existing delegation/consent scopes.
3. UI shows only the projection permitted by those scopes.
4. Relationship label alone never grants access.
5. Revocation removes future access according to existing Core propagation guarantees.

## 13. Web experience

Primary route:

```text
/my/essentials
```

Suggested R1 information architecture:

```text
My Essentials
  Overview
  Capabilities
  Services & devices
  Continuity plans
  Current disruptions
  Sharing & permissions
  Essential Service Card
```

### Web interaction requirements

- full critical flow keyboard operable;
- visible focus;
- screen-reader headings and landmarks;
- no drag-only graph editing;
- dependency graph always has an equivalent structured list/tree presentation;
- status meaning never relies on colour;
- participant can edit/remove any user-entered dependency;
- destructive actions require clear confirmation without timed dialogs;
- human help is always available from critical states.

## 14. React Native / Expo Companion design

### 14.1 Ownership

Extend `apps/companion`; do not create another React Native application for ESR R1.

The Companion remains a native Expo application, not a WebView wrapper.

### 14.2 Mobile navigation

ESR should appear as a bounded feature inside the Companion rather than forcing a wholesale navigation rewrite.

Proposed entry:

```text
Home -> Essentials
```

Feature screens:

```text
EssentialOverviewScreen
EssentialDependencyListScreen
EssentialDependencyDetailScreen
ContinuityPlanScreen
DisruptionReportScreen
EssentialServiceCardScreen
SharingScreen
```

### 14.3 Shared contracts

The mobile app imports the canonical Zod schemas from `mobile-contracts/schemas/essential-services.ts` or the existing shared-contract mechanism adopted by the repository.

Mobile must not redefine:

- criticality enums;
- status enums;
- provenance semantics;
- impact states;
- consent meaning;
- relationship/authority semantics.

### 14.4 Offline storage

R1 offline capability is limited to:

- Essential Service Card;
- current participant-approved continuity plan projection;
- last successful sync metadata.

Sensitive offline data uses the existing encrypted-storage pattern established for Companion Visit Packs. Plain AsyncStorage is not acceptable for sensitive continuity information.

Offline edits to the registry itself are deferred until conflict-resolution semantics are specified and tested.

### 14.5 Notifications

R1 notifications may inform the user about:

- status changes they created on another surface;
- expiration of a temporary share where current notification infrastructure supports it;
- later external disruption adapters when enabled.

Notifications must be redacted by default. Lock-screen notification text must not expose disability, health, support or precise-location details.

### 14.6 React Native performance rules

Performance work follows:

`Measure -> Optimize -> Re-measure -> Validate`

Do not introduce memoisation, alternate state libraries, FlashList or native modules merely by assumption.

For long dependency/status lists, use a virtualized list when measured list size/performance justifies it.

If native location or secure-device functionality later requires a custom module, prefer a narrowly scoped asynchronous Turbo Module with no synchronous heavy work on the JS thread.

## 15. Location integration boundary

Persistent location is not an R1 prerequisite.

ESR defines an interface for future location context:

```text
LocationContextProvider {
  getCurrentPurposeLimitedLocation(purpose)
  getLocationShareState()
}
```

Future modes:

```text
OFF
WHILE_USING_APP
JOURNEY
EMERGENCY
BACKGROUND_OPTIONAL
```

Normative rules:

1. location collection requires a defined purpose;
2. location collection does not imply sharing;
3. precise location is excluded from general ESR projections by default;
4. supporter/family relationships do not confer location access;
5. background location has a separate feature flag and consent path;
6. location history retention is independently configurable from current-location storage;
7. emergency location integration requires a separate OECF/government/telecommunications design gate.

## 16. API contracts

R1 uses existing authenticated MapAble API patterns.

Proposed routes:

```text
GET    /api/essential-services/capabilities
POST   /api/essential-services/capabilities
PATCH  /api/essential-services/capabilities/:id
DELETE /api/essential-services/capabilities/:id

GET    /api/essential-services/dependencies
POST   /api/essential-services/dependencies
PATCH  /api/essential-services/dependencies/:id
DELETE /api/essential-services/dependencies/:id

GET    /api/essential-services/continuity
POST   /api/essential-services/continuity
PATCH  /api/essential-services/continuity/:id

POST   /api/essential-services/status
GET    /api/essential-services/impact
GET    /api/essential-services/card
```

Exact dynamic-route syntax should follow current repository conventions at implementation time.

### API requirements

- subject identity derives from authenticated server session, never request-supplied participant identity alone;
- all write payloads validated with shared schemas;
- server enforces ownership/delegation scopes;
- sensitive projections are purpose-limited;
- request bodies use the repository's bounded parsing/security patterns;
- audit events are emitted after successful transactional writes;
- multi-record graph updates are atomic;
- unknown IDs fail closed without leaking object existence across principals.

## 17. Permissions and consent

ESR does not create a new blanket `essential_services.read_all` permission for supporters.

Permission design should map onto existing MapAble Core scope mechanisms.

Suggested purpose scopes for implementation review:

```text
essential_services.read
essential_services.write
essential_services.share
```

Location remains a separate location scope.

Health/safety notes remain separate health/safety scope.

### Projection policy

A consumer receives only the minimum fields needed for its purpose.

Examples:

- Navigate may need mobility-related continuity constraints but not family contacts.
- Transport may need pickup/access requirements but not unrelated communication-service outages.
- OECF may later need a participant-authorised emergency projection but not the entire registry.
- Employer-facing paths receive no ESR data by default.

## 18. Relationship and authority model

ESR represents relationships without converting them into authority.

Example:

```text
Relationship: parent
Continuity role: emergency contact
May receive alerts: yes
May view precise location: no
May change dependencies: no
```

A person can choose a supporter as part of a continuity plan without transferring decision-making authority.

No family member is automatically treated as unpaid replacement care when a paid service fails.

## 19. Policy and evidence layer

ESR stores policy classification separately from operational facts.

Example:

```text
Operational record:
  dependency: accessible transport
  criticality: CRITICAL
  participantDescription: "I need this to get to treatment"

Policy metadata:
  classification: SECONDARY_ESSENTIAL_SERVICE
  classificationOwner: AUSTRALIAN_DISABILITY_LTD
  evidenceStatus: PROPOSED
```

External evidence records use the Disability Policy Repository evidence gate:

```text
CANONICAL
PROBABLE
CANDIDATE
RESEARCH
```

A policy record must identify its source and evidence status. Proposed Australian Disability Ltd concepts must never be rendered as government policy without authoritative evidence.

## 20. External status adapters

External adapters are not required for R1.

Future adapter contract:

```text
EssentialStatusAdapter {
  sourceId
  capabilities()
  fetchStatus(query)
  normalize(raw)
  provenance(raw)
}
```

Candidate future domains:

- public transport disruption;
- telecommunications outage;
- electricity outage;
- accessible lift/infrastructure outage;
- provider service continuity.

Each integration must define:

- authority of source;
- geographic scope;
- update frequency;
- stale threshold;
- failure mode;
- terms/licensing;
- participant impact;
- accessible fallback when feed is unavailable.

Start with one authoritative adapter only after R1 proves the domain model.

## 21. Essential Service Card

The card is a purpose-limited projection, not a copy of the registry.

Participant chooses fields.

R1 supported field categories:

- preferred communication method;
- selected critical dependencies;
- participant-written fallback instructions;
- selected contact references;
- last updated time.

Explicit exclusions by default:

- diagnosis;
- full medical history;
- NDIS plan details;
- precise continuous location history;
- unrestricted supporter access;
- full dependency graph.

The card must show when it was last refreshed and provide a clear path to regenerate it after changes.

## 22. Security and privacy

### 22.1 Threat model priorities

- cross-user IDOR;
- over-broad delegate access;
- supporter/location surveillance;
- stale or forged outage status;
- injected external feed data;
- notification leakage;
- offline-device loss;
- malicious graph cycles/resource exhaustion;
- unauthorized card export;
- prompt injection if AI explanations are later introduced.

### 22.2 Minimum controls

- authenticated server-derived principal;
- least-privilege authorization;
- transactional writes;
- CSRF/session protections following existing web patterns;
- bounded request size;
- encrypted transport;
- encrypted sensitive mobile storage;
- device revocation path;
- audit of sensitive reads/shares and material writes;
- retention/deletion rules;
- no production participant data in tests or screenshots;
- feature flags default off for later high-risk integrations.

### 22.3 Retention

R1 keeps:

- active dependency/continuity records until participant deletion or lifecycle policy applies;
- status observations under a documented retention schedule designed for service continuity rather than lifetime surveillance;
- audit events according to existing MapAble governance requirements;
- offline card until revoked, refreshed or device enrolment is revoked.

Exact retention periods require privacy/governance approval before production enablement.

## 23. Accessibility acceptance

Target WCAG 2.2 AA-equivalent behavior across web and native where the success criterion maps to the platform.

R1 acceptance criteria:

- full critical web flow operable with keyboard only;
- VoiceOver and TalkBack usable for create/edit/status/continuity/card flows;
- meaningful screen-reader labels and grouping;
- minimum 44x44 logical-pixel touch targets;
- dynamic type / large-text support without clipped critical controls;
- 200% web text zoom without loss of function;
- no color-only status semantics;
- reduced-motion support;
- no timed confirmation;
- no drag-only graph control;
- accessible structured alternative to every graph visualization;
- plain-language labels;
- `I am not sure`, edit, cancel, delete, revoke and human-help paths;
- AAC-compatible text entry with no speech requirement;
- no voice input auto-send;
- errors identify the problem and recovery action;
- current sharing/location state is understandable programmatically and visually.

Accessibility failures on critical flows block release.

## 24. AI boundary

AI is not required for R1.

Future AI may:

- explain a dependency cascade in plain language;
- help a person draft a continuity plan;
- translate technical outage information into accessible language;
- suggest questions to consider.

Future AI must not:

- set criticality;
- create consent;
- change delegate authority;
- decide capacity;
- diagnose danger;
- decide emergency dispatch;
- silently change participant-written instructions;
- convert an unverified status into verified status;
- decide NDIS eligibility or funding.

Any model-generated content must be distinguishable from participant-authored content and must have a non-AI fallback.

## 25. Audit and observability

Material ESR events include:

```text
ESR_CAPABILITY_CREATED
ESR_CAPABILITY_UPDATED
ESR_CAPABILITY_ARCHIVED
ESR_DEPENDENCY_CREATED
ESR_DEPENDENCY_UPDATED
ESR_DEPENDENCY_ARCHIVED
ESR_CONTINUITY_PLAN_UPDATED
ESR_STATUS_REPORTED
ESR_SHARE_CREATED
ESR_SHARE_REVOKED
ESR_CARD_GENERATED
ESR_CARD_REVOKED
```

Operational metrics may include:

- registry creation completion;
- fallback-plan completion;
- percentage of dependencies with current status;
- stale-observation rates;
- sync failure rate;
- card refresh success;
- accessibility defects;
- external adapter failures after later integration.

Do not collect continuous location or sensitive disability analytics merely for engagement measurement.

## 26. Failure and recovery behavior

### API unavailable

- web/mobile shows that the registry cannot currently sync;
- offline card remains locally available where already generated;
- no false `Available` service status is inferred.

### External status adapter unavailable

- preserve previous observation with stale/expired label;
- do not synthesize a new status;
- allow participant manual report.

### Notification failure

- registry state remains authoritative;
- notification failure is observable/retriable;
- do not represent notification delivery as continuity action completion.

### Mobile sync conflict

R1 mobile registry editing is online-first. Offline card is read-only. Full offline editing is deferred until conflict semantics are specified.

### Permission revoked

Future reads fail closed immediately according to Core consent/delegation propagation. Cached sensitive projections are invalidated according to established policy.

### Dependency graph error

Cycles or invalid cross-principal references reject transactionally. Existing valid graph remains unchanged.

## 27. Feature flags

All new ESR surfaces default off.

Proposed flags:

```text
MAPABLE_ESSENTIAL_SERVICES_REGISTRY
MAPABLE_ESSENTIAL_SERVICES_WEB
MAPABLE_ESSENTIAL_SERVICES_COMPANION
MAPABLE_ESSENTIAL_SERVICES_STATUS_ADAPTERS
MAPABLE_ESSENTIAL_SERVICES_LOCATION
MAPABLE_ESSENTIAL_SERVICES_EMERGENCY_BRIDGE
```

R1 enables only the first three in preview/test environments after their specific gates pass.

Production rollout requires a separate explicit decision.

## 28. Testing and assurance

### 28.1 Domain tests

- capability CRUD ownership;
- dependency CRUD ownership;
- graph cycle rejection;
- cross-principal edge rejection;
- criticality persistence without AI mutation;
- deterministic impact propagation;
- backup dependency handling;
- stale observation behavior;
- status provenance preservation;
- no community-to-official status promotion.

### 28.2 Permission tests

- participant owns and edits own registry;
- unauthorized user cannot enumerate records;
- delegate with read scope cannot write;
- relationship alone grants nothing;
- revocation blocks subsequent reads;
- precise location remains unavailable without location purpose/scope;
- employer paths receive no ESR projection by default.

### 28.3 API tests

- schema validation;
- bounded payloads;
- authenticated principal derivation;
- atomic multi-record writes;
- typed errors;
- audit only after successful mutation;
- deletion/archival semantics.

### 28.4 Web accessibility tests

- keyboard critical flow;
- axe/WCAG checks where meaningful;
- focus restoration after dialogs;
- 200% zoom;
- screen-reader naming/landmarks;
- no color-only status.

### 28.5 React Native tests

- schema parity with web;
- VoiceOver/TalkBack review;
- dynamic text;
- touch target sizing;
- encrypted-card storage behavior;
- device revocation effect;
- redacted notification content;
- cold-start availability of the offline card.

### 28.6 Security tests

- IDOR;
- delegate scope escalation;
- forged source type;
- graph resource exhaustion;
- injection in participant notes;
- notification leakage;
- lost-device revocation;
- external adapter input validation in later phases.

## 29. Rollout sequence

### Phase 0 — Domain contract

Deliver:

- shared enums and schemas;
- domain model;
- permission/projection contract;
- provenance contract;
- deterministic impact-engine tests;
- policy/evidence metadata contract.

Exit gate: disability-led review confirms the model describes dependencies and continuity without scoring human worth or shifting authority.

### Phase 1 — Web Registry MVP

Deliver:

- `/my/essentials`;
- capability/dependency CRUD;
- continuity plans;
- manual status observations;
- impact calculation;
- sharing controls;
- audit;
- Essential Service Card generation.

Exit gate: participant can complete full journey accessibly and all Core authorization/privacy tests pass.

### Phase 2 — Companion integration

Deliver:

- Essentials entry in `apps/companion`;
- online registry view;
- disruption report;
- encrypted offline card;
- continuity plan projection;
- redacted notifications;
- device-revocation integration.

Exit gate: native accessibility and offline-card assurance pass on real supported devices.

### Phase 3 — Location & Presence

Deliver under separate gate:

- purpose-limited foreground location;
- journey mode;
- emergency snapshot interface;
- optional background location only after native/privacy review;
- location-sharing indicators and controls.

PostGIS is evaluated here based on actual spatial-query requirements, not adopted by default.

### Phase 4 — One external status adapter

Choose one authoritative data source with clear terms, freshness and geographic coverage.

Deliver:

- adapter contract implementation;
- provenance;
- failure/staleness behavior;
- participant correction path.

Exit gate: external feed cannot silently override participant information or present stale data as current.

### Phase 5 — OECF / emergency projection

Define and test a minimal emergency projection from ESR into the separately governed emergency communications architecture.

No live dispatch or agency claims without formal partnership/approval.

### Phase 6 — public-interest and regulated partner integrations

Potential domains include telecommunications, utilities, NRS, emergency services, Disability Gateway and relevant disability-support systems.

Each integration receives its own legal, security, privacy, operational and accessibility approval gate.

## 30. C -> B -> A extraction doctrine

### C — MapAble native

Prove:

- domain utility;
- accessibility;
- consent/authority model;
- deterministic impact behavior;
- web/mobile interoperability.

### B — Australian Disability Ltd open-core extraction

After stable use, extract generic packages such as:

```text
@ausdis/essential-services-core
@ausdis/essential-services-schema
@ausdis/continuity-engine
```

MapAble becomes a reference client through adapters.

### A — selective infrastructure ownership

Internalise only infrastructure that materially improves resilience, privacy, accessibility or independence, for example:

- geospatial/location services;
- offline sync infrastructure;
- open status-adapter framework;
- self-controlled notification or communications components.

Do not reinvent mature protocols or accept regulated telecommunications obligations merely for architectural purity.

## 31. Migration and compatibility

- additive database migrations only for R1;
- no destructive rewrite of Core identity/consent/delegation systems;
- no forced migration from `/dashboard` or other existing routes;
- no requirement that current MapAble modules immediately consume ESR;
- feature flags allow full rollback by hiding surfaces while retaining additive data;
- exported/shared contracts are versioned before external consumers are introduced.

## 32. Rollback

If R1 must be withdrawn:

1. disable ESR feature flags;
2. remove navigation entries without deleting participant records;
3. stop new writes through ESR APIs;
4. preserve export/delete pathways for participants;
5. retain audit records according to governance policy;
6. keep database migration additive unless a separately reviewed down-migration is required.

External adapters and location modes have independent kill switches.

## 33. Risks

### Surveillance drift

Risk: continuity infrastructure becomes persistent monitoring.

Control: purpose-bound collection, separate location sharing, minimal retention, visible sharing state, no family access by default.

### Family substitution

Risk: system assumes family absorbs service failure.

Control: family/supporter is only a participant-chosen continuity option; no automatic assignment or authority.

### Stale status

Risk: old outage information causes harmful decisions.

Control: expiry/freshness metadata, explicit `UNKNOWN`, provenance display, manual correction.

### Policy overclaim

Risk: proposed Secondary Essential Services framework is shown as law/government designation.

Control: policy evidence-status metadata and copy review.

### Over-expansion

Risk: registry becomes a combined emergency dispatch, clinical system, telco platform and NDIS engine before its core value is proven.

Control: strict R1 non-goals and phase gates.

### Mobile fragmentation

Risk: web, Companion and other native surfaces develop inconsistent semantics.

Control: shared schemas/contracts; mobile presentation only.

## 34. Accessibility, safety and operational release gate

No pilot/public enablement until evidence shows:

- critical web flow meets WCAG 2.2 AA acceptance criteria;
- TalkBack/VoiceOver critical mobile flow is usable;
- participant can create/edit/delete/revoke without human operator intervention where appropriate;
- participant can request human help;
- authorization and delegate tests pass;
- privacy impact assessment is complete for the enabled data categories;
- offline sensitive storage is encrypted;
- device revocation is tested;
- audit records are generated as designed;
- operational support/correction path exists;
- feature flags and rollback are tested.

Independent security/accessibility assurance is required before any live regulated external integration.

## 35. Acceptance criteria

The design is correctly implemented when:

1. a participant can register communication, mobility and personal-support dependencies without entering a diagnosis;
2. the participant's own description is preserved and editable;
3. dependency status has explicit provenance and freshness;
4. deterministic impact propagation shows affected capabilities without scoring the person;
5. continuity options remain participant chosen;
6. family/support relationships do not grant authority;
7. no location is collected or shared merely because ESR is enabled;
8. web and Companion use the same semantic contract;
9. an encrypted offline Essential Service Card can be generated on the Companion;
10. external integrations are absent or feature-gated until separately approved;
11. AI is not required for any critical R1 function;
12. OECF receives no ESR data until a separately approved purpose-limited projection is implemented;
13. existing MapAble Core systems remain authoritative for identity, consent, delegation and audit;
14. the feature can be disabled without destructive data migration;
15. implementation evidence distinguishes Implemented, Tested and Independently assured controls rather than claiming compliance from design alone.

## 36. Implementation-plan boundary

This document defines architecture and product behavior only.

The implementation plan must be written only after this specification is reviewed and accepted. That plan will break the work into test-driven tasks with exact repository paths, migrations, shared-contract changes, web/API work, Companion work, accessibility tests, security tests, documentation, review checkpoints and stop conditions.

No production code should be changed as part of approving this design specification.
