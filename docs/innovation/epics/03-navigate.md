# EPIC 03 — MapAble Navigate

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-03` / `navigate` |
| Priority | P1 |
| Delivery horizon | Experience |
| Wave | Experience Wave |
| Current claim state | **In development** |
| Dependencies | EPIC-01, EPIC-02 |
| Recommended owner | Access + Transport routing owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Navigate

## 2. Epic ID / proposed slug
`EPIC-03` · `navigate`

## 3. Strategic outcome
Accessible routing that optimises suitability rather than shortest travel time.

## 4. Participant outcome
Participants receive route options scored against their requirements with uncertainty and evidence freshness communicated honestly.

## 5. Problem statement
Shortest-path routing ignores gradients, stairs, lift outages, sensory load, and rest needs — and often presents guesses as facts.

## 6. Scope
- Gradients, surfaces, narrow paths, stairs, kerb ramps, accessible crossings, lift availability/outages
- Accessible toilets, rest, shade/shelter, lighting, sensory intensity, PT interchange, recharge, temporary barriers/construction
- Uncertainty and freshness communication; inferred ≠ verified

## 7. Explicit non-goals
- Guaranteed personally safe routes
- Emergency routing as 000 replacement
- Indoor AR navigation production claims

## 8. User groups
- Participants
- Support persons
- Transport operators (status feeds)
- Venue operators (lift outages)

## 9. Example user journeys
- Power wheelchair user gets step-free options with gradient confidence labels
- Lift outage demotes a route; system shows evidence age
- Missing kerb data → uncertain segment, not 'accessible'

## 10. Functional capabilities
- Suitability-first outdoor routing
- Indoor route reuse where published
- Uncertainty UX
- Disruption overlays
- Passport-aware fit

## 11. Shared Core dependencies
- Access Graph entities
- AccessPassport
- Transport routing adapters (advisory)
- Indoor route-planner

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-02

## 13. Data entities
- AccessJourneyRecord
- AccessJourneySegmentRecord
- Indoor routes
- Transport route estimates (advisory)

## 14. APIs / events required
- journeys/evaluate
- routing adapters advisory
- disruption events

## 15. Permission model
Participant routes private by default; no identifiable journey publish to Observatory.

## 16. Consent requirements
- Passport read requires consent/scopes
- Analytics aggregation separate and privacy-preserving (Epic 14)

## 17. Human approval gates
- Participant selects among options; system does not auto-book transport

## 18. Accessibility acceptance criteria
- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)
- Map + equivalent list/form interaction (transport rule)

## 19. Privacy requirements
- No identifiable journey histories in public analytics
- Exact addresses restricted per transport rules

## 20. Safeguarding requirements
- Not an emergency service; direct danger to 000
- No personal safety score

## 21. AI use, if any
Optional explanation of trade-offs; not inventing missing access facts.

## 22. AI prohibited decisions
- Hallucinated lift availability
- Claiming route personally safe
- Auto-booking

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
- Route option generation inputs/versions
- Participant selection

## 25. Observability requirements
- Accessible-route completion
- Uncertainty presentation rate
- Stale segment rate

## 26. Complaints / correction path
Correction path into Access Graph when route evidence wrong.

## 27. Feature flags
- Indoor flags
- Transport routing sandbox flags
- claim.route_personally_safe prohibited

## 28. Failure and fallback behaviour
If routing unavailable → manual list of known barriers + human escalation. Non-AI filters remain.

## 29. Security requirements
- Do not leak exact pickup in pre-assignment contexts
- Sanitize location free-text

## 30. Definition of Ready
- Graph coverage for pilot geography
- Passport fit engine available

## 31. Definition of Done
- Suitability objective documented
- Uncertainty UX
- Tests for stale/inferred handling

## 32. MVP acceptance criteria
- Passport-aware suitability ranking on a limited corridor using verified+uncertain segments

## 33. Pilot acceptance criteria
- Controlled cohort; compare completion vs shortest-path baseline

## 34. Scale acceptance criteria
- Freshness SLAs; completion KPI

## 35. KPIs
- Accessible-route completion
- Stale evidence encounters
- Participant override of recommended route

## 36. Risks
- Presenting inferred accessibility as verified
- Privacy leak of journeys

## 37. Mitigations
- Presenting inferred accessibility as verified → Provenance labels mandatory in UI
- Privacy leak of journeys → No identifiable export; aggregation Epic 14 only

| Risk | Mitigation |
| --- | --- |
| Presenting inferred accessibility as verified | Provenance labels mandatory in UI |
| Privacy leak of journeys | No identifiable export; aggregation Epic 14 only |

## 38. Dependencies
- Epic 01
- Epic 02
- Indoor/transport adapters

## 39. Recommended owner / team
Access + Transport routing owners

## 40. Delivery horizon
Experience (Experience Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Pilot completion metrics
- Manual AT on map/list parity

---

## Features (4–8)

### 03-f1 — Suitability routing engine
**Disposition:** EXTEND  
**Summary:** Optimise for passport fit not only ETA.  
**Reuse paths:** `lib/access/indoor/routing/`, `lib/transport-routing/`  
**Acceptance:**
- Documented cost function
- Advisory labels

### 03-f2 — Disruption and lift outage overlays
**Disposition:** EXTEND  
**Summary:** Freshness-sensitive barriers.  
**Reuse paths:** `IndoorAccessibilityIncident`, `evidence freshness`  
**Acceptance:**
- Outage demotes routes

### 03-f3 — Uncertainty and freshness UX
**Disposition:** NEW  
**Summary:** Honest labels for inferred/stale/unknown.  
**Reuse paths:** `compatibility four-state`  
**Acceptance:**
- Inferred ≠ verified

### 03-f4 — Passport-aware journey evaluate
**Disposition:** EXTEND  
**Summary:** End-to-end segment evaluation API.  
**Reuse paths:** `AccessJourney*`, `API_CONTRACTS`  
**Acceptance:**
- participantDecisionRequired true

### 03-f5 — Map and list parity
**Disposition:** EXTEND  
**Summary:** Keyboard/SR equivalent to map.  
**Reuse paths:** `docs/transport/PRODUCT_REQUIREMENTS.md`  
**Acceptance:**
- No map-only critical info

### 03-f6 — Correction feedback loop
**Disposition:** EXTEND  
**Summary:** Wrong barrier → graph dispute.  
**Reuse paths:** `Epic 01 dispute`  
**Acceptance:**
- Linked correction ticket


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if journey failures from unsuitable routes evidenced.
- **G1:** PASS if co-design of uncertainty language.
- **G2:** PASS if no personal-safety claim; privacy review of journeys.
- **G3:** PASS if one corridor evaluates with uncertain segments.
- **G4:** PASS if flagged pilot; rollback; support escalation.
- **G5:** PASS if completion/ freshness KPIs justify scale.
- **G6:** PASS if continuous stale-data and a11y monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
