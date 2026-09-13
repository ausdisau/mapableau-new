# MapAble Target Architecture Design

**Date:** 2026-09-13  
**Repository:** `ausdisau/mapableau-new`  
**Base branch:** `main`  
**Base SHA:** `ae8cb19cc4a1b046852dfae5ae89f5f8f57eb65a`  
**Design status:** Approved architecture; implementation not yet authorised  
**Production anchor:** existing Vercel project `mapableau`

## 1. Purpose

MapAble is a disability-led social-enterprise ecosystem that connects accessibility evidence with practical services and participant-controlled coordination. The target architecture must make it possible for a person with disability to discover accessible places and services, evaluate provider and worker evidence, coordinate care, transport and work-related activities, control what information is shared, and obtain human help when technology or services fail.

The architecture is not a collection of unrelated apps. It is one accessible MapAble experience supported by shared Core services, evidence-backed domain models and bounded service modules.

The central design principle is:

> The participant remains the decision-maker. MapAble may organise evidence, explain options and coordinate chosen services, but it must not turn regulatory status, AI output, commercial incentives or operational convenience into an opaque substitute for participant choice.

## 2. Current-state evidence and constraints

The architecture is grounded in the currently inspected repository and deployment state rather than historical plans or mock-ups.

- `main` was inspected at SHA `ae8cb19cc4a1b046852dfae5ae89f5f8f57eb65a`.
- The root application is a Next.js 15 App Router application using React 18, TypeScript, pnpm workspaces, Prisma, Zod, NextAuth, MapLibre, Vitest and Playwright.
- Shared packages already include `@mapable/domain-provider`, `@mapable/domain-workforce`, `@mapable/domain-transport` and `@mapable/ui`.
- The Vercel project `mapableau` has a READY production deployment of the inspected `main` commit and remains the production base.
- The duplicate Vercel project `mapableau-new` is not the production target and has had production environment parity failures; it may be used temporarily for previews or migration validation but is to be retired after convergence.
- Provider Finder already has App Router routes, result-card components, filtering/Ask surfaces, provider-outlet ingestion and Prisma registry foundations.
- Existing Provider Finder demo/static provider data is not authoritative production truth and must be removed from the production search path.
- Worker screening currently includes document upload, administrative review and generic internal `verified`-style states. These do not constitute authoritative live NDIS Worker Screening status and must be migrated conservatively.
- Unified participant navigation already exists and should be evolved rather than replaced with a competing shell.

### Claim-control rule

Material capabilities are labelled as one of: Verified live, Implemented but not independently verified, In development, Proposed, Exploratory or Historical. Plans, mock-ups and generated designs never become proof that a capability is live.

## 3. Production convergence

### 3.1 Canonical deployment

The target production topology is:

```text
GitHub: ausdisau/mapableau-new
        |
        v
Vercel project: mapableau
        |
        v
mapable.com.au
```

`mapableau` remains the production anchor. The project metadata/configuration should be corrected to reflect the actual Next.js application, but production should not be migrated merely because another Vercel project has a cleaner name.

### 3.2 Deployment rules

Before production-affecting architecture changes:

- record the currently known-good deployment and rollback target;
- verify custom domain attachment rather than assuming it;
- inventory environment variable names without exposing values;
- maintain preview and production environment contracts;
- use ordinary branch previews;
- keep regulated/incomplete features behind default-off feature flags;
- do not retire the duplicate Vercel project until environment parity, domain verification, rollback and production smoke tests are complete.

## 4. One Next.js App Router architecture

MapAble converges onto one deployable Next.js App Router application. Legacy client code is migration source, not a second permanent frontend.

Canonical top-level route families are:

```text
/my
/access
/care
/transport
/work
/support
/provider
/worker
/admin
/api
```

Legacy routes such as `/provider-finder` and `/find-workers` remain compatible during migration through redirects, thin wrappers or shared new services. Two independent business implementations must not be maintained indefinitely.

## 5. Shared Core

MapAble Core provides capabilities that must not be reimplemented inside each vertical:

- identity and authentication;
- roles, organisation membership and authorisation;
- delegated access;
- participant accessibility and communication preferences;
- purpose-bound consent and disclosure receipts;
- evidence/provenance primitives;
- messaging and notifications;
- human support;
- complaints and incidents;
- audit events;
- feature flags;
- billing and service-evidence primitives.

