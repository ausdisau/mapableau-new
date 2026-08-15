# Portfolio Stage Gates

Every Epic moves through G0–G6. Epic-specific pass/fail criteria live in each epic file. This document defines the **programme standard**.

## Gate definitions

### G0 — Problem Evidence
**Pass:** Documented evidence the problem is real for disabled people / operators; links to incidents, research, or co-design discovery.  
**Fail:** Only commercial speculation or vendor push.

### G1 — Disability-Led Co-design
**Pass:** Paid, meaningful co-design with disabled people affected; DRO engagement per `docs/co-design-protocol.md` where HITL AI applies (S0/S1).  
**Fail:** Internal-only design; unpaid token consultation.

### G2 — Rights, Accessibility & Risk Review
Review checklist must clear: participant autonomy; consent; privacy; accessibility; safeguarding; bias; data use; regulatory exposure; dignity of risk; complaints; non-AI fallback.  
**Pass:** Written review with named owners; residual risks accepted.  
**Fail:** Unresolved forced disclosure, AI-prohibited decisions, or WCAG claim without path to manual AT.

### G3 — Technical Proof
**Pass:** Smallest end-to-end proof on canonical SoT; flags default false; tests.  
**Fail:** Demo that invents verified facts, second SoT, or ungoverned agent execute.

### G4 — Controlled Pilot
**Pass:** Feature flag; limited cohort; monitoring; rollback; support process; human escalation; incident handling; honesty labels.  
**Fail:** Public claim enabled; open enrollment; no kill switch.

### G5 — Evidence to Scale
**Pass:** Pilot KPIs support rollout; accessibility/privacy incidents within threshold; claim registry evidence attached.  
**Fail:** Scale by anecdote; unresolved critical incidents.

### G6 — Continuous Assurance
Monitor: accessibility regressions; complaints; incidents; consent failures; data-quality degradation; credential expiry; AI errors; model drift; cohort disparities; operational failures.  
**Pass:** Dashboards + on-call ownership + review cadence.  
**Fail:** Ship-and-forget.

## Minimum stage-gate Features (link from every Epic)

1. G0 Problem Evidence pack  
2. G1 Co-design record  
3. G2 Rights & risk review  
4. G3 Technical proof spike  
5. G4 Controlled pilot charter  
6. G5 Scale evidence pack  
7. G6 Continuous assurance hooks  

Do not duplicate product Features for these; reference this file.

## Accessibility release gate (all user-facing Features)

- WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)
- Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast
- Screen-reader labels and live regions for status changes
- Reduced motion; non-drag alternatives; touch targets ≥44px
- Switch access and voice-independent workflow
- Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction
- Accessible authentication and accessible timeout/session behaviour
- Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)

## AI governance gate (AI-enabled Epics)

Use AI for: search, summarisation, explanation, drafting, recommendation, planning, classification, extraction, low-risk anomaly detection.  
Deterministic controls outside the model. Explicit approval before consequential actions. Prefer **one agent** first.

Minimum eval set:
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
