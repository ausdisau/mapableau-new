# EPIC 04 — Access Intelligence Vision

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-04` / `access-intelligence-vision` |
| Priority | P3 |
| Delivery horizon | R&D |
| Wave | R&D Wave |
| Current claim state | **Exploratory** |
| Dependencies | EPIC-01, EPIC-06 |
| Recommended owner | Access Intelligence + AI platform |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Access Intelligence Vision

## 2. Epic ID / proposed slug
`EPIC-04` · `access-intelligence-vision`

## 3. Strategic outcome
Human-supervised computer-vision accessibility evidence assistant.

## 4. Participant outcome
Faster candidate observations that never silently become verified truth without humans.

## 5. Problem statement
Manual evidence capture is slow; ungoverned CV would invent accessibility facts and fake compliance.

## 6. Scope
- Propose entrances, door-width estimates, ramps, steps, kerb ramps, handrails, signage, accessible parking, toilet features, surfaces, hazards
- All AI outputs initially AI INFERRED — UNVERIFIED
- Verification via community, organisation correction, accredited assessor

## 7. Explicit non-goals
- CV-awarded accreditation or compliance
- Production camera inference without freeze waiver
- Biometric identification

## 8. User groups
- Assessors
- Venue staff
- Community contributors
- MapAble evidence ops

## 9. Example user journeys
- Assessor uploads photo → model proposes ramp candidate → status AI inferred → assessor confirms measurement
- Organisation disputes AI door-width estimate → correction workflow

## 10. Functional capabilities
- Synthetic/shadow lens contracts
- Proposal envelopes
- Human verification bridge to Epic 01/06

## 11. Shared Core dependencies
- AccessEvidenceEnvelopeRecord
- AccessChangeReviewRecord
- AI capability registry
- Kill switches

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-06

## 13. Data entities
- Evidence envelopes with evidenceClasses including vision
- Change reviews

## 14. APIs / events required
- vision.proposal.created
- vision.proposal.rejected
- bridge to Living Access Fabric

## 15. Permission model
Only authorised assessors/venues upload; model cannot publish.

## 16. Consent requirements
- Image capture consent; no bystander face processing as identity

## 17. Human approval gates
- Mandatory human verification before verified status
- Accreditation remains Epic 06 human decision

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
- Minimize EXIF/location leakage
- No face recognition for identity

## 20. Safeguarding requirements
- Hazard proposals are environmental candidates only

## 21. AI use, if any
Classification/extraction of accessibility candidates under shadow/synthetic until promoted.

## 22. AI prohibited decisions
- Accreditation
- Compliance certification
- Verified measurement from vision alone
- Reward-hacking confidence inflation

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
- overconfident door-width estimate
- missed step hazard

## 24. Audit requirements
- Model version, prompt/tool trace, human decision

## 25. Observability requirements
- Precision/recall on labelled sets
- Human reject rate
- Unsupported-claim rate

## 26. Complaints / correction path
Organisation correction + assessor appeal paths.

## 27. Feature flags
- W-VA-1 VisionAccess contracts; inference flags default false
- MAPABLE_AI_PUBLIC_CLAIM_ENABLED=false

## 28. Failure and fallback behaviour
Manual measurement forms always available; disable vision flag.

## 29. Security requirements
- Upload malware scanning
- Prompt-injection resistant captions
- No autonomous publish

## 30. Definition of Ready
- Freeze waiver W-VA-1 respected
- Eval harness cases defined
- Co-design on honesty labels

## 31. Definition of Done
- Default AI INFERRED
- Cannot set verified
- Evals gate

## 32. MVP acceptance criteria
- Synthetic lens proposals into change review queue

## 33. Pilot acceptance criteria
- Assessor-only shadow mode; no public claim

## 34. Scale acceptance criteria
- Only after precision thresholds and G5 evidence

## 35. KPIs
- Human confirm rate
- False proposal rate
- Time-to-verified evidence

## 36. Risks
- CV treated as compliance
- Privacy of bystanders

## 37. Mitigations
- CV treated as compliance → Hard block accreditation path
- Privacy of bystanders → Capture policy; no face ID

| Risk | Mitigation |
| --- | --- |
| CV treated as compliance | Hard block accreditation path |
| Privacy of bystanders | Capture policy; no face ID |

## 38. Dependencies
- Epic 01
- Epic 06
- AI platform registry

## 39. Recommended owner / team
Access Intelligence + AI platform

## 40. Delivery horizon
R&D (R&D Wave)

## 41. Current claim state
**Exploratory** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Eval report
- Assessor acceptance study
- No public claim until registry allows

---

## Features (4–8)

### 04-f1 — Vision proposal contracts
**Disposition:** REUSE  
**Summary:** Shared schemas for CV candidates.  
**Reuse paths:** `VisionAccess contracts #383`  
**Acceptance:**
- AI inferred default

### 04-f2 — Shadow inference harness
**Disposition:** EXTEND  
**Summary:** Synthetic/shadow only until waiver.  
**Reuse paths:** `access-intelligence-next evidence`  
**Acceptance:**
- Flags off by default

### 04-f3 — Human verification bridge
**Disposition:** EXTEND  
**Summary:** Proposals enter change review.  
**Reuse paths:** `AccessChangeReviewRecord`  
**Acceptance:**
- No auto-publish

### 04-f4 — Community confirmation workflow
**Disposition:** NEW  
**Summary:** Community can corroborate not verify alone.  
**Reuse paths:** `community_reported status`  
**Acceptance:**
- Cannot reach independently verified alone

### 04-f5 — Organisation correction
**Disposition:** EXTEND  
**Summary:** Venue disputes AI candidates.  
**Reuse paths:** `venue response services`  
**Acceptance:**
- Audit trail

### 04-f6 — Assessor validation
**Disposition:** EXTEND  
**Summary:** Accredited measurement supersedes.  
**Reuse paths:** `Epic 06`  
**Acceptance:**
- Assessor identity required


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if evidence capture bottleneck evidenced.
- **G1:** PASS if disability-led review of CV honesty risks.
- **G2:** PASS if rights review bans compliance-from-CV.
- **G3:** PASS if synthetic proposal → human reject/confirm loop.
- **G4:** PASS if assessor-only pilot; kill switch tested.
- **G5:** PASS if precision thresholds met.
- **G6:** PASS if model-drift and unsupported-claim monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
