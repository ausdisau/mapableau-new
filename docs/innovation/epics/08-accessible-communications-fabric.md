# EPIC 08 — Accessible Communications Fabric

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-08` / `accessible-communications-fabric` |
| Priority | P1 |
| Delivery horizon | Foundation thin slice → Experience full fabric |
| Wave | Experience Wave |
| Current claim state | **Implemented, not independently verified** |
| Dependencies | EPIC-02 |
| Recommended owner | Messaging + Mobile communication owners |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
Accessible Communications Fabric

## 2. Epic ID / proposed slug
`EPIC-08` · `accessible-communications-fabric`

## 3. Strategic outcome
Shared communication layer with preferences, no-voice paths, and human handoff across MapAble.

## 4. Participant outcome
Status and support without inaccessible telephone trees; AAC-friendly and plain-language options.

## 5. Problem statement
Status questions (e.g. where is my driver) force inaccessible channels; clinical/payment data risks leaking into chat agents.

## 6. Scope
- In-app messaging, SMS, voice, accessible web chat, WhatsApp/RCS where appropriate, email, AAC-friendly text
- Preferences, preferred channel, no-voice option, plain-language, escalation, emergency boundaries, service-status messages

## 7. Explicit non-goals
- High-risk clinical data in general agent context
- Payment-card data in chat
- Emergency dispatch replacement

## 8. User groups
- Participants
- Drivers/workers
- Support staff
- Ops

## 9. Example user journeys
- Where is my driver? → explain current info → next steps → escalate to person

## 10. Functional capabilities
- Thread messaging
- Preference-aware routing
- Status explainers
- Human handoff
- Channel adapters

## 11. Shared Core dependencies
- Conversation/Message
- Communication preferences
- Notifications
- AuditEvent

## 12. Cross-Epic dependencies
- EPIC-02

## 13. Data entities
- Conversation
- Message
- MessageReadReceipt
- notification stubs

## 14. APIs / events required
- message.created
- escalation.opened
- status.explained

## 15. Permission model
Thread ACLs via message-access-policy; no ambient admin.

## 16. Consent requirements
- Channel consent; marketing vs transactional separation

## 17. Human approval gates
- Escalation to human
- Emergency boundary messaging

## 18. Accessibility acceptance criteria
- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)
- No-voice-required option mandatory for status

## 19. Privacy requirements
- Keep clinical/PAN out of general agent contexts

## 20. Safeguarding requirements
- Emergency escalation boundaries; 000 for immediate danger

## 21. AI use, if any
Explain status / draft replies; not clinical advice.

## 22. AI prohibited decisions
- Clinical advice
- Payment card handling
- Safeguarding determinations

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
- Escalations
- Preference changes

## 25. Observability requirements
- Channel success
- Escalation time
- a11y parity

## 26. Complaints / correction path
In-thread escalate + Complaint module.

## 27. Feature flags
- Push often stubbed — honest labels
- MAPABLE_AAC_COMMUNICATION_ENABLED

## 28. Failure and fallback behaviour
In-app thread + human queue if SMS/voice fail.

## 29. Security requirements
- IDOR tests on threads
- Sanitize message bodies
- Rate-limit

## 30. Definition of Ready
- Preference model agreed
- Emergency copy legal review

## 31. Definition of Done
- No-voice status path
- Handoff SLA
- No clinical/PAN in general agent

## 32. MVP acceptance criteria
- In-app status + human handoff for transport trip

## 33. Pilot acceptance criteria
- Limited cohort multi-channel

## 34. Scale acceptance criteria
- Channel SLAs; a11y parity

## 35. KPIs
- Status question resolution
- Escalation precision
- Voice-independent completion

## 36. Risks
- Inaccessible escalation
- Data leakage into agents

## 37. Mitigations
- Inaccessible escalation → No-voice path; handoff required
- Data leakage into agents → Context allowlists

| Risk | Mitigation |
| --- | --- |
| Inaccessible escalation | No-voice path; handoff required |
| Data leakage into agents | Context allowlists |

## 38. Dependencies
- Messaging SoT
- Transport status evidence

## 39. Recommended owner / team
Messaging + Mobile communication owners

## 40. Delivery horizon
Foundation thin slice → Experience full fabric (Experience Wave)

## 41. Current claim state
**Implemented, not independently verified** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Manual AT on messaging
- IDOR suite

---

## Features (4–8)

### 08-f1 — In-app messaging core
**Disposition:** REUSE  
**Summary:** Existing threads.  
**Reuse paths:** `lib/messages/`  
**Acceptance:**
- Access policy enforced

### 08-f2 — Communication preferences
**Disposition:** EXTEND  
**Summary:** Preferred channel + no-voice.  
**Reuse paths:** `AccessibilityProfile communicationPreferences`  
**Acceptance:**
- Honoured in status flows

### 08-f3 — Service status explainer
**Disposition:** EXTEND  
**Summary:** Where is my driver honest status.  
**Reuse paths:** `transport status`  
**Acceptance:**
- Estimate ≠ arrival

### 08-f4 — Human handoff
**Disposition:** EXTEND  
**Summary:** Accessible escalation.  
**Reuse paths:** `escalation patterns`  
**Acceptance:**
- Not phone-tree only

### 08-f5 — SMS email voice adapters
**Disposition:** EXTEND  
**Summary:** Channel adapters.  
**Reuse paths:** `Twilio etc`  
**Acceptance:**
- Flags; honest failure

### 08-f6 — AAC-friendly interfaces
**Disposition:** EXTEND  
**Summary:** Symbol/plain pathways.  
**Reuse paths:** `AAC flags`  
**Acceptance:**
- Default off until co-designed

### 08-f7 — WhatsApp/RCS exploratory
**Disposition:** DEFER  
**Summary:** Where appropriate.  
**Reuse paths:** _none_  
**Acceptance:**
- Privacy review first


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if inaccessible status channels evidenced.
- **G1:** PASS if AAC/Easy Read co-design for messaging.
- **G2:** PASS if clinical/PAN boundary review.
- **G3:** PASS if status→handoff on one vertical.
- **G4:** PASS if pilot monitoring.
- **G5:** PASS if resolution KPIs.
- **G6:** PASS if continuous a11y/incident monitoring.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