Core is the control plane for Care, Transport, Work, Access, Provider, Workforce and later modules.

## 6. Canonical evidence architecture

MapAble stores source facts, evidence and decisions separately.

```text
SOURCE
  -> SOURCE SNAPSHOT
  -> NORMALISED FACT
  -> EVIDENCE RECORD
  -> DOMAIN INTERPRETATION
  -> SEARCH/DASHBOARD PROJECTION
  -> HUMAN DECISION
```

External data is not trusted merely because it was imported. Every important evidence record preserves source, authority, effective/checked dates, freshness, uncertainty and supersession history.

### 6.1 Source registry

A shared `EvidenceSource` model records source type, authority, jurisdiction, access mode, classification, refresh policy, licensing where relevant, last-checked state and active/inactive state.

### 6.2 Source snapshots

External imports create immutable or append-only snapshots with fetched time, source publication time when known, checksum, schema version, record count, import status and supersession relationship. Last-known-good snapshots remain available when a later import fails validation.

### 6.3 Evidence states

Canonical UI/domain evidence states include:

- official;
- verified;
- declared;
- reported;
- user supplied;
- unknown/not assessed;
- outdated/stale;
- expired;
- disputed;
- source unavailable.

The interface must not collapse these into one green tick.

## 7. Provider data and Provider Finder 2.0

### 7.1 Provider identity

Legal organisation, trading name, official NDIS provider/outlet identity and MapAble organisation/profile are related but distinct.

Automatic reconciliation priority is:

1. exact ABN;
2. exact official source identifier where available;
3. previously approved source linkage;
4. exact normalised legal identity with compatible source data;
5. otherwise manual reconciliation.

Fuzzy-name matching alone must never merge providers.

### 7.2 Provider registry projection

The official/provider source path is:

```text
Official NDIS provider source
  -> validated snapshot
  -> normalisation
  -> ProviderOutletRegistry
  -> identity reconciliation
  -> ProviderSearchProjection
```

The production Finder must not rely on synthetic `PROVIDERS` fixtures. Demo records remain only in tests/design environments and must be explicitly labelled where shown.

### 7.3 Registration evidence

Canonical provider contracts do not use a bare `registered: boolean`. Registration is represented by evidence with status such as approved, suspended, revoked, not found, ambiguous or source unavailable, plus source and checked date.

Provider registration does not imply quality, accessibility, availability or worker competence.

### 7.4 Search request

Personalised Provider Finder search uses a typed request distinguishing required constraints from preferences. Functional access requirements are preferred over diagnosis disclosure where diagnosis is unnecessary.

### 7.5 Deterministic matching

Provider ranking is deterministic in this order:

1. requested service;
2. funding/registration constraint where applicable;
3. geography/service area;
4. access and communication requirements;
5. availability;
6. evidence quality/freshness.

The user-facing match classes are Strong match, Possible match and Needs confirmation. They describe fit to selected requirements and are not provider quality ratings.

Unknown evidence remains unknown. It does not satisfy a hard requirement, but it also must not be represented as a known negative.

### 7.6 Finder UI

The results list is primary and the map is complementary. All search, filtering, selection, comparison, saving and requesting functions must be possible without manipulating a map.

Provider result cards expose identity, match explanation, evidence, unknowns and actions. Comparison mode compares evidence dimensions directly and does not use a hidden universal score.

### 7.7 Ask MapAble in Finder

Natural-language search may translate participant language into the same typed `ProviderSearchRequest`. The interpreted constraints are shown for review. AI does not invent provider capabilities or override deterministic rules.

### 7.8 Privacy

Personalised searches should generally use body-based requests rather than placing sensitive access/communication needs into URLs, logs or browser history. Analytics should favour coarse service/region and system health rather than raw free-text or health details.

## 8. Worker screening, trust and Worker Finder

### 8.1 Separate dimensions

Worker identity, worker screening, credentials/competence and participant fit are independent dimensions.

### 8.2 Regulatory screening state

Canonical screening vocabulary preserves:

- Clearance;
- Pending;
- Interim bar;
- Exclusion;
- Suspension;
- No valid clearance;
- Not independently verified.

A generic legacy `verified` state is not an authoritative regulatory status.

