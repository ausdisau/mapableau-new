# Portfolio Risk Register

| ID | Risk | Severity | Epics | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Duplicate SoTs (consent, place, billing, transport) | Critical | All | DOMAIN_OWNERSHIP + C-010/C-011; REUSE/EXTEND only |
| R2 | Feature freeze conflict / speculative verticals | High | All | Docs-only until waiver; narrow PRs |
| R3 | WCAG claimed without manual AT | High | User-facing | Manual matrix; no conformance claim |
| R4 | ConsentReceipt gaps (expiry/field lists) | High | 02,07,08,11 | EXTEND receipts before scale |
| R5 | Safeguarding AI decisions | Critical | 07,10 | Human-only; prohibited uses; evals |
| R6 | Hallucinated accessibility facts | Critical | 01,03,04,07,13 | Provenance enums; inferred≠verified |
| R7 | NDIS claimability false certainty | Critical | 10 | Advisory wording; NDIA submit off |
| R8 | Academy = competence | High | 15,09 | Pending proposals; claim ban |
| R9 | Observatory re-identification | Critical | 14 | Small-cell; export gates; CARE principles |
| R10 | Vision → accreditation | Critical | 04,06 | Hard block; human assessor only |
| R11 | Agent swarm / reward hacking | High | 07 | One agent; policy outside model; kill switches |
| R12 | Passport on public Access API | Critical | 02,13 | Route ban; contract tests |
| R13 | Silent credential expiry approval | Critical | 09 | Fail closed assignment |
| R14 | AT listing as clinical/fundable | High | 12 | Explicit non-goals; W-AT-1 scope |
| R15 | AI scraper / prompt-injection harvesting | High | 07,13,08 | Edge UA drop, rate limit, query sanitize, verifyPayloadSafe, ai.txt/robots.txt |
