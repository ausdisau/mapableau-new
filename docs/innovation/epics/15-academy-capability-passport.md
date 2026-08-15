# EPIC 15 — MapAble Academy + Capability Passport

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-15` / `academy-capability-passport` |
| Priority | P2 |
| Delivery horizon | Participation |
| Wave | Participation Wave |
| Current claim state | **Implemented, not independently verified** |
| Dependencies | EPIC-09 |
| Recommended owner | Provider academy / workforce passport owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Academy + Capability Passport

## 2. Epic ID / proposed slug
`EPIC-15` · `academy-capability-passport`

## 3. Strategic outcome
Shared learning layer where completion creates pending evidence — never automatic demonstrated competence.

## 4. Participant outcome
Workers/drivers/assessors upskill with honest capability signals integrated to credentials.

## 5. Problem statement
Training completion is often misread as competence; credentials and academy stores diverge.

## 6. Scope
- Courses, competency assessment, evidence, expiry, refresher, role requirements, capability passport, credential integration

## 7. Explicit non-goals
- Course completion = demonstrated professional competence where supervised practice/registration required
- claim.academy_equals_competency
- Auto-verify passport evidence

## 8. User groups
- Support workers
- Drivers
- Assessors
- Providers
- Employers
- Venue staff
- MapAble personnel

## 9. Example user journeys
- Complete course → pending competency proposal → human verifies → credential link

## 10. Functional capabilities
- Enroll
- Completions
- Pending proposals
- Human verify
- Expiry/refresher

## 11. Shared Core dependencies
- TrainingCompletionRecord
- AcademyCompetencyProposal
- WorkerTrustCredential
- provider academy

## 12. Cross-Epic dependencies
- EPIC-09

## 13. Data entities
- TrainingRequirement
- TrainingCompletionRecord
- AcademyCompetencyProposal
- provider academy enrollments

## 14. APIs / events required
- /api/academy/enroll
- academy.completion.recorded
- competency.proposed
- competency.verified

## 15. Permission model
Org enroll; human verifiers; participants don't see fake competence badges.

## 16. Consent requirements
- Learner records purpose-limited to employment/compliance

## 17. Human approval gates
- Competency verification human-only

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
- Minimize learner PII in analytics

## 20. Safeguarding requirements
- Training ≠ safeguarding clearance alone

## 21. AI use, if any
Optional tutoring drafts — not competency grant.

## 22. AI prohibited decisions
- Auto competency verification
- Academy equals competence claims

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
- Proposal and verification

## 25. Observability requirements
- Pending→verified lag
- Expiry of training

## 26. Complaints / correction path
Appeal failed verification.

## 27. Feature flags
- Provider academy permissions exist; public competence claims prohibited

## 28. Failure and fallback behaviour
Manual training registers; flag off AI tutoring.

## 29. Security requirements
- No client-set verified competency
- Org scoping

## 30. Definition of Ready
- Competence vs completion language locked
- Role requirement matrix

## 31. Definition of Done
- Completion→pending only
- Human verify
- Credential integration
- Honesty in UI

## 32. MVP acceptance criteria
- Enroll→complete→pending proposal→human verify for one role

## 33. Pilot acceptance criteria
- One provider org

## 34. Scale acceptance criteria
- Cross-role passport; refresher SLAs

## 35. KPIs
- Pending verification lag
- Expired training rate
- False competence claim incidents (target zero)

## 36. Risks
- UI implies competence from completion
- Duplicate training SoTs

## 37. Mitigations
- UI implies competence from completion → Copy + claim registry + tests
- Duplicate training SoTs → Adapter pattern O8; no auto-verify

| Risk | Mitigation |
| --- | --- |
| UI implies competence from completion | Copy + claim registry + tests |
| Duplicate training SoTs | Adapter pattern O8; no auto-verify |

## 38. Dependencies
- Epic 09
- provider academy

## 39. Recommended owner / team
Provider academy / workforce passport owners

## 40. Delivery horizon
Participation (Participation Wave)

## 41. Current claim state
**Implemented, not independently verified** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- O8 adapter tests
- UI honesty review

---

## Features (4–8)

### 15-f1 — Course catalogue and enroll
**Disposition:** REUSE  
**Summary:** Existing academy enroll.  
**Reuse paths:** `/academy`, `provider_academy:enroll`  
**Acceptance:**
- Permissioned

### 15-f2 — Completion records with expiry
**Disposition:** REUSE  
**Summary:** TrainingCompletionRecord.  
**Reuse paths:** `TrainingCompletionRecord`  
**Acceptance:**
- Expiry fields

### 15-f3 — Pending competency proposals
**Disposition:** REUSE  
**Summary:** Completion → pending evidence.  
**Reuse paths:** `AcademyCompetencyProposal`  
**Acceptance:**
- Never auto-verified

### 15-f4 — Human competency verification
**Disposition:** EXTEND  
**Summary:** Verifier workflow.  
**Reuse paths:** `workforce passport adapter`  
**Acceptance:**
- Human only

### 15-f5 — Capability passport view
**Disposition:** EXTEND  
**Summary:** Role requirements vs evidence.  
**Reuse paths:** `workforce readiness`  
**Acceptance:**
- Reason codes

### 15-f6 — Credential network integration
**Disposition:** EXTEND  
**Summary:** Link to Epic 09.  
**Reuse paths:** `WorkerTrustCredential`  
**Acceptance:**
- Supersession

### 15-f7 — Refresher and role requirements
**Disposition:** EXTEND  
**Summary:** Renewal cadences.  
**Reuse paths:** `TrainingRequirement`  
**Acceptance:**
- Reminders


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if competence/completion confusion harms trust.
- **G1:** PASS if worker/participant input on honest badges.
- **G2:** PASS if regulatory review of competence claims.
- **G3:** PASS if pending proposal path proven.
- **G4:** PASS if org pilot.
- **G5:** PASS if false-competence incidents zero.
- **G6:** PASS if continuous expiry/competence monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
