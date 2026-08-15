# EPIC 10 — Funding & Payment Integrity Engine

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-10` / `funding-payment-integrity` |
| Priority | P2 |
| Delivery horizon | Controlled Intelligence |
| Wave | Controlled Intelligence Wave |
| Current claim state | **In development** |
| Dependencies | EPIC-09 |
| Recommended owner | Billing / AbilityPay owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Funding & Payment Integrity Engine

## 2. Epic ID / proposed slug
`EPIC-10` · `funding-payment-integrity`

## 3. Strategic outcome
Advisory financial evidence and integrity layer — human review for high-impact funding decisions.

## 4. Participant outcome
Clearer quotes/invoices with anomaly flags — never false certainty of NDIS claimability.

## 5. Problem statement
Participants face opaque pricing and risky AI claim language; live NDIA submit must stay off.

## 6. Scope
- Pricing explanations, quote comparison, service evidence, invoice anomalies, duplicates, rate comparison, participant review, draft funding questions, reconciliation assistance

## 7. Explicit non-goals
- “Definitely NDIS claimable” without authoritative deterministic rule + current source
- Live NDIA submission
- Auto payment/invoice approval
- claim.billing_xero_live / claim.ndia_live_submission

## 8. User groups
- Participants
- Plan managers
- Providers
- Billing ops

## 9. Example user journeys
- Invoice anomaly flagged → participant reviews → human approves

## 10. Functional capabilities
- Anomaly detection
- Explanations
- Reconciliation assist
- Advisory wording

## 11. Shared Core dependencies
- BillingInvoice
- AbilityPay
- Stripe adapters
- billing copilots
- AuditEvent

## 12. Cross-Epic dependencies
- EPIC-09

## 13. Data entities
- BillingInvoice
- BillingInvoiceLineItem
- BillingSafeguardAlert
- quotes

## 14. APIs / events required
- invoice.anomaly.flagged
- funding.advice.drafted

## 15. Permission model
Participant/PM/provider scoped; no ambient financial AI authority.

## 16. Consent requirements
- Financial data purpose limits

## 17. Human approval gates
- High-impact funding decisions
- Payment approval

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
- Minimize financial PII in AI prompts
- Redaction in logs

## 20. Safeguarding requirements
- Financial exploitation signals escalate to humans — AI does not determine

## 21. AI use, if any
Explain, compare, draft questions, low-risk anomaly detection.

## 22. AI prohibited decisions
- Definitive claimability without deterministic rule
- Auto-approve payment
- Live NDIA submit

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
- incorrect funding claim

## 24. Audit requirements
- Advice drafts
- Approvals
- Anomaly resolutions

## 25. Observability requirements
- Anomaly precision
- Unsupported-claim rate

## 26. Complaints / correction path
Billing disputes via Complaint + invoice flows.

## 27. Feature flags
- MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED=false
- billing AI flags default false

## 28. Failure and fallback behaviour
Deterministic invoice UI without AI; human billing support.

## 29. Security requirements
- PCI scope isolation
- verifyPayloadSafe on free-text invoice notes
- Idempotent payments

## 30. Definition of Ready
- Wording standards
- Deterministic rule registry design

## 31. Definition of Done
- Advisory wording enforced
- Human approval for high-impact
- Evals for funding claims

## 32. MVP acceptance criteria
- Anomaly flags + advisory explanation on BillingInvoice

## 33. Pilot acceptance criteria
- PM cohort; no live NDIA

## 34. Scale acceptance criteria
- After G5 integrity metrics

## 35. KPIs
- Unsupported-claim rate
- Participant review rate
- Duplicate detection precision

## 36. Risks
- False claimability language
- Auto-approval creep

## 37. Mitigations
- False claimability language → Copy + evals + deterministic gate
- Auto-approval creep → Hard flags; financial boundaries docs

| Risk | Mitigation |
| --- | --- |
| False claimability language | Copy + evals + deterministic gate |
| Auto-approval creep | Hard flags; financial boundaries docs |

## 38. Dependencies
- Billing Centre
- Epic 09 for provider trust signals

## 39. Recommended owner / team
Billing / AbilityPay owners

## 40. Delivery horizon
Controlled Intelligence (Controlled Intelligence Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Eval suite
- No live submit proof

---

## Features (4–8)

### 10-f1 — Invoice evidence and anomaly rules
**Disposition:** EXTEND  
**Summary:** Deterministic checks first.  
**Reuse paths:** `BillingSafeguardAlert`, `lib/billing`  
**Acceptance:**
- Rules versioned

### 10-f2 — Advisory explanation layer
**Disposition:** EXTEND  
**Summary:** Potential pathway wording.  
**Reuse paths:** `billing copilots`  
**Acceptance:**
- No definitive claimability

### 10-f3 — Quote comparison
**Disposition:** EXTEND  
**Summary:** Participant-facing compare.  
**Reuse paths:** `transport quotes`, `billing`  
**Acceptance:**
- Estimate labels

### 10-f4 — Participant review workflow
**Disposition:** EXTEND  
**Summary:** Human review queue.  
**Reuse paths:** `BillingInvoiceApproval`  
**Acceptance:**
- Pending default

### 10-f5 — Reconciliation assistance
**Disposition:** EXTEND  
**Summary:** Draft reconciliations.  
**Reuse paths:** `AbilityPay`  
**Acceptance:**
- Human finalize

### 10-f6 — Funding question drafts
**Disposition:** NEW  
**Summary:** Draft questions for humans.  
**Reuse paths:** `AI platform`  
**Acceptance:**
- Not determinations


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if billing opacity/anomaly harm evidenced.
- **G1:** PASS if participant co-design of advisory language.
- **G2:** PASS if financial/regulatory boundary review.
- **G3:** PASS if anomaly→review on sandbox invoices.
- **G4:** PASS if pilot; NDIA submit remains off.
- **G5:** PASS if unsupported-claim rate below threshold.
- **G6:** PASS if continuous financial AI monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
