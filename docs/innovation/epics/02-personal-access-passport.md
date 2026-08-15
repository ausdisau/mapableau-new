# EPIC 02 — Personal Access Passport

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-02` / `personal-access-passport` |
| Priority | P0 |
| Delivery horizon | Foundation |
| Wave | Foundation Wave |
| Current claim state | **In development** |
| Dependencies | EPIC-01 |
| Recommended owner | Access Infrastructure + Consent owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Personal Access Passport

## 2. Epic ID / proposed slug
`EPIC-02` · `personal-access-passport`

## 3. Strategic outcome
Participant-controlled reusable access-needs profile for matching — not a universal disability disclosure record.

## 4. Participant outcome
People control what access requirements exist, who sees them, for what purpose, and for how long — with receipts and revocation.

## 5. Problem statement
Participants repeatedly restate access needs; sharing is all-or-nothing; diagnosis is often wrongly treated as matching input.

## 6. Scope
- Wheelchair dimensions, step-free, doorway, transfer, communication/AAC, sensory, support-person, toilet, assistance animal, vehicle, fatigue/rest needs
- Granular sharing: venues, workers, drivers, providers, employers, assessors, AI systems, emergency, analytics
- Consent purpose, disclosure receipt, expiry, revocation, access log, participant review

## 7. Explicit non-goals
- Clinical dossier or diagnosis-required matching
- Automatic disclosure to employers via Jobs
- Public Access API exposure of passport attributes
- Merging AccessibilityProfile (UI prefs) into functional passport SoT

## 8. User groups
- Participants
- Delegates with ParticipantAuthorityGrant
- Workers/drivers/providers receiving scoped disclosures
- Assessors (scoped)

## 9. Example user journeys
- Participant builds functional requirements; default private
- Shares minimum doorway + step-free with a venue for one visit; expiry set; receipt issued
- Revokes employer share before interview; access log shows prior disclosure
- Delegate with grant helps edit AAC prefs; cannot broaden disclosure beyond grant

## 10. Functional capabilities
- Functional requirement editor
- Granular purpose-bound sharing
- Disclosure receipts and access log
- Expiry and revocation
- Participant review and Easy Read/AAC pathways
- Non-diagnosis matching contract

## 11. Shared Core dependencies
- AccessPassport (C-010)
- AccessRequirementRecord
- ConsentRecord/ConsentReceipt
- ParticipantAuthorityGrant
- AuditEvent

## 12. Cross-Epic dependencies
- EPIC-01

## 13. Data entities
- AccessPassport
- AccessRequirementRecord
- ConsentRecord
- ConsentReceipt
- AccessibilityProfile (presentation only)

## 14. APIs / events required
- GET/PATCH /api/access-infrastructure/passport (flag-gated)
- Events: passport.requirement.updated, passport.disclosure.granted, passport.disclosure.revoked

## 15. Permission model
Owner participant full control. Delegates only within ParticipantAuthorityGrant. Recipients see only granted attributes for purpose/window.

## 16. Consent requirements
- Purpose-bound consent before any disclosure
- Micro-consent for AI tool access to passport fields
- Emergency context still purpose-scoped and audited

## 17. Human approval gates
- Broadening disclosure scopes beyond prior consent requires fresh consent
- Delegate escalation when grant insufficient

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
- Minimum-necessary attribute disclosure
- No diagnosis in matching payloads
- Retention aligned to purpose expiry

## 20. Safeguarding requirements
- Emergency disclosure boundaries documented; not a backdoor to full profile
- Human review for contested delegate misuse

## 21. AI use, if any
May read only consented attributes for orchestration/search; never infer requirements from diagnosis.

## 22. AI prohibited decisions
- Infer requirements from diagnosis
- Disclose passport to tools without consent gate
- Silently expand disclosure scopes

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
- Disclosure grants/revocations
- Access log of recipient reads
- Delegate edits

## 25. Observability requirements
- Revocation success rate
- Consent comprehension proxies
- Unauthorised disclosure incidents (target zero)

## 26. Complaints / correction path
Participant correction path for wrong requirements; Complaint for unauthorised disclosure.

## 27. Feature flags
- Access infrastructure passport writers flag-gated
- MAPABLE_AI_* consent gates for AI reads

## 28. Failure and fallback behaviour
If sharing service fails, default deny disclosure. Non-AI form editor always available.

## 29. Security requirements
- Server-side ownership checks
- No client-supplied disclosureScopes elevation
- Field-level redaction in logs

## 30. Definition of Ready
- Co-design of sharing model (G1)
- Consent receipt field gaps identified for EXTEND
- Freeze waiver if implementing

## 31. Definition of Done
- Granular scopes enforced server-side
- Receipts include purpose/expiry
- Diagnosis excluded from matching
- Revocation immediate

## 32. MVP acceptance criteria
- Passport CRUD + private default + basic share to provider with receipt

## 33. Pilot acceptance criteria
- Limited participants; revocation tested; delegate path tested

## 34. Scale acceptance criteria
- Unauthorised disclosure = 0; comprehension/Easy Read available

## 35. KPIs
- Consent comprehension
- Disclosure revocation success
- Participant override rate
- Unauthorised disclosure incidents

## 36. Risks
- Passport becomes universal disclosure record
- ConsentReceipt missing expiry/supersession
- Second consent SoT

## 37. Mitigations
- Passport becomes universal disclosure record → Attribute-level scopes; employer default false; public API ban
- ConsentReceipt missing expiry/supersession → EXTEND ConsentReceipt before scale claims
- Second consent SoT → Reuse lib/consent only

| Risk | Mitigation |
| --- | --- |
| Passport becomes universal disclosure record | Attribute-level scopes; employer default false; public API ban |
| ConsentReceipt missing expiry/supersession | EXTEND ConsentReceipt before scale claims |
| Second consent SoT | Reuse lib/consent only |

## 38. Dependencies
- Epic 01 taxonomy for ontologyConceptId
- Consent/authority services

## 39. Recommended owner / team
Access Infrastructure + Consent owners

## 40. Delivery horizon
Foundation (Foundation Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Participant co-design sign-off
- Unauthorised disclosure tests
- Manual AT on passport editor

---

## Features (4–8)

### 02-f1 — Functional requirement editor
**Disposition:** EXTEND  
**Summary:** Participant-owned AccessRequirement CRUD.  
**Reuse paths:** `AccessPassport`, `AccessRequirementRecord`  
**Acceptance:**
- Criticality/context/timing/assistance fields
- userConfirmed

### 02-f2 — Granular sharing controls
**Disposition:** EXTEND  
**Summary:** Per-recipient-class attribute scopes.  
**Reuse paths:** `disclosureScopes`, `ConsentRecord`  
**Acceptance:**
- Employer share default off
- AI scope explicit

### 02-f3 — Purpose-bound consent and receipts
**Disposition:** EXTEND  
**Summary:** Consent purpose + ConsentReceipt EXTEND.  
**Reuse paths:** `lib/consent/`  
**Acceptance:**
- Purpose, fields, expiry, revocation

### 02-f4 — Expiry revocation and access log
**Disposition:** EXTEND  
**Summary:** Time-boxed shares and read audit.  
**Reuse paths:** `AuditEvent`, `ConsentReceipt`  
**Acceptance:**
- Immediate revoke
- Recipient read logged

### 02-f5 — Participant review experience
**Disposition:** NEW  
**Summary:** Who has what, for what purpose.  
**Reuse paths:** `dashboard consent patterns`  
**Acceptance:**
- Plain language
- Easy Read path

### 02-f6 — AAC and Easy Read pathways
**Disposition:** EXTEND  
**Summary:** Accessible communication of passport content.  
**Reuse paths:** `docs/co-design-protocol.md`, `MAPABLE_AAC_COMMUNICATION_ENABLED`  
**Acceptance:**
- Voice-independent
- AAC-compatible

### 02-f7 — Non-diagnosis matching contract
**Disposition:** REUSE  
**Summary:** Hard deny diagnosis as matching input.  
**Reuse paths:** `ACCESS_FRAMEWORK.md`, `containsDiagnosis flag`  
**Acceptance:**
- Matching payloads exclude diagnosis


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if participants evidence repeated disclosure burden and oversharing harm.
- **G1:** PASS if disability-led co-design of sharing labels and Easy Read; FAIL if designer-only.
- **G2:** PASS if privacy/consent/dignity-of-risk review clears; FAIL if diagnosis required.
- **G3:** PASS if create requirement → share scoped → revoke with receipt.
- **G4:** PASS if limited cohort; zero unauthorised disclosure in pilot.
- **G5:** PASS if revocation/comprehension KPIs met.
- **G6:** PASS if continuous consent-failure monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