### 8.3 Evidence-review state

Internal document workflow uses a separate review lifecycle such as not submitted, submitted, pending review, accepted as supporting evidence, rejected document and superseded.

A rejected document is not an Exclusion. A legacy verified document is not automatically a Clearance.

### 8.4 Source authority

Worker screening evidence is classified by authority, including authorised NWSD evidence, relevant State/Territory screening unit evidence, authorised provider-held evidence and worker-supplied material. Worker-supplied evidence is useful but does not establish live authoritative status by itself.

### 8.5 Jurisdiction adapters

Every Australian jurisdiction implements a common `WorkerScreeningJurisdictionAdapter` contract describing authority, permitted verification modes, source-status normalisation, official verification route, renewal route and additional checks.

An adapter is a domain boundary and does not imply that a direct API exists. Where no authorised machine interface is available, a human-authorised check is the supported adapter implementation.

### 8.6 No credential harvesting

MapAble must never request or store portal passwords, myID credentials, MFA codes or other credentials for scraping worker-screening portals.

### 8.7 Legacy migration

Migration is conservative and additive. Existing `verified`, `rejected`, `expired` and `pending_review` values are retained as legacy evidence/history and mapped only where supporting evidence proves the new interpretation.

### 8.8 Operational eligibility

Screening status and assignment eligibility are separate. A current Clearance may be required for a role but never establishes competence for a high-intensity or specialist support task.

### 8.9 High-risk supports

Tracheostomy, ventilation, complex bowel care, dysphagia/mealtime management, medication support, complex seizure management, restrictive-practice related functions and comparable specialist supports require additional competency evidence, task scope and human review.

### 8.10 Public Worker Finder

Worker Finder exposes a privacy-preserving projection: public display identity, regions, services, communication, mobility/transport capabilities, screening evidence class/status, credentials, availability and match explanation. It does not expose screening identifiers, identity documents, home addresses or internal regulatory notes.

Public worker screening status is not presented as a universal quality or suitability score.

### 8.11 Compliance and incidents

Public compliance actions, where evidenced, are separate from worker screening. Absence of a public matching action must not be represented as proof of no history or safety.

Confidential reportable incident information must not become a public worker score.

## 9. Unified accessible MapAble shell

### 9.1 Participant navigation

The participant-facing information architecture converges toward:

- Today;
- My Life;
- Access & Places;
- Care;
- Transport;
- Work & Study;
- People & Services;
- Money & Evidence;
- Privacy, Safety & Control.

CareOS is not a second shell. It is the orchestration architecture behind the unified MapAble experience.

### 9.2 Mobile navigation

The mobile bottom bar remains deliberately compact:

- Today;
- Go;
- Ask;
- My Life;
- More.

### 9.3 Semantic HTML

Critical pages use skip links, header, labelled navigation, one main region, one clear H1, meaningful sections/articles, optional complementary asides and a persistent human-help path. Essential information cannot exist only in an aside or map.

### 9.4 Accessibility release baseline

WCAG 2.2 AA is the minimum release criterion. Critical flows must support keyboard-only use, visible focus, screen readers, 200% zoom/reflow, no colour-only meaning, reduced motion, touch targets at least 44x44 CSS pixels, text/AAC interaction, save-and-return where needed, accessible authentication, map alternatives and human assistance.

Automated testing alone is insufficient; manual keyboard, screen-reader, zoom/reflow and disabled-user testing are required for major releases.

### 9.5 Information density

The UI supports participant-controlled Simple, Standard and Detailed density. Presentation density changes; underlying evidence and truth do not.

### 9.6 Focus View

A reduced-complexity projection exposes Now, Next, Action and Help using the same underlying data rather than creating a separate simplified product.

### 9.7 Status language

Statuses are textual and semantic. Colour may reinforce but never define meaning.

## 10. Provider Workspace

Provider Workspace is an organisation-scoped projection of MapAble Core plus Provider/Workforce domains, not a separate product.

Canonical areas are Overview, Organisation, Team, Services, Service Areas, Availability, Participant Requests, Evidence, Compliance, Billing and Settings.

Organisation membership and worker identity remain separate. Ending a relationship removes membership but does not delete worker identity/history.

Provider claims require organisation identity and authorised representative verification. Claiming a MapAble profile never grants permission to edit official registry facts.

