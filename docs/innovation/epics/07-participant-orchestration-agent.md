# EPIC 07 — Participant Orchestration Agent

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-07` / `participant-orchestration-agent` |
| Priority | P1 |
| Delivery horizon | Controlled Intelligence |
| Wave | Controlled Intelligence Wave |
| Current claim state | **In development** |
| Dependencies | EPIC-01, EPIC-02, EPIC-03, EPIC-08 |
| Recommended owner | AI platform / Navigator (W-AA-1) |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Participant Orchestration Agent

## 2. Epic ID / proposed slug
`EPIC-07` · `participant-orchestration-agent`

## 3. Strategic outcome
Single participant-controlled conversational planning layer: MODEL PROPOSES → POLICY VALIDATES → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.

## 4. Participant outcome
People can plan complex journeys (e.g. interview + transport + support) without surrendering decision ownership.

## 5. Problem statement
Cross-module planning is fragmented; ungoverned agents risk booking, disclosing, or spending without approval.

## 6. Scope
- Search, compare, explain, identify dependencies, draft plans, suggest options across Jobs/Access/Navigate/Transport/Care/Calendar
- One orchestrating agent first (Navigator)
- Typed tools, constrained schemas, explicit state, audit, approval gates, evals

## 7. Explicit non-goals
- Autonomous multi-agent swarm
- Independent worker assignment, consequential booking without approval, disability disclosure, spending, funding approval, clinical/abuse/restrictive-practice decisions

## 8. User groups
- Participants
- Delegates
- Human escalators / navigators

## 9. Example user journeys
- “Interview in Parramatta Tuesday 10am, power wheelchair, need support and accessible transport” → draft plan → participant approves each consequential action

## 10. Functional capabilities
- Navigator orchestration
- Consent gates
- Tool schemas
- Approval envelopes
- Escalation
- Non-AI fallback

## 11. Shared Core dependencies
- lib/ai/navigator
- consent
- authority
- audit
- AI capability registry
- Care/Transport/Jobs read adapters

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-02
- EPIC-03
- EPIC-08

## 13. Data entities
- Navigator envelopes
- AuditEvent
- ConsentRecord
- existing Care/Transport/Jobs entities (no second SoT)

## 14. APIs / events required
- navigator.plan.proposed
- navigator.action.approved
- navigator.escalated

## 15. Permission model
Participant (or grant) must approve consequential tools; server policy validates before execute.

## 16. Consent requirements
- Micro-consent for passport/tool data
- Purpose-bound module reads

## 17. Human approval gates
- All consequential executions
- Escalation to person
- Co-design S0/S1 before participant-facing HITL

## 18. Accessibility acceptance criteria
- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)
- Non-chat alternative for all critical flows

## 19. Privacy requirements
- Minimum tool data
- No diagnosis in prompts unless explicitly consented and necessary — prefer functional requirements

## 20. Safeguarding requirements
- Safeguarding human-only; agent must escalate not decide

## 21. AI use, if any
Search, summarise, explain, draft, recommend, plan — not execute consequential actions alone.

## 22. AI prohibited decisions
- Assign workers
- Book without approval
- Disclose disability
- Spend money
- Approve funding
- Clinical decisions
- Abuse/reportability determination
- Restrictive practices
- claim.aura_decides / claim.auto_worker_assignment

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
- Traces, tool calls, approvals, refusals

## 25. Observability requirements
- Task success
- Forbidden action attempts
- Escalation precision
- Fallback success
- Cohort disparity

## 26. Complaints / correction path
Human handoff + Complaint; correction of bad plans.

## 27. Feature flags
- Navigator pilot flags
- W-AA-1
- MAPABLE_AI_PUBLIC_CLAIM_ENABLED=false
- MAPABLE_AUTOMATIC_ASSIGNMENT_ENABLED=false

## 28. Failure and fallback behaviour
Non-AI journey planner forms; human escalation; kill switch disables model calls.

## 29. Security requirements
- Typed tools only
- Policy services outside model
- Prompt-injection resistance on tool args
- Edge rate limits / UA controls when middleware hardened
- verifyPayloadSafe on free-text before persistence

## 30. Definition of Ready
- Co-design protocol S0/S1
- Eval suite green on forbidden actions
- Freeze waiver W-AA-1

## 31. Definition of Done
- Approval gates enforced in code
- Evals for disclosure/funding/assignment
- Accessible fallback
- Single agent only

## 32. MVP acceptance criteria
- Draft plan for appointment journey using Access+Navigate+Transport reads; no auto-book

## 33. Pilot acceptance criteria
- Governed pilot phase; limited cohort; monitoring

## 34. Scale acceptance criteria
- Eval + incident KPIs; accessibility parity

## 35. KPIs
- Task success
- Unsupported-claim rate
- Unsafe recommendation rate
- Forbidden action attempts
- Non-AI fallback success

## 36. Risks
- Agent swarm / reward hacking
- Unauthorised disclosure

## 37. Mitigations
- Agent swarm / reward hacking → One agent; deterministic policy; evals; kill switches
- Unauthorised disclosure → Consent gates; tool allowlists; target zero incidents

| Risk | Mitigation |
| --- | --- |
| Agent swarm / reward hacking | One agent; deterministic policy; evals; kill switches |
| Unauthorised disclosure | Consent gates; tool allowlists; target zero incidents |

## 38. Dependencies
- Epics 01–03
- thin 08
- AI platform

## 39. Recommended owner / team
AI platform / Navigator (W-AA-1)

## 40. Delivery horizon
Controlled Intelligence (Controlled Intelligence Wave)

## 41. Current claim state
**In development** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Eval reports
- Pilot runbook adherence
- Co-design sign-off

---

## Features (4–8)

### 07-f1 — Single Navigator orchestrator
**Disposition:** EXTEND  
**Summary:** One agent; no swarm.  
**Reuse paths:** `lib/ai/navigator/`  
**Acceptance:**
- Typed tools
- Explicit state

### 07-f2 — Consent and authority gates
**Disposition:** EXTEND  
**Summary:** Refuse without consent/grant.  
**Reuse paths:** `consent-gate.ts`, `gates.ts`  
**Acceptance:**
- Delegate lack-of-authority eval

### 07-f3 — Approval envelopes
**Disposition:** EXTEND  
**Summary:** Participant approves consequential actions.  
**Reuse paths:** `envelopes/`  
**Acceptance:**
- No execute without approval

### 07-f4 — Cross-module typed tools
**Disposition:** EXTEND  
**Summary:** Jobs/Access/Navigate/Transport/Care/Calendar reads.  
**Reuse paths:** `matching/search-tool.ts`  
**Acceptance:**
- Constrained schemas

### 07-f5 — Human escalation
**Disposition:** EXTEND  
**Summary:** Accessible handoff.  
**Reuse paths:** `escalation/service.ts`, `Epic 08`  
**Acceptance:**
- No phone-tree only

### 07-f6 — Eval and trace harness
**Disposition:** EXTEND  
**Summary:** Minimum eval set + traces.  
**Reuse paths:** `lib/ai/platform/evaluations`  
**Acceptance:**
- Forbidden action suite

### 07-f7 — Non-AI fallback journey UI
**Disposition:** EXTEND  
**Summary:** Forms/list planner.  
**Reuse paths:** `journey-planner routes`  
**Acceptance:**
- Critical path without chat


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if cross-module planning burden evidenced.
- **G1:** PASS if co-design protocol S0/S1 signed for participant-facing HITL.
- **G2:** PASS if AI governance/safeguarding/privacy review clears prohibited decisions.
- **G3:** PASS if propose→approve→execute(read-only or sandbox) proof.
- **G4:** PASS if governed pilot charter met; kill switch tested.
- **G5:** PASS if eval KPIs and zero critical disclosure incidents.
- **G6:** PASS if continuous AI error/drift/disparity monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
