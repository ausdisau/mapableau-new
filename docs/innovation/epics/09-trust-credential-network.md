# EPIC 09 — Trust & Credential Network

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-09` / `trust-credential-network` |
| Priority | P0 |
| Delivery horizon | Foundation |
| Wave | Foundation Wave |
| Current claim state | **Implemented, not independently verified** |
| Dependencies | None (foundation) |
| Recommended owner | Workforce / Trust fabric owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Trust & Credential Network

## 2. Epic ID / proposed slug
`EPIC-09` · `trust-credential-network`

## 3. Strategic outcome
Shared credential infrastructure so expiry never silently becomes approval.

## 4. Participant outcome
Participants encounter workers/drivers/assessors with current, verifiable credentials — not silent expired approvals.

## 5. Problem statement
Credentials fragmented; expiry and suspension handling inconsistent; risk of silent approval.

## 6. Scope
- Workers, providers, drivers, vehicles, assessors, employers, organisations, training records
- Source, issuer, evidence, issue/expiry, verification, suspension, supersession, review, renewal reminders, exception workflow

## 7. Explicit non-goals
- Silent expiry→approval
- Academy completion as competency (Epic 15)
- Auto worker assignment from credentials

## 8. User groups
- Workers
- Drivers
- Assessors
- Providers
- Compliance ops
- Participants (assurance consumers)

## 9. Example user journeys
- Driver credential nearing expiry → reminder → suspension blocks assignment

## 10. Functional capabilities
- Credential registry
- Verification
- Expiry enforcement
- Exception workflow
- Renewal reminders

## 11. Shared Core dependencies
- WorkerTrustCredential
- TrainingCompletionRecord
- Transport driver verification
- AuditEvent

## 12. Cross-Epic dependencies
- None

## 13. Data entities
- WorkerTrustCredential
- WorkerCredentialEvidence
- TrainingCompletionRecord
- TransportDriverVerification

## 14. APIs / events required
- credential.expiring
- credential.suspended
- credential.verified

## 15. Permission model
Org-scoped credential admin; participants see verification status not raw documents by default.

## 16. Consent requirements
- Worker consent for verification checks

## 17. Human approval gates
- Exception workflow human-reviewed
- Suspension decisions

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
- Minimize credential document exposure
- Purpose-bound verifier access

## 20. Safeguarding requirements
- Expired WWCC-like credentials must block — never silent approve

## 21. AI use, if any
Renewal reminders / doc extraction drafts only.

## 22. AI prohibited decisions
- Auto-approve credentials
- Treat training as competency

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
- Status transitions
- Exception approvals

## 25. Observability requirements
- Expiry exceptions
- Suspension lag

## 26. Complaints / correction path
Worker/provider appeal of suspension.

## 27. Feature flags
- Transport verification claims gated per feature-status.ts

## 28. Failure and fallback behaviour
Fail closed on assignment when credential status unknown/expired.

## 29. Security requirements
- Issuer verification
- Tamper-evident evidence refs
- No client-set verified status

## 30. Definition of Ready
- Credential types inventory
- Fail-closed assignment matrix

## 31. Definition of Done
- Expiry blocks consequential actions
- Reminders
- Audit

## 32. MVP acceptance criteria
- Worker + driver expiry enforcement on assignment paths

## 33. Pilot acceptance criteria
- One org cohort

## 34. Scale acceptance criteria
- Cross-role network; exception SLAs

## 35. KPIs
- Credential-expiry exceptions
- Suspension enforcement rate

## 36. Risks
- Silent expiry approval
- Duplicate credential systems in verticals

## 37. Mitigations
- Silent expiry approval → Fail closed; tests
- Duplicate credential systems in verticals → Shared network EXTEND only

| Risk | Mitigation |
| --- | --- |
| Silent expiry approval | Fail closed; tests |
| Duplicate credential systems in verticals | Shared network EXTEND only |

## 38. Dependencies
- Workforce readiness
- Transport eligibility

## 39. Recommended owner / team
Workforce / Trust fabric owners

## 40. Delivery horizon
Foundation (Foundation Wave)

## 41. Current claim state
**Implemented, not independently verified** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Fail-closed assignment tests
- Pilot exception metrics

---

## Features (4–8)

### 09-f1 — Shared credential model
**Disposition:** EXTEND  
**Summary:** Extend beyond worker-only.  
**Reuse paths:** `WorkerTrustCredential`  
**Acceptance:**
- Drivers/assessors/vehicles modelled

### 09-f2 — Verification and issuer evidence
**Disposition:** EXTEND  
**Summary:** Source/issuer/evidence.  
**Reuse paths:** `WorkerCredentialEvidence`  
**Acceptance:**
- verificationMethod honest

### 09-f3 — Expiry suspension supersession
**Disposition:** EXTEND  
**Summary:** Lifecycle.  
**Reuse paths:** `credential status enums`  
**Acceptance:**
- Expired blocks

### 09-f4 — Renewal reminders
**Disposition:** NEW  
**Summary:** Notify before expiry.  
**Reuse paths:** `notifications`  
**Acceptance:**
- Human-approved notifications

### 09-f5 — Exception workflow
**Disposition:** NEW  
**Summary:** Human-reviewed exceptions.  
**Reuse paths:** `AuditEvent`  
**Acceptance:**
- Never silent

### 09-f6 — Assignment eligibility bridge
**Disposition:** EXTEND  
**Summary:** Care/Transport check credentials.  
**Reuse paths:** `workforce readiness`, `transport eligibility`  
**Acceptance:**
- Fail closed


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if expiry/silent-approval incidents or near-misses evidenced.
- **G1:** PASS if worker/participant input on transparency of checks.
- **G2:** PASS if safeguarding/privacy review of credential data.
- **G3:** PASS if expired credential blocks one assignment path.
- **G4:** PASS if org pilot; monitoring.
- **G5:** PASS if exception KPIs acceptable.
- **G6:** PASS if continuous expiry monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