Role-based provider administration replaces universal `admin=true`. Suggested roles include Owner, Administrator, Compliance Manager, Service Manager, Scheduler, Finance, Worker and Read-only Auditor.

Provider dashboards prioritise operational exceptions such as screening rechecks, expiring credentials, registration discrepancies, waiting requests, disputed accessibility statements and stale availability.

Provider availability is temporal and can become stale.

## 11. Consent, delegation, privacy and safeguarding

### 11.1 Authority chain

The system must resolve: who is acting, for whom, under what authority, for what purpose, over what data/action, and for how long.

Authentication alone never grants authority to act for a participant.

### 11.2 Consent

Consent is purpose-bound and versioned. Separate purposes include provider enquiry, care, transport/location, worker disclosure, health/safety notes, workplace adjustments, AI processing, research, analytics, marketing and emergency escalation.

Optional purposes must not be bundled into essential service consent.

### 11.3 Delegation

Delegate grants are scoped, time-bound where appropriate, revocable and audited. The UI persistently shows when a person is acting for someone else and the authority they have.

### 11.4 Disclosure receipts

Meaningful cross-domain disclosure is reproducible through a receipt linking participant, recipient, purpose, data categories, consent, originating module and time.

### 11.5 Data classes

Use Public, Operational, Restricted and Emergency/Safety classifications. Access is based on role, relationship, purpose and consent rather than mere record visibility.

### 11.6 Complaints and incidents

Common Core pathways include human help, complaint, safety concern, incorrect-information report, blocking and advocate/supporter involvement.

Incident workflows support immediate safety response, factual record, human triage, reportability assessment, required notifications, investigation, corrective action and accessible closure/review. AI may assist documentation but cannot decide abuse, capacity, statutory reportability or restrictive-practice authorisation.

## 12. CareOS / Full-Life orchestration

CareOS coordinates the person's chosen goals across MapAble domains.

```text
Life Goal
  -> Journey/Mission
  -> Activities
  -> Dependencies
  -> Care + Transport + Access + Work + People + Evidence
```

Each underlying domain remains the system of record for its operational truth. CareOS owns coordination and dependency state.

Canonical entities include `LifeGoal`, `Journey`, `JourneyActivity`, `JourneyDependency`, `Requirement`, `FallbackPlan`, `JourneyDecision` and `JourneyEvent`.

Readiness is explainable rather than expressed as an opaque life score. Failures move journeys into explicit needs-attention/recovery states and present options to the participant or authorised delegate.

MapAble may identify consequences and alternatives. It does not silently book substitutions or optimise the participant into the cheapest or most restrictive life. Dignity of risk and participant choice remain governing principles.

## 13. Security and trust architecture

Security uses explicit trust boundaries: client -> authentication -> session/device risk -> authorisation -> consent/purpose gate -> application service -> domain validation -> persistence/external integration.

Authorisation combines role, organisation boundary, participant relationship, delegate scope, consent and resource policy.

Threats addressed include account takeover, delegate abuse, cross-tenant leakage, provider/worker impersonation, provider-record hijacking, evidence poisoning, malicious uploads, prompt injection, supply-chain compromise, webhook replay, insecure object references, excessive permissions, secret leakage, location surveillance and financial fraud.

Sensitive uploads use type/size validation, malware scanning, isolated storage, access policy and controlled evidence extraction.

Secrets are server-side, environment-scoped, least-privilege and never committed or exposed in client bundles.

High-impact actions create audit events. Break-glass access, if required, is explicit, narrow, short-lived, reasoned and reviewed.

Continuity architecture includes database backup, point-in-time recovery, evidence-snapshot recovery, deployment rollback and manual fallback for external-system outages.

## 14. Testing, accessibility, observability and release assurance

The verification stack is: domain invariants -> service/repository tests -> API/contract tests -> component tests -> critical-flow E2E -> accessibility/manual testing -> production verification.

Permanent invariants include:

```text
Provider registration != provider quality
Worker clearance != competence
Legacy verified != automatic Clearance
Source outage != record absent
Delegate != participant
AI output cannot bypass policy gate
```

Each release must run repository-appropriate typecheck, lint, unit/integration, migration checks, accessibility automation and production build, followed by preview E2E and security review for affected boundaries.

