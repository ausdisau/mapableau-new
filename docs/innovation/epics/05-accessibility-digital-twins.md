# EPIC 05 — Accessibility Digital Twins

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-05` / `accessibility-digital-twins` |
| Priority | P3 |
| Delivery horizon | R&D |
| Wave | R&D Wave |
| Current claim state | **Exploratory** |
| Dependencies | EPIC-01, EPIC-03 |
| Recommended owner | Indoor accessibility owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Accessibility Digital Twins

## 2. Epic ID / proposed slug
`EPIC-05` · `accessibility-digital-twins`

## 3. Strategic outcome
Structured spatial models for complex sites enabling future indoor navigation and passport fit — as R&D until evidence quality exists.

## 4. Participant outcome
Eventual ability to preview accessible indoor paths with honest confidence — not a claim that twins are live or personally safe today.

## 5. Problem statement
Large venues lack machine-readable spatial access models; AR/VR previews without evidence would mislead.

## 6. Scope
- Venues, stations, workplaces, campuses, hospitals, shopping centres, precincts, event sites
- Later: indoor nav, route preview, evacuation support, AR/VR, passport checks

## 7. Explicit non-goals
- Production AR/VR claims
- Evacuation system of record replacing building fire plans
- Personal safety guarantees

## 8. User groups
- Venue authoring staff
- Assessors
- Participants (preview consumers later)
- Emergency planners (advisory only)

## 9. Example user journeys
- Author publishes floor plan draft → review → restricted zones filtered for partners

## 10. Functional capabilities
- Floor plan authoring
- Checkpoints
- Visit plans
- Fit engine
- Publication state machine

## 11. Shared Core dependencies
- AccessPlace
- Indoor* models
- Partner API DTO filtering

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-03

## 13. Data entities
- AccessFloorPlan
- IndoorCheckpoint
- VisitPlan
- IndoorAccessibilityIncident

## 14. APIs / events required
- Indoor publication workflow
- Partner floorplans:read

## 15. Permission model
Authoring by venue roles; published public plans exclude restricted zones.

## 16. Consent requirements
- Visit plans participant-owned

## 17. Human approval gates
- Publication approval
- No auto 'safe route'

## 18. Accessibility acceptance criteria
- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)
- 3D/AR off by default per indoor plan

## 19. Privacy requirements
- docs/indoor-accessibility/privacy-and-threat-model.md

## 20. Safeguarding requirements
- Evacuation support advisory only

## 21. AI use, if any
Optional assist for authoring proposals; human publish.

## 22. AI prohibited decisions
- claim.route_personally_safe
- Auto-publish twins

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
- Publication state transitions

## 25. Observability requirements
- Draft vs published coverage

## 26. Complaints / correction path
Correction proposals on floor plans.

## 27. Feature flags
- lib/access/indoor/feature-flags.ts defaults false

## 28. Failure and fallback behaviour
2D list/checkpoint text alternatives; disable twin preview.

## 29. Security requirements
- Partner DTO filtering
- No raw DB to clients

## 30. Definition of Ready
- Spatial evidence quality bar defined
- Threat model reviewed

## 31. Definition of Done
- Publication workflow
- Restricted zone filter
- Honesty labels

## 32. MVP acceptance criteria
- One venue twin draft with checkpoint validation

## 33. Pilot acceptance criteria
- Limited venues; partner read-only

## 34. Scale acceptance criteria
- Only after evidence density + G5

## 35. KPIs
- Published twin coverage
- Correction rate
- Fit uncertain rate

## 36. Risks
- Overclaiming indoor readiness
- Security of restricted zones

## 37. Mitigations
- Overclaiming indoor readiness → R&D horizon; public claims false
- Security of restricted zones → DTO filter + auth scopes

| Risk | Mitigation |
| --- | --- |
| Overclaiming indoor readiness | R&D horizon; public claims false |
| Security of restricted zones | DTO filter + auth scopes |

## 38. Dependencies
- Epic 01
- Indoor stack

## 39. Recommended owner / team
Indoor accessibility owners

## 40. Delivery horizon
R&D (R&D Wave)

## 41. Current claim state
**Exploratory** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Rollout-status honest
- Threat model sign-off

---

## Features (4–8)

### 05-f1 — Floor plan authoring
**Disposition:** REUSE  
**Summary:** Structured spatial authoring.  
**Reuse paths:** `lib/access/indoor/authoring/`  
**Acceptance:**
- State machine

### 05-f2 — Checkpoint and route model
**Disposition:** REUSE  
**Summary:** Indoor graph primitives.  
**Reuse paths:** `IndoorCheckpoint`, `route-planner`  
**Acceptance:**
- Text alternative

### 05-f3 — Publication workflow
**Disposition:** REUSE  
**Summary:** Draft → review → publish.  
**Reuse paths:** `publication/state-machine.ts`  
**Acceptance:**
- Restricted zones filtered

### 05-f4 — Passport indoor fit
**Disposition:** EXTEND  
**Summary:** Compatibility against twin capabilities.  
**Reuse paths:** `indoor-fit-engine`  
**Acceptance:**
- Four-state fit

### 05-f5 — Visit plan sharing
**Disposition:** REUSE  
**Summary:** Participant visit plans.  
**Reuse paths:** `visit-plan-service`  
**Acceptance:**
- Consented share

### 05-f6 — AR/VR preview research
**Disposition:** DEFER  
**Summary:** Exploratory only.  
**Reuse paths:** _none_  
**Acceptance:**
- No production flag


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if venue complexity blocks participation evidenced.
- **G1:** PASS if co-design of preview honesty.
- **G2:** PASS if threat model and no personal-safety claim.
- **G3:** PASS if one twin draft→publish→fit evaluate.
- **G4:** PASS if limited venue pilot.
- **G5:** PASS if evidence density supports navigation claims.
- **G6:** PASS if incident/correction monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
