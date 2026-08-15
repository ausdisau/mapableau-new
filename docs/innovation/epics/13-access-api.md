# EPIC 13 — MapAble Access API

| Field | Value |
| --- | --- |
| Epic ID / slug | `EPIC-13` / `access-api` |
| Priority | P2 |
| Delivery horizon | Platform Commercialisation |
| Wave | Platform Commercialisation Wave |
| Current claim state | **Proposed** |
| Dependencies | EPIC-01, EPIC-06 |
| Recommended owner | Developer platform + Access Infrastructure |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`. Implementation requires freeze waiver or freeze lift per `docs/remediation/FEATURE_FREEZE.md`.

## 1. Epic title
MapAble Access API

## 2. Epic ID / proposed slug
`EPIC-13` · `access-api`

## 3. Strategic outcome
Productise verified accessibility information as a partner API — never Access Passport data.

## 4. Participant outcome
Better venue/transport/employer environments via partners consuming verified graph facts — without exposing personal passports.

## 5. Problem statement
Partners lack governed access to provenance-rich accessibility data; risk of leaking participant data via APIs.

## 6. Scope
- /places /access-features /access-observations /verifications /routes /venue-access /workplace-access /transport-access
- Provenance, timestamps, confidence, rate limiting, access controls, licensing, privacy boundaries, versioning, change history

## 7. Explicit non-goals
- Expose Access Passport
- Live personal accessibility truth without evidence gates
- Unversioned breaking changes

## 8. User groups
- Councils
- Transport operators
- Employers
- Tourism
- Venue operators
- Developers
- Mapping providers

## 9. Example user journeys
- Partner reads published venue features with confidence; cannot call passport endpoints

## 10. Functional capabilities
- Partner API keys
- Scoped resources
- DTO filtering
- Licensing
- Versioning

## 11. Shared Core dependencies
- PartnerApiClient
- indoor partner DTO
- Access Graph
- Developer platform

## 12. Cross-Epic dependencies
- EPIC-01
- EPIC-06

## 13. Data entities
- PartnerApiClient
- PartnerApiProgramEnrollment
- published AccessPlace projections

## 14. APIs / events required
- /api/partners/v1/*
- future /access/* Lane 4 aliases

## 15. Permission model
API keys hashed; scopes venues:read etc; no passport scopes.

## 16. Consent requirements
- N/A for public place facts; contractual licensing for partners

## 17. Human approval gates
- Developer Platform + Access Infrastructure Council sign-off before production

## 18. Accessibility acceptance criteria
- Partner docs accessible; embed viewer a11y

## 19. Privacy requirements
- No passport; no identifiable journeys
- Restricted zones filtered

## 20. Safeguarding requirements
- Do not expose sensitive restricted spatial zones

## 21. AI use, if any
None required for API productisation.

## 22. AI prohibited decisions
- AI-invented features in API responses

## 23. AI eval requirements
- hallucinated accessibility fact must not appear in API payloads

## 24. Audit requirements
- API access logs
- key issuance

## 25. Observability requirements
- Rate limit hits
- Error rates
- Freshness of served evidence

## 26. Complaints / correction path
Partner correction → graph dispute.

## 27. Feature flags
- Partner APIs flag-gated
- public claims false until registry

## 28. Failure and fallback behaviour
Unavailable honest errors; no fake data.

## 29. Security requirements
- Rate limiting
- Hashed keys
- DTO allowlists
- Edge UA/rate controls for scraping
- No prompt-injection via query to mutate graph

## 30. Definition of Ready
- Licensing model
- Scope matrix excludes passport

## 31. Definition of Done
- Provenance fields in responses
- Versioning
- Rate limits
- No passport routes

## 32. MVP acceptance criteria
- Extend partners/v1 venues + features with provenance

## 33. Pilot acceptance criteria
- Limited partners; monitoring

## 34. Scale acceptance criteria
- SLA + licensing

## 35. KPIs
- Partner adoption
- Stale payload rate
- Abuse/rate-limit events

## 36. Risks
- Passport leakage
- Scraping / AI harvesting

## 37. Mitigations
- Passport leakage → Hard route ban; contract tests
- Scraping / AI harvesting → robots/ai.txt; edge rate limits; ToS

| Risk | Mitigation |
| --- | --- |
| Passport leakage | Hard route ban; contract tests |
| Scraping / AI harvesting | robots/ai.txt; edge rate limits; ToS |

## 38. Dependencies
- Epic 01
- Epic 06
- Developer platform

## 39. Recommended owner / team
Developer platform + Access Infrastructure

## 40. Delivery horizon
Platform Commercialisation (Platform Commercialisation Wave)

## 41. Current claim state
**Proposed** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
- Penetration/IDOR review
- Council sign-off

---

## Features (4–8)

### 13-f1 — Partner auth and scopes
**Disposition:** REUSE  
**Summary:** API keys + scopes.  
**Reuse paths:** `PartnerApiClient`, `partner-api.md`  
**Acceptance:**
- Hashed keys

### 13-f2 — Places and features resources
**Disposition:** EXTEND  
**Summary:** Provenance-rich DTOs.  
**Reuse paths:** `partner-dto.ts`, `API_CONTRACTS`  
**Acceptance:**
- confidence/timestamps

### 13-f3 — Observations and verifications
**Disposition:** EXTEND  
**Summary:** Read verified evidence.  
**Reuse paths:** `Epic 01`  
**Acceptance:**
- Status honesty

### 13-f4 — Routes and venue-access
**Disposition:** NEW  
**Summary:** Non-personal route summaries.  
**Reuse paths:** `Epic 03`  
**Acceptance:**
- No passport

### 13-f5 — Licensing versioning change history
**Disposition:** NEW  
**Summary:** Commercial controls.  
**Reuse paths:** `developer platform`  
**Acceptance:**
- Version header

### 13-f6 — Rate limiting and abuse controls
**Disposition:** EXTEND  
**Summary:** Edge + API limits.  
**Reuse paths:** `middleware rate limit plans`  
**Acceptance:**
- 429 behaviour


## Stage-gate pass/fail (Epic-specific)

- **G0:** PASS if partner demand evidenced without passport need.
- **G1:** PASS if disability-led review of what is published publicly.
- **G2:** PASS if privacy/licensing review; passport ban verified.
- **G3:** PASS if scoped partner read with provenance.
- **G4:** PASS if limited partners; monitoring.
- **G5:** PASS if abuse and freshness KPIs.
- **G6:** PASS if continuous API assurance.

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