Post-deploy verification includes runtime errors, authentication failures, critical API health, source freshness, background processing and audit-event generation.

Release states are Development -> Preview -> Internal validation -> Limited production -> General availability. Regulated/incomplete features remain default-off until gates are satisfied.

## 15. Database migration, legacy retirement and Vercel convergence

Migration doctrine is Expand -> Migrate -> Verify -> Switch -> Contract.

Major schema transitions use additive changes, compatibility adapters, controlled backfill, invariant verification, read-path switch, old-write shutdown, observation period and only then legacy removal.

Historical evidence is not erased during migration.

Legacy routes move one at a time through behaviour inventory, App Router replacement, preview parity, accessibility parity, redirect/compatibility handling, production observation and old-code removal.

Environment configuration uses a typed schema distinguishing required production variables, preview-safe variables, optional variables, feature-specific variables, secrets and public browser configuration.

## 16. Final repository and package architecture

Target direction:

```text
app/
  (public)/
  my/
  access/
  care/
  transport/
  work/
  support/
  provider/
  worker/
  admin/
  api/

components/
  core/
  dashboard/
  evidence/
  provider/
  worker/
  access/
  care/
  transport/

lib/
  auth/
  policy/
  consent/
  audit/
  evidence/
  provider/
  workforce/
  access/
  transport/
  care/
  journeys/
  ai/
  notifications/
  billing/
  integrations/

packages/
  contracts/
  domain-core/
  domain-provider/
  domain-workforce/
  domain-access/
  domain-transport/
  domain-care/
  domain-journey/
  ui/

prisma/
scripts/
tests/
docs/
```

This is a target architecture, not authority for a wholesale repository move in one PR.

Dependency direction is App -> Components -> Application Services -> Domain -> Ports/Interfaces, with infrastructure adapters implementing ports. Domain packages must not depend on Next.js, React, Vercel or Prisma. `@mapable/ui` must not depend on Prisma.

Material deviations are recorded as architecture decision records under `docs/architecture/decisions/` or an equivalent established location.

## 17. Ask MapAble / agentic intelligence

AI is an assistive layer inside deterministic, rights-constrained MapAble services.

```text
Participant
  -> accessible conversational UI
  -> identity + consent + purpose
  -> bounded agent/orchestrator
  -> typed tools
  -> policy/permission gates
  -> domain services
  -> evidence-backed result
  -> AI explanation
  -> participant review
```

Prefer bounded agents such as Search Assistant, Journey Assistant, Evidence Assistant, Service Request Assistant and Support Assistant rather than one unrestricted universal agent.

Every tool contract defines typed input/output, actor/organisation/participant context, required consent, permission check, idempotency, audit event, failure handling and whether human approval is required.

Models may interpret, summarise, draft, propose and explain. They cannot independently approve funding, establish regulatory status, determine abuse/reportability, release money, disclose disability information, change consent, suspend providers/workers or modify production.

Agent memory must not become an uncontrolled second participant database. Persistent user-controlled preferences live in MapAble Core and are retrieved only when permitted.

Production AI requires versioned evaluations covering schema validity, tool selection, groundedness, provenance, privacy, prompt injection, cross-tenant isolation, accessibility, AAC preference preservation, respectful disability language, refusal of high-risk decisions and human escalation.

A complete deterministic/non-AI path remains available for critical functionality.

## 18. Access intelligence, geospatial and AccessXR

MapAble uses one access evidence graph across Provider Finder, accessibility map, Navigate, parking, indoor mapping and AccessXR.

Canonical concepts are Place, AccessFeature, AccessObservation, Verification and Evidence.

Accessible routes include segments, relevant barriers, required features, evidence confidence/age and alternatives. Incomplete evidence must be communicated as uncertainty rather than as guaranteed safety.

AccessXR is a pre-visit visualisation of the underlying place/access evidence, not a separate truth source. Geometry alone does not prove accessibility.

Every XR experience has a non-XR equivalent containing floor plan or structured spatial information, images where available, written directions, measurements, accessibility features and route instructions.

Community observations are source-labelled, dated, disputable, moderated and non-authoritative unless verified.

## 19. Mobile, offline and assistive interaction

The Next.js application remains the canonical initial client. Native clients consume the same domain/API contracts and must not duplicate business logic.

