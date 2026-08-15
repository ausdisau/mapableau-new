# EPIC 14 — MapAble Access Observatory

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-14` / `access-observatory` |
| Priority | P2 |
| Delivery horizon | Platform Commercialisation |
| Wave | Platform Commercialisation Wave |
| Current claim state | **Proposed** |
| Dependencies | EPIC-01, EPIC-11 |
| Recommended owner | Analytics / research governance owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Access Observatory

## 2. Epic ID / proposed slug
`EPIC-14` · `access-observatory`

## 3. Strategic outcome
Aggregate accessibility intelligence for planners — privacy-preserving, no identifiable journeys.

## 4. Participant outcome
Systemic barriers fixed upstream without surveilling individual travel.

## 5. Problem statement
Policy lacks aggregate access intelligence; naive analytics re-identify participants.

## 6. Scope
- Gaps, route barriers, inaccessible precincts, infrastructure opportunities, employment clusters, transport-access gaps, thin markets, data coverage
- Privacy-preserving aggregation

## 7. Explicit non-goals
- Identifiable participant journeys
- Worthiness/risk scores
- Claiming anonymous without basis

## 8. User groups
- Councils
- Planners
- Policy
- Community orgs
- Researchers
- Transport operators
- Economic development

## 9. Example user journeys
- Council views precinct gap heatmap with small-cell suppression

## 10. Functional capabilities
- Metric registry
- Snapshots
- Exports with approval
- Research governance

## 11. Shared Core dependencies
- Analytics cloud
- deidentification
- research consent
- Access Graph aggregates

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-11

## 13. Data entities
- MetricDefinition
- MetricSnapshot
- AnalyticsExport
- ResearchProject

## 14. APIs / events required
- analytics.snapshot.created
- research.export.approved

## 15. Permission model
Partner workspaces; export approvals; no raw journey access.

## 16. Consent requirements
- Research uses ParticipantResearchConsent; operational aggregates separate

## 17. Human approval gates
- Export approval
- Ethics where research

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
- Small-cell suppression
- Pseudonymisation
- Never claim anonymous without documented basis

## 20. Safeguarding requirements
- No risk scores on people

## 21. AI use, if any
Optional cluster narratives — not person scoring.

## 22. AI prohibited decisions
- Participant worthiness/risk scores (hardcoded off)
- Re-identification assists

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
- Export approvals
- Query templates

## 25. Observability requirements
- Suppression rates
- Coverage metrics

## 26. Complaints / correction path
Community challenge of misleading aggregates.

## 27. Feature flags
- MAPABLE_ANALYTICS_CLOUD_ENABLED
- MAPABLE_RESEARCH_GOVERNANCE_ENABLED

## 28. Failure and fallback behaviour
Publish coverage docs only; disable exports.

## 29. Security requirements
- Query allowlists
- Export encryption
- Access logging

## 30. Definition of Ready
- Threat model for re-id
- Metric dictionary

## 31. Definition of Done
- Small-cell controls
- No identifiable journeys
- Worthiness scores remain false

## 32. MVP acceptance criteria
- Coverage + gap snapshot for one LGA synthetic/pilot

## 33. Pilot acceptance criteria
- One council partner; export approval exercised

## 34. Scale acceptance criteria
- Multi-region with continuous privacy tests

## 35. KPIs
- Data coverage
- Successful corrections fed back to graph
- Export rejection of unsafe queries

## 36. Risks
- Re-identification
- Policy misuse against communities

## 37. Mitigations
- Re-identification → Small-cell; ethics; export gates
- Policy misuse against communities → G1 co-design; CARE principles for First Nations data

| Risk | Mitigation |
| --- | --- |
| Re-identification | Small-cell; ethics; export gates |
| Policy misuse against communities | G1 co-design; CARE principles for First Nations data |

## 38. Dependencies
- Epic 01
- Analytics/research cloud
- optional Epic 11 aggregates

## 39. Recommended owner / team
Analytics / research governance owners

## 40. Delivery horizon
Platform Commercialisation (Platform Commercialisation Wave)

## 41. Current claim state
**Proposed** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Privacy review
- Small-cell test evidence

---

## Features (4–8)

### 14-f1 — Metric registry for access gaps
**Disposition:** EXTEND  
**Summary:** Governed metrics.  
**Reuse paths:** `lib/platform/analytics/`  
**Acceptance:**
- Registered definitions

### 14-f2 — Privacy-preserving snapshots
**Disposition:** EXTEND  
**Summary:** Aggregates with suppression.  
**Reuse paths:** `deidentification`  
**Acceptance:**
- Small-cell

### 14-f3 — Infrastructure opportunity views
**Disposition:** NEW  
**Summary:** Planner dashboards.  
**Reuse paths:** `admin analytics`  
**Acceptance:**
- No person drill-down

### 14-f4 — Employment cluster aggregates
**Disposition:** EXTEND  
**Summary:** From Epic 11 without identity.  
**Reuse paths:** `Jobs aggregates`  
**Acceptance:**
- K-anonymity thresholds

### 14-f5 — Research export governance
**Disposition:** REUSE  
**Summary:** Ethics + DUA + consent.  
**Reuse paths:** `lib/research/`  
**Acceptance:**
- Approval required

### 14-f6 — Feedback to Access Graph
**Disposition:** NEW  
**Summary:** Gap reports create investigation tasks.  
**Reuse paths:** `Epic 01`  
**Acceptance:**
- Not auto-facts


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if planners lack aggregate access intelligence.
- **G1:** PASS if community co-design including First Nations data governance where relevant.
- **G2:** PASS if privacy/re-id review.
- **G3:** PASS if suppressed snapshot for one region.
- **G4:** PASS if partner pilot; export gates.
- **G5:** PASS if privacy tests hold under load.
- **G6:** PASS if continuous re-id and disparity monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
