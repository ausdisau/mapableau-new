# EPIC 11 — Employment Accessibility Graph

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-11` / `employment-accessibility-graph` |
| Priority | P2 |
| Delivery horizon | Participation |
| Wave | Participation Wave |
| Current claim state | **In development** |
| Dependencies | EPIC-01, EPIC-02, EPIC-03 |
| Recommended owner | Jobs / employment owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Employment Accessibility Graph

## 2. Epic ID / proposed slug
`EPIC-11` · `employment-accessibility-graph`

## 3. Strategic outcome
Jobs beyond matching: job ↔ skills ↔ workplace access ↔ adjustments ↔ transport ↔ optional support — with candidate-controlled disclosure.

## 4. Participant outcome
Use Jobs without automatically revealing disability, diagnosis, or support needs to employers.

## 5. Problem statement
Employment barriers are access and transport as much as skills; disclosure is often forced.

## 6. Scope
- Workplace accessibility profiles, adjustment requests, interview accessibility, commute accessibility, support coordination, employer access improvements, placement sustainability

## 7. Explicit non-goals
- Forced disability disclosure
- Auto-share Access Passport with employers
- Worthiness scores

## 8. User groups
- Candidates
- Employers
- Support coordinators
- Ambassadors

## 9. Example user journeys
- Apply with skills only; separately request interview adjustments without diagnosis
- Commute accessibility check using Navigate + Passport before accepting interview

## 10. Functional capabilities
- Workplace access profiles
- Disclosure preview
- Adjustment requests
- Commute fit
- Retention follow-up

## 11. Shared Core dependencies
- Job/JobApplication
- InterviewAdjustmentRequest
- AccessPlace workplaces
- AccessPassport
- Transport

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-02
- EPIC-03

## 13. Data entities
- Job
- JobApplication
- ApplicationDisclosurePreview
- InterviewAdjustmentRequest
- EmploymentProfile

## 14. APIs / events required
- /api/jobs/*
- adjustment.requested
- disclosure.previewed

## 15. Permission model
shareAdjustments default false; employer sees only consented fields.

## 16. Consent requirements
- Candidate-controlled disclosure
- Purpose: recruitment vs workplace adjustment separate

## 17. Human approval gates
- Employer access improvement programmes
- Support coordination

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
- No diagnosis required
- Minimum disclosure

## 20. Safeguarding requirements
- No participant worthiness/risk scores

## 21. AI use, if any
Match explanations; commute options — not disclosure.

## 22. AI prohibited decisions
- Auto-disclose disability
- Worthiness ranking

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
- Disclosure previews
- Adjustment fulfilment

## 25. Observability requirements
- Interview accessibility
- Adjustment fulfilment
- 13/26/52 retention

## 26. Complaints / correction path
Discrimination/adjustment complaints path.

## 27. Feature flags
- Starting Work pilot synthetic — claim.starting_work_live prohibited

## 28. Failure and fallback behaviour
Standard job apply forms without AI matching overlay.

## 29. Security requirements
- Employer IDOR
- Disclosure field allowlists

## 30. Definition of Ready
- Disclosure UX co-design
- Workplace AccessPlace linkage design

## 31. Definition of Done
- Jobs usable without disability reveal
- Commute fit optional
- Adjustment workflow

## 32. MVP acceptance criteria
- Disclosure preview + interview adjustment + workplace access evidence link

## 33. Pilot acceptance criteria
- Starting Work style controlled pilot honesty

## 34. Scale acceptance criteria
- Retention KPIs

## 35. KPIs
- Interview accessibility
- Placement rate
- Adjustment fulfilment
- Transport sustainability
- 13/26/52-week retention

## 36. Risks
- Accidental disclosure
- Employer pressure UX

## 37. Mitigations
- Accidental disclosure → Default false shares; previews; tests
- Employer pressure UX → Dignity-of-risk + rights review G2

| Risk | Mitigation |
| --- | --- |
| Accidental disclosure | Default false shares; previews; tests |
| Employer pressure UX | Dignity-of-risk + rights review G2 |

## 38. Dependencies
- Epics 01–03
- Jobs module

## 39. Recommended owner / team
Jobs / employment owners

## 40. Delivery horizon
Participation (Participation Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Disclosure IDOR tests
- Pilot retention

---

## Features (4–8)

### 11-f1 — Workplace accessibility profiles
**Disposition:** EXTEND  
**Summary:** Workplaces as Access entities.  
**Reuse paths:** `AccessPlace`, `AccessCapabilityRecord`  
**Acceptance:**
- Linked to jobs

### 11-f2 — Candidate-controlled disclosure
**Disposition:** REUSE  
**Summary:** shareAdjustments default false.  
**Reuse paths:** `JobApplication`, `ApplicationDisclosurePreview`  
**Acceptance:**
- Preview before share

### 11-f3 — Interview adjustment requests
**Disposition:** REUSE  
**Summary:** InterviewAdjustmentRequest flow.  
**Reuse paths:** `InterviewAdjustmentRequest`  
**Acceptance:**
- No diagnosis required

### 11-f4 — Commute accessibility
**Disposition:** EXTEND  
**Summary:** Navigate + passport for interview.  
**Reuse paths:** `Epic 03`, `transportSupportNeeded`  
**Acceptance:**
- Optional

### 11-f5 — Optional support coordination
**Disposition:** EXTEND  
**Summary:** Care/support links.  
**Reuse paths:** `careSupportNeeded`  
**Acceptance:**
- Participant approval

### 11-f6 — Placement sustainability
**Disposition:** EXTEND  
**Summary:** 13/26/52 follow-up.  
**Reuse paths:** `employment outcomes`  
**Acceptance:**
- No worthiness score

### 11-f7 — Employer access improvements
**Disposition:** NEW  
**Summary:** Remediation suggestions to employers.  
**Reuse paths:** `Epic 01 corrections`  
**Acceptance:**
- Voluntary


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if employment access barriers evidenced.
- **G1:** PASS if disability-led disclosure co-design.
- **G2:** PASS if anti-discrimination/privacy review.
- **G3:** PASS if apply without disclosure + adjustment request.
- **G4:** PASS if controlled pilot honest labels.
- **G5:** PASS if placement/adjustment KPIs.
- **G6:** PASS if continuous disclosure-incident monitoring (target zero).

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
