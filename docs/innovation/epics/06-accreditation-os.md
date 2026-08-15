# EPIC 06 — MapAble Accreditation OS

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-06` / `accreditation-os` |
| Priority | P0 |
| Delivery horizon | Foundation |
| Wave | Foundation Wave |
| Current claim state | **Implemented, not independently verified** |
| Dependencies | EPIC-01, EPIC-09 |
| Recommended owner | Quality/Accreditation + Access Mark owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Accreditation OS

## 2. Epic ID / proposed slug
`EPIC-06` · `accreditation-os`

## 3. Strategic outcome
Operational assessment system for voluntary accessibility verification publishing approved facts to the Access Graph.

## 4. Participant outcome
Trustworthy, time-bounded accessibility verification — never misrepresented as legal-compliance certification.

## 5. Problem statement
Accreditation methodology exists in fragments; auto-decision risk; unclear expiry and appeals.

## 6. Scope
- Venue selected → assessor assigned → assessment → measurements → photos/evidence → scoring → human review → remediation → decision → publish to graph → expiry → reassessment
- Versioning, provenance, assessor identity, scoring explanations, remediation, audit, appeals

## 7. Explicit non-goals
- Legal-compliance certification
- Automatic accreditation decisions
- Provider quality scores from participant incidents

## 8. User groups
- Assessors
- Venue operators
- Provider accreditation applicants
- Participants consuming published facts

## 9. Example user journeys
- Assessor completes Access Mark assessment; human decision; facts published with expiry
- Venue appeals score; history immutable

## 10. Functional capabilities
- Assessment versioning
- Evidence packs
- Human decision
- Remediation tracking
- Graph publication
- Appeals

## 11. Shared Core dependencies
- AccessAccreditation*
- ProviderAccreditation*
- QMS standards
- WorkerTrustCredential for assessors
- AuditEvent

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-09

## 13. Data entities
- AccessibilityAccreditationCase
- AccessAccreditationAssessment/Score/Evidence
- ProviderAccreditationApplication/Decision/Appeal

## 14. APIs / events required
- /api/accreditation/*
- accreditation.decision.recorded
- accreditation.facts.published

## 15. Permission model
Assessor and admin queues; venues see own cases; automaticAccreditationDecisionEnabled hardcoded false.

## 16. Consent requirements
- Evidence photos purpose-limited; no passport required for venue accreditation

## 17. Human approval gates
- Accreditation decision human-only
- Publication to graph after decision

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
- Assessor/venue data minimization
- No incident-derived provider scores

## 20. Safeguarding requirements
- Do not conflate accreditation with safeguarding clearance

## 21. AI use, if any
Evidence indexing/summaries only; no decision.

## 22. AI prohibited decisions
- Auto accreditation decision
- Incident-to-score

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
- Full case event history
- Decision actor identity

## 25. Observability requirements
- Time-to-decision
- Expiry backlog
- Appeal rate

## 26. Complaints / correction path
Appeals + Complaint for process issues.

## 27. Feature flags
- MAPABLE_PROVIDER_ACCREDITATION_ENABLED
- MAPABLE_QUALITY_QMS_ENABLED
- auto decision hardcoded false

## 28. Failure and fallback behaviour
Manual assessor paperwork path; flag off.

## 29. Security requirements
- Assessor credential checks via Epic 09
- Tamper-evident evidence refs

## 30. Definition of Ready
- Voluntary verification language locked
- Assessor credential policy

## 31. Definition of Done
- Human decision enforced
- Expiry + reassessment
- Graph publish with provenance
- Appeals

## 32. MVP acceptance criteria
- End-to-end venue assessment → human decision → graph publish for one criterion set

## 33. Pilot acceptance criteria
- Limited assessors/venues; monitoring

## 34. Scale acceptance criteria
- Expiry SLA; appeal SLA

## 35. KPIs
- Assessments completed
- Expiry exceptions
- Appeal resolution time
- Disputed evidence corrections

## 36. Risks
- Marketed as legal compliance
- Auto-decision creep

## 37. Mitigations
- Marketed as legal compliance → Mandatory voluntary verification copy; legal review G2
- Auto-decision creep → Hardcoded false + tests

| Risk | Mitigation |
| --- | --- |
| Marketed as legal compliance | Mandatory voluntary verification copy; legal review G2 |
| Auto-decision creep | Hardcoded false + tests |

## 38. Dependencies
- Epic 01
- Epic 09
- existing quality modules

## 39. Recommended owner / team
Quality/Accreditation + Access Mark owners

## 40. Delivery horizon
Foundation (Foundation Wave)

## 41. Current claim state
**Implemented, not independently verified** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Assessor audit sample
- No auto-decision tests green

---

## Features (4–8)

### 06-f1 — Assessment case workflow
**Disposition:** REUSE  
**Summary:** Case lifecycle with versioning.  
**Reuse paths:** `lib/access/accreditation*`, `lib/accreditation/`  
**Acceptance:**
- Event history

### 06-f2 — Measurement and evidence packs
**Disposition:** EXTEND  
**Summary:** Photos/measurements with provenance.  
**Reuse paths:** `AccessAccreditation* evidence`  
**Acceptance:**
- Assessor identity

### 06-f3 — Scoring explanations
**Disposition:** EXTEND  
**Summary:** Human-readable score rationale.  
**Reuse paths:** `AccessibilityAccreditationScore`  
**Acceptance:**
- Not sole access decision

### 06-f4 — Human review and decision
**Disposition:** REUSE  
**Summary:** Hard block auto-decision.  
**Reuse paths:** `compliance-boundaries.ts`  
**Acceptance:**
- automaticAccreditationDecisionEnabled false

### 06-f5 — Remediation tracking
**Disposition:** REUSE  
**Summary:** Corrective actions.  
**Reuse paths:** `QMS CorrectiveAction`  
**Acceptance:**
- Immutable history

### 06-f6 — Publish approved facts to Access Graph
**Disposition:** EXTEND  
**Summary:** Post-decision publication with expiry.  
**Reuse paths:** `Epic 01 envelopes`  
**Acceptance:**
- Assessor measured / independently verified statuses

### 06-f7 — Expiry reassessment and appeals
**Disposition:** EXTEND  
**Summary:** Time-bounded accreditation.  
**Reuse paths:** `Appeal records`  
**Acceptance:**
- Expired ≠ approved


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if venues/participants need trustworthy voluntary verification.
- **G1:** PASS if disability-led input on what 'verified' means publicly.
- **G2:** PASS if legal review clears non-certification language.
- **G3:** PASS if one case decision→publish→expire path.
- **G4:** PASS if limited pilot; no public overclaim.
- **G5:** PASS if quality KPIs met.
- **G6:** PASS if expiry and appeal monitoring continuous.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
