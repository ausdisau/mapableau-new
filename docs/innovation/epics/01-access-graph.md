# EPIC 01 — MapAble Access Graph

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-01` / `access-graph` |
| Priority | P0 |
| Delivery horizon | Foundation — Priority 0 |
| Wave | Foundation Wave |
| Current claim state | **In development** |
| Dependencies | None (foundation) |
| Recommended owner | Access Infrastructure / Living Access Fabric owners (lib/access/**) |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Access Graph

## 2. Epic ID / proposed slug
`EPIC-01` · `access-graph`

## 3. Strategic outcome
Canonical evidence-backed accessibility data graph used across MapAble — the foundation of the Map → Access Graph → Passport → Navigate → Orchestration flywheel.

## 4. Participant outcome
Participants can rely on feature-level accessibility evidence with honest confidence, freshness, and dispute status — not a single 'accessible' boolean.

## 5. Problem statement
Accessibility information is fragmented, stale, or presented without provenance. Participants cannot tell community report from assessor measurement, or AI inference from verified fact.

## 6. Scope
- Places, entrances, paths of travel, doorway widths, thresholds, ramps, gradients, surfaces, stairs, lifts
- Toilets and Changing Places, parking, drop-off, kerb ramps, crossings, public transport access
- Sensory characteristics, hearing augmentation, lighting, acoustics, service counters, seating
- Workplaces, vehicles, providers, accessibility services as AccessEntityType subjects
- Every assertion: source, timestamp, evidence type, verification state, confidence, expiry/freshness, dispute/correction history
- Source classes: community reported, organisation supplied, assessor measured, sensor observed, AI inferred, independently verified, unknown, expired

## 7. Explicit non-goals
- Universal accessibility score for consequential decisions (permanently denied)
- Equating Premises Standards / DSAPT / WCAG compliance with 'works for this person'
- Exposing Personal Access Passport attributes via public Access API
- AI-inferred observations presented as verified fact or accreditation
- Second place identity SoT (C-011: AccessPlace only)

## 8. User groups
- Participants and support persons
- Venue operators and property managers
- Accredited assessors
- Councils / transport operators (consumers of later API)
- MapAble access data stewards

## 9. Example user journeys
- Participant views destination access features with confidence and freshness labels before travel
- Community contributor submits observation → queued as community_reported, not auto-published as verified
- Assessor measurement supersedes prior observation with provenance chain and expiry
- Dispute raised → disputed status; correction history retained append-only

## 10. Functional capabilities
- Canonical accessibility taxonomy / ontology
- Place and feature schema on AccessPlace
- Evidence provenance envelopes
- Observation and verification workflows
- Freshness and expiry engine
- Correction / dispute workflow
- Internal Access Graph read APIs

## 11. Shared Core dependencies
- AccessPlace (C-011)
- AccessObservationRecord / AccessEvidenceEnvelopeRecord
- AccessCapabilityRecord
- AuditEvent
- FeatureFlag fail-closed
- Consent only when linking participant-contributed identity (default contributor modes)

## 12. Cross-Epic dependencies
- None

## 13. Data entities
- AccessPlace
- AccessPlaceFeature
- AccessPlaceSource
- AccessObservationRecord
- AccessEvidenceEnvelopeRecord
- AccessChangeReviewRecord
- AccessCapabilityRecord
- Ontology concepts (intelligence-next)

## 14. APIs / events required
- Internal: /api/access-infrastructure/* (contracts in docs/access-infrastructure/API_CONTRACTS.md) — flag-gated
- Events: access.observation.created, access.evidence.superseded, access.dispute.opened, access.verification.completed
- Must not auto-publish AI or community observations to AccessPlace without human change review where required

## 15. Permission model
Public read of published place summaries only when deliberately published. Write: contributor roles scoped; assessor verification elevated; admin audit. Participant passport data never stored as place facts.

## 16. Consent requirements
- Contributor identity sharing optional; default private contributor mode where supported
- No passport attributes written into graph entities
- Organisation-supplied data requires organisation authority

## 17. Human approval gates
- Change review before overwriting published place capabilities (autoOverwriteBlocked)
- Promotion from AI inferred → independently verified requires assessor or accredited workflow
- Accreditation publication to graph requires Epic 06 human decision

## 18. Accessibility acceptance criteria
- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)

## 19. Privacy requirements
- Minimum-necessary disclosure of contributor identity
- No diagnosis or passport requirements in graph records
- Retention/expiry policies on observations

## 20. Safeguarding requirements
- Do not encode personal safety scores
- Hazard observations are environmental facts with provenance — not participant risk ratings
- Escalation to human moderators for malicious/false reports

## 21. AI use, if any
Optional classification/extraction only when Epic 04 bridges in; outputs must remain AI INFERRED — UNVERIFIED. Prefer deterministic taxonomy mapping.

## 22. AI prohibited decisions
- Awarding verification or accreditation from model output alone
- Presenting inferred door widths / ramp presence as verified measurements
- Silent overwrite of AccessPlace from AI

## 23. AI eval requirements
- normal success
- missing evidence
- conflicting evidence
- stale information
- user refuses recommendation
- user revokes consent
- delegate lacks authority
- required tool unavailable
- unsafe requested action
- disclosure attempt
- hallucinated accessibility fact
- incorrect funding claim
- escalation required
- accessibility fallback required

## 24. Audit requirements
- Append-only envelopes and change reviews
- AuditEvent on verification decisions and dispute resolutions
- Assessor identity recorded on verified publications

## 25. Observability requirements
- Evidence freshness metrics
- Verification backlog
- Dispute rate / false report rate
- Coverage % places with feature-level evidence

## 26. Complaints / correction path
Place report + AccessChangeReview + engagement Complaint path for systemic issues; corrections never silently delete history.

## 27. Feature flags
- MAPABLE_ACCESS_INFRASTRUCTURE_* / indoor / intelligence-next flags (default false)
- No public Living Access Fabric claim (claim.living_access_fabric_live prohibited)

## 28. Failure and fallback behaviour
If evidence missing/stale → show uncertain, not inaccessible/accessible. Non-AI list/filter UI always available. Rollback via feature flags.

## 29. Security requirements
- Zod at API boundaries; no client-asserted verificationStatus
- IDOR-safe place writes; server-derived actor
- Rate-limit contribution endpoints; sanitize free-text notes (ingestion shield when implemented)
- Do not log exact contributor PII in analytics

## 30. Definition of Ready
- Problem evidence (G0) and disability-led co-design plan (G1)
- Taxonomy version agreed; AccessPlace ownership confirmed
- Freeze waiver or freeze lift for implementation
- Feature flags and rollback documented

## 31. Definition of Done
- Observation supports full provenance fields
- AI inferred cannot equal verified
- Freshness/expiry enforced in read APIs
- Tests for dispute and supersession
- Manual a11y for any user-facing contributor UI
- No public claim promotion without registry gates

## 32. MVP acceptance criteria
- Taxonomy + AccessPlace feature schema with provenance on new observations
- Community vs assessor source distinction visible in UI
- Internal read API with confidence/freshness

## 33. Pilot acceptance criteria
- Limited venue cohort; monitoring; rollback; dispute handling
- Assessor verification workflow exercised end-to-end

## 34. Scale acceptance criteria
- Coverage and freshness KPIs met; false report rate within threshold
- Continuous assurance (G6) dashboards live

## 35. KPIs
- % places with feature-level evidence
- Evidence freshness distribution
- Verified vs inferred observation ratio
- Successful corrections / dispute resolution time
- False/inaccurate accessibility report rate

## 36. Risks
- Parallel place registries / second SoT
- AI inference presented as fact
- Stale data causing unsafe journeys

## 37. Mitigations
- Parallel place registries / second SoT → Enforce C-011 AccessPlace; CI domain ownership
- AI inference presented as fact → Hard provenance enum; UI honesty labels; evals
- Stale data causing unsafe journeys → Expiry engine; uncertain state; claim.route_personally_safe prohibited

| Risk | Mitigation |
| --- | --- |
| Parallel place registries / second SoT | Enforce C-011 AccessPlace; CI domain ownership |
| AI inference presented as fact | Hard provenance enum; UI honesty labels; evals |
| Stale data causing unsafe journeys | Expiry engine; uncertain state; claim.route_personally_safe prohibited |

## 38. Dependencies
- Existing AccessPlace map stack
- Ontology seeds
- AuditEvent

## 39. Recommended owner / team
Access Infrastructure / Living Access Fabric owners (lib/access/**)

## 40. Delivery horizon
Foundation — Priority 0 (Foundation Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Independent verification sample of place features
- Manual AT evidence for contributor UI
- Freshness SLA evidence
- Public claim registry gate for any external 'live graph' language

---

## Features (4–8)

### 01-f1 — Canonical accessibility taxonomy
**Disposition:** EXTEND  
**Summary:** Versioned ontology for access domains and features.  
**Reuse paths:** `lib/access/intelligence-next/ontology/`, `docs/access-infrastructure/ONTOLOGY.md`  
**Acceptance:**
- Versioned concepts
- No diagnosis concepts as matching keys

### 01-f2 — Place and feature schema
**Disposition:** REUSE  
**Summary:** Feature-level capabilities on AccessPlace without second place SoT.  
**Reuse paths:** `AccessPlace`, `AccessPlaceFeature`, `AccessCapabilityRecord`  
**Acceptance:**
- C-011 preserved
- Unknown ≠ inaccessible

### 01-f3 — Evidence provenance system
**Disposition:** EXTEND  
**Summary:** Append-only evidence envelopes with source classes.  
**Reuse paths:** `AccessEvidenceEnvelopeRecord`, `lib/access/intelligence-next/evidence/`  
**Acceptance:**
- source/timestamp/evidence type/verification/confidence/expiry/dispute fields

### 01-f4 — Observation workflow
**Disposition:** EXTEND  
**Summary:** Create observations with honest default statuses.  
**Reuse paths:** `AccessObservationRecord`  
**Acceptance:**
- AI defaults to AI inferred unverified
- Community defaults to community_reported

### 01-f5 — Verification workflow
**Disposition:** EXTEND  
**Summary:** Human/assessor verification with identity and audit.  
**Reuse paths:** `AccessChangeReviewRecord`, `AccessProvenanceStatus`  
**Acceptance:**
- No silent overwrite
- Assessor identity recorded

### 01-f6 — Freshness and expiry engine
**Disposition:** EXTEND  
**Summary:** Policies expire stale evidence into outdated/unknown.  
**Reuse paths:** `lib/access/intelligence-next/evidence/freshness-policy.ts`  
**Acceptance:**
- Expired evidence cannot present as current verified

### 01-f7 — Correction and dispute workflow
**Disposition:** EXTEND  
**Summary:** Disputes and corrections with history.  
**Reuse paths:** `AccessPlaceReport`, `AccessChangeReviewRecord`  
**Acceptance:**
- History retained
- Complaint path linked

### 01-f8 — Access Graph internal API
**Disposition:** EXTEND  
**Summary:** Flag-gated internal contracts for graph reads.  
**Reuse paths:** `docs/access-infrastructure/API_CONTRACTS.md`, `packages/contracts`  
**Acceptance:**
- Zod boundaries
- No passport leakage


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if disability community + ops evidence shows unreliable/missing access data harms journeys; FAIL if only vendor interest.
- **G1:** PASS if paid co-design with disabled people on taxonomy/labels/confidence UX; FAIL if internal-only design.
- **G2:** PASS if rights/privacy/safeguarding review clears provenance honesty and no universal score; FAIL if claim language overreaches.
- **G3:** PASS if end-to-end observation→provenance→read with freshness on one place type; FAIL if UI invents verified status.
- **G4:** PASS if flagged limited cohort, monitoring, rollback, dispute process; FAIL if public claim enabled.
- **G5:** PASS if freshness/accuracy/dispute KPIs support scale; FAIL if high false-report rate unresolved.
- **G6:** PASS if continuous monitoring of freshness, disputes, accessibility regressions; FAIL if unmonitored drift.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
