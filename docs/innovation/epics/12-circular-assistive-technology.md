# EPIC 12 — Circular Assistive Technology Network

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-12` / `circular-assistive-technology` |
| Priority | P3 |
| Delivery horizon | R&D |
| Wave | R&D Wave |
| Current claim state | **Exploratory** |
| Dependencies | EPIC-02, EPIC-09 |
| Recommended owner | AT Continuity / programmes owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Circular Assistive Technology Network

## 2. Epic ID / proposed slug
`EPIC-12` · `circular-assistive-technology`

## 3. Strategic outcome
Trusted network for AT purchase/rental/reuse/service — without clinical or funding inference from listings.

## 4. Participant outcome
Continuity of essential equipment first; marketplace circularity only when safe and honest.

## 5. Problem statement
AT disruption harms participation; marketplaces imply clinical suitability/funding incorrectly.

## 6. Scope
- Purchase, rental, reuse, refurbishment, trials, delivery, collection, servicing, recall tracking
- Equipment Passport concept: model, serial, ownership, condition, service history, warranty, recalls, compatibility, accessories

## 7. Explicit non-goals
- Clinical suitability SoT
- Infer listing = prescribed/safe/fundable
- Emergency dispatch
- Second consent/audit SoT

## 8. User groups
- Participants
- Repair partners
- Suppliers
- Funders (advisory)

## 9. Example user journeys
- Register power wheelchair → outage → backup plan → authorised repair partner

## 10. Functional capabilities
- AT Continuity Wave 1
- Equipment passport (later)
- Recall tracking (later)
- Marketplace hints only

## 11. Shared Core dependencies
- lib/platform/at-continuity
- Organisation
- Consent
- AuditEvent
- Care/Transport dependency links

## 12. Cross-Epic dependencies
- EPIC-02
- EPIC-09

## 13. Data entities
- AtEquipmentAsset
- AtEquipmentOutage
- AtBackupPlan
- AtRepairPartnerRef
- AtDependencyLink

## 14. APIs / events required
- at.outage.recorded
- at.backup.shown

## 15. Permission model
Participant-owned assets; partner refs to Organisation.

## 16. Consent requirements
- Share equipment details with repair partners purpose-bound

## 17. Human approval gates
- Notifications human-approved
- Clinical advice out of scope

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
- Serial/ownership minimization

## 20. Safeguarding requirements
- Recalls escalate; no clinical prescription

## 21. AI use, if any
Optional matching of repair partners — not suitability.

## 22. AI prohibited decisions
- Clinical suitability
- Funding certainty
- Prescription

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
- Asset and outage writes

## 25. Observability requirements
- Outage resolution time
- Backup plan coverage

## 26. Complaints / correction path
Unsafe listing complaints when marketplace exists.

## 27. Feature flags
- MAPABLE_AT_CONTINUITY_ENABLED=false
- W-AT-1

## 28. Failure and fallback behaviour
Manual contact cards for repair; flag off.

## 29. Security requirements
- Ownership checks
- No second marketplace as clinical register

## 30. Definition of Ready
- Freeze waiver W-AT-1
- Non-clinical language

## 31. Definition of Done
- Continuity journey works flag-on
- No clinical claims
- Audit

## 32. MVP acceptance criteria
- AT Continuity acceptance journey (register→outage→backup→partner→deps)

## 33. Pilot acceptance criteria
- Limited participants; human-approved notifications

## 34. Scale acceptance criteria
- Circular marketplace only after separate G0–G5

## 35. KPIs
- Outage recovery
- Dependency break rate

## 36. Risks
- Marketplace implies clinical suitability
- Scope expands under freeze

## 37. Mitigations
- Marketplace implies clinical suitability → Explicit non-goals; UI disclaimers
- Scope expands under freeze → W-AT-1 narrow waiver only

| Risk | Mitigation |
| --- | --- |
| Marketplace implies clinical suitability | Explicit non-goals; UI disclaimers |
| Scope expands under freeze | W-AT-1 narrow waiver only |

## 38. Dependencies
- AT Continuity scaffold
- Epic 02/09

## 39. Recommended owner / team
AT Continuity / programmes owners

## 40. Delivery horizon
R&D (R&D Wave)

## 41. Current claim state
**Exploratory** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Wave 1 acceptance journey
- Flag default false preserved

---

## Features (4–8)

### 12-f1 — AT Continuity register
**Disposition:** REUSE  
**Summary:** Participant equipment assets.  
**Reuse paths:** `lib/platform/at-continuity`  
**Acceptance:**
- Flag gated

### 12-f2 — Outage and backup plans
**Disposition:** REUSE  
**Summary:** Continuity under failure.  
**Reuse paths:** `AtEquipmentOutage`, `AtBackupPlan`  
**Acceptance:**
- Audited writes

### 12-f3 — Repair partner links
**Disposition:** REUSE  
**Summary:** Organisation refs.  
**Reuse paths:** `AtRepairPartnerRef`  
**Acceptance:**
- No second directory

### 12-f4 — Operational dependency links
**Disposition:** REUSE  
**Summary:** Care/Transport/Work deps.  
**Reuse paths:** `AtDependencyLink`  
**Acceptance:**
- Typed targets

### 12-f5 — Equipment Passport
**Disposition:** DEFER  
**Summary:** Service/warranty/recall fields.  
**Reuse paths:** _none_  
**Acceptance:**
- Not clinical

### 12-f6 — Circular marketplace
**Disposition:** DEFER  
**Summary:** Reuse/rental network.  
**Reuse paths:** `marketplace hints only`  
**Acceptance:**
- Listing ≠ suitable/fundable


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if AT disruption harms evidenced.
- **G1:** PASS if co-design with AT users.
- **G2:** PASS if clinical boundary review.
- **G3:** PASS if continuity journey proof flag-on in non-prod.
- **G4:** PASS if limited pilot; notifications human-approved.
- **G5:** PASS if continuity KPIs; marketplace still separate gate.
- **G6:** PASS if recall/outage monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