Offline support prioritises data whose absence could strand or materially disadvantage the user: today's schedule, trip details, support contacts, essential communication preferences, help instructions and cached access information.

Stale regulatory evidence must never look current merely because the device is offline.

High-impact sync conflicts require explicit user/human resolution rather than unconditional last-write-wins.

Native experiences must support platform screen readers, switch access, large text, landscape, external keyboards, AAC copy/share and reduced motion.

## 20. Billing, payments and AbilityPay boundary

Service truth, billing eligibility, invoice and money movement remain separate stages.

Canonical entities include Quote, ServiceAgreement, ServiceRecord, Invoice, InvoiceLine, FundingSource, PaymentInstruction, Payment, Refund, Dispute and Reconciliation.

MapAble may assist with NDIS line-item tagging but must not imply that a suggested line item guarantees claimability.

AI may explain invoices, identify anomalies and propose categorisation; it does not release payments.

AbilityPay may specialise financial workflows but must reuse Core identity, consent, provider, participant and service-evidence models rather than creating parallel identity/provider registries.

Money movement requires strong authentication, segregation of duties, duplicate/rate/date/quantity validation and explicit dispute/refund paths.

## 21. Data governance, research and community evidence

Every data source is classified as Official, MapAble verified, Provider/worker declared, Participant supplied, Community reported, Inferred or Generated. Inferred/generated content must never masquerade as observation.

Maintain a data catalogue covering owner, purpose, source, sensitivity, retention, lawful/consent basis, quality, refresh and downstream consumers.

Operational participant data is not automatically research data. Research use requires a defined purpose, appropriate consent/lawful basis, ethics/governance where required, minimisation and controlled environments.

Participant data must not automatically become training material for a future MapAble model. Any training corpus requires separate rights, provenance and governance.

Data quality is measured through completeness, staleness, geographic gaps, conflicts, verification coverage and correction speed rather than one universal trust score.

## 22. Regulated Care and Transport service operations

This section becomes an activation gate whenever Australian Disability Ltd/MapAble directly supplies, employs, contracts, dispatches or otherwise operates regulated services rather than acting only as discovery/referral infrastructure.

The operating model must explicitly state whether MapAble is acting as directory, referral platform, marketplace, agency/intermediary, direct provider, employer or contractor manager.

Care service lifecycle covers request -> scope -> worker eligibility -> participant choice -> service agreement -> pre-shift information -> shift -> service evidence -> participant review -> billing.

Tasks are explicitly scoped. Workers cannot silently expand from ordinary community support into specialist/high-intensity work without appropriate evidence, authority and review.

Continuity plans cover worker absence, participant cancellation, missed shifts, transport failure, credential expiry and service outages.

Direct transport operations separately verify driver, vehicle, mobility-aid/boarding requirements, pickup/drop-off, trip events and charging evidence.

No direct regulated-service launch occurs without named operational ownership, escalation, after-hours boundaries, supervision, service recovery, insurance/legal verification and current regulatory review.

## 23. Marketplace economics, advertising and commercial separation

Commercial relationships must not alter MapAble's truth layer.

Organic matching remains based on participant requirements, eligibility, geography, accessibility/communication evidence, availability and evidence quality. Sponsorship cannot change match classification or be represented as Verified, Best or Recommended.

Paid content is visibly labelled and separated from organic ranking.

MapAble discloses relevant commercial conflicts when it receives referral revenue, owns a provider, supplies services itself or accepts provider advertising.

Sensitive disability, health, safeguarding, worker-screening and incident information must not be used for behavioural advertising.

Providers may pay for legitimate administrative, analytics, enterprise or clearly promotional products, but cannot buy regulatory status, verification outcomes, accessibility truth or participant match qualification.

## 24. Multi-jurisdiction and New Zealand extension

Regulatory policy accepts a `JurisdictionContext` rather than hard-coding Australia-wide assumptions.

Country -> State/Territory -> Regulatory Programme is explicit, which is already necessary for Australian worker screening.

Shared concepts such as person, goals, functional access needs, places, generic evidence and journey coordination remain reusable. Provider regimes, funding, worker checks, credential requirements, complaints/reporting and pricing remain jurisdiction-specific adapters.

New Zealand must not be modelled by copying NDIS concepts. Expansion requires local legal/regulatory review, data-source validation, operational ownership, support arrangements and jurisdiction-specific testing.

## 25. Architecture governance and acceptance

Every important requirement must trace to a design section, domain/control, implementation phase, tests and launch evidence.

Architecture freeze means major domain, rights, safety, privacy, migration and release boundaries are agreed. It does not prohibit change. Any material deviation requires a documented decision explaining current commitment, new evidence, proposed change, affected areas, migration impact and recommendation.

### Acceptance matrix

| Requirement | Architecture owner | Minimum proof before launch |
|---|---|---|
| Provider provenance | Evidence + Provider domains | Validated ingestion, provenance and outage tests |
| No demo provider truth | Provider Finder | Production search projection no longer consumes synthetic fixtures |
| Worker official status preserved | Workforce domain | Regulatory-state invariant and migration tests |
| Screening != competence | Workforce/Care | Assignment-eligibility tests and separate credential evidence |
| Map-independent discovery | Unified UI | Keyboard/screen-reader E2E without map interaction |
| Delegate scope visible | Core | Permission, acting-as UI and revocation tests |
| Purpose-bound disclosure | Core | Consent/disclosure receipt tests |
| Human escalation | Core | Accessible E2E path independent of AI |
| AI cannot bypass authority | AI + policy | Tool-permission and adversarial evals |
| Accessibility WCAG 2.2 AA | UI/release | Automated + manual accessibility evidence |
| Source outage preserves uncertainty | Evidence adapters | Last-known-good/failure-mode tests |
| Production rollback | Deployment | Verified rollback runbook |
| Commercial ranking separation | Marketplace | Ranking tests and sponsorship isolation |
| Direct service safety | Operations | Current regulatory/operational readiness sign-off |

## 26. Delivery sequence

Implementation must remain phase-gated rather than attempting the entire architecture at once.

Recommended order:

```text
0. Production baseline and rollback evidence
1. Core evidence/provenance contracts
2. Provider registry projection
3. Unified Provider Finder 2.0
4. Worker-screening evidence contracts and conservative migration
5. Jurisdiction verification adapters and Worker Finder
6. Provider Workspace
7. Core consent/delegation/safeguarding hardening
8. Unified participant Today/My Life integration
9. CareOS/Full-Life orchestration
10. Access/geospatial expansion
11. AI orchestration after deterministic tools/evals exist
12. Billing/direct-service/mobile/commercial tracks only behind their own gates
13. Legacy route/schema retirement and duplicate Vercel project retirement
```

The first implementation slice remains Provider Finder 2.0 because it proves the shared evidence model, unified shell, provenance presentation, matching rules, map/list accessibility and source-outage behaviour before the more safety-sensitive worker-screening migration.

## 27. Explicit out of scope for the first implementation plan

The first implementation plan must not attempt to deliver the entire target architecture. Unless separately authorised, it excludes:

- full CareOS journey orchestration;
- direct Care/Transport operations;
- payment execution/AbilityPay rollout;
- native mobile rewrite;
- AccessXR production implementation;
- advertising launch;
- New Zealand launch;
- autonomous high-impact AI actions;
- destructive legacy-schema deletion;
- duplicate Vercel project retirement before parity and rollback are proven.

## 28. Non-negotiable rights and safety invariants

- Address the participant directly unless they choose a delegate.
- Preserve supported decision-making, refusal and withdrawal.
- Do not require diagnosis where functional needs are enough.
- Safety controls must be proportionate and not become blanket restriction.
- Regulatory evidence must remain distinct from quality and suitability.
- Unknown must remain unknown.
- Human help must remain available without AI.
- AI cannot make statutory, regulatory, clinical, consent or irreversible financial decisions.
- Commercial incentives cannot alter evidence truth or organic match qualification.
- Sensitive data is purpose-limited and least-privilege.
- Accessibility is a release criterion, not a later enhancement.

## 29. Spec-to-plan gate

This document is the formal architecture specification produced from the approved design discussions. No application implementation is authorised by the existence of this document.

The next process step is user review of this written specification. Only after explicit approval of this committed spec should the project proceed to a detailed implementation plan. The implementation plan must decompose the architecture into small TDD-driven, reviewable pull requests with preview verification, accessibility gates, security/privacy checks and no production deployment or merge unless separately authorised.
