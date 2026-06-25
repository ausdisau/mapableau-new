# MapAble product backlog (Cursor Prompt Pack)

Sequenced for a 6-week MVP sprint. Status: **done** | **partial** | **gap**.

## Week 1 — Audit, design system, homepage

### Epic 1: Public site and early access funnel (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Site audit doc | done | As a developer I need a stack audit | Safe refactors | None | `docs/cursor-site-audit.md` exists | N/A | Low | `docs/` |
| Ecosystem homepage | partial | As a visitor I understand MapAble's full ecosystem | Conversion | Design system | Hero, trust, problem/solution, CTAs | One h1, keyboard CTAs | Low | `components/marketing/`, `lib/marketing/` |
| Early access forms (5) | partial | As a partner I can register interest by role | Lead capture | Contact API | Validated forms, consent checkbox | Labels, errors announced | Med | `lib/interest/`, `app/api/interest/` |
| Partner onboarding pages | partial | As supply-side I know how to join | Pipeline | Forms | `/employers`, `/venues`, `/transport-partners` | Plain language | Low | `app/(marketing)/` |

### Epic 12: Content and community growth (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Resource library | partial | As a visitor I can read guides | SEO trust | Content stubs | `/resources/[slug]` with metadata | TOC, headings | Low | `content/resources/`, `app/(marketing)/resources/` |

## Week 2 — Forms, access map landing, SEO

### Epic 2: Evidence-based accessibility map (partial → done)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live map shell | done | As a user I browse places on a map | Core product | Prisma, MapLibre | `/access/map` works | List + map views | Med | `app/access/map/`, `lib/access-map/` |
| Community reports | done | As a reviewer I submit structured reports | Data quality | Auth optional | Stepped form, moderation | Form labels | Med | `lib/access-reviews/` |
| Access landing page | partial | As a visitor I understand the map | SEO funnel | Map MVP | Rich landing + search preview | Keyboard filters | Low | `app/access/page.tsx` |
| Transport bridge | done | As a user I plan transport from a place | Differentiation | Transport module | Plan CTA, trip feedback | Clear CTAs | Med | `lib/access-transport/` |

**Legal review:** Community reports are observations, not compliance certificates.

## Week 3 — Care+transport demo, jobs page

### Epic 5: Care + Transport bundled booking (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend orchestrator | done | As a system I link care + transport | Operational efficiency | Prisma | `createLinkedTransportFromCareRequest` | N/A | Med | `lib/orchestration/` |
| Public demo flow | partial | As a visitor I see bundled journey | Sales demo | Design system | `/demo/care-transport`, clearly labelled demo | Multi-step keyboard flow | Low | `app/(marketing)/demo/` |
| Buffer time logic | partial | As a user I see pickup window | Trust | Config | Unit tests for summary | Plain language | Low | `lib/demo/care-transport-summary.ts` |

### Epic 6: Inclusive Jobs and support planning (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Employment marketing | partial | As a job seeker I see Jobs value prop | Pipeline | Design system | `/employment` enhanced | Consent language | Low | `app/employment/` |
| Interview planning demo | partial | As a candidate I plan interview supports | Product vision | Governance UI | Editable summary, consent toggles default-off | Granular consent | Med | `components/jobs/` |
| Authenticated jobs | done | As a signed-in user I use jobs dashboard | Core | Auth | `/dashboard/jobs` | Existing patterns | Med | `app/dashboard/jobs/` |

## Week 4 — Accreditation, NDIS rule engine

### Epic 4: Accreditation scoring (done)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scoring function | done | As a system I score venue accessibility | Trust layer | Criteria config | Deterministic, tested | N/A | **Legal review** | `lib/access-accreditation/` |
| Public explainer | partial | As a venue owner I understand tiers | Transparency | Scoring | Disclaimer, tier meanings | No colour-only status | **Legal review** | `components/access-accreditation/` |

### Epic 8: NDIS rule engine (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Config-driven rules | partial | As ops I configure funding guidance flags | Compliance support | Claim validation | `lib/ndis-rule-engine/*` | Plain English messages | **NDIS/legal review** | `lib/ndis-rule-engine/` |
| Claim validate API | done | As a provider I validate claims | Revenue | Prisma | `/api/ndis/claims/validate` | N/A | **NDIS review** | `lib/ndis/claiming/` |

## Week 5 — Governance, analytics, security

### Epic 9: Smart contract and attestation layer (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DB contract runner | done | As a system I enforce contracts | Governance | Prisma | `runSmartContract` | N/A | Med | `lib/contracts/contract-runner.ts` |
| Pure contract layer | partial | As a dev I test contracts without DB | Testability | Types | `runContracts.ts` + samples | N/A | Med | `lib/contracts/` |
| Governance UI | partial | As a user I see review states | Transparency | Demos | Status cards on demo flows | aria-live | Low | `components/governance/` |

### Epic 11: Analytics and conversion tracking (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event abstraction | partial | As product I track CTAs safely | Conversion | Consent | Sanitised `trackEvent` | No sensitive fields | Med | `lib/analytics/` |
| Marketing wiring | gap | As product I see funnel events | Optimisation | Forms | Homepage + form events | Cookie consent | Low | Marketing components |

### Epic 10: Security, privacy, and accessibility QA (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Privacy notes doc | partial | As ops I know data handling | Compliance | Audit | `docs/security-privacy-notes.md` | N/A | Med | `docs/` |
| Form rate limiting | done | As ops I limit spam | Security | IP limit | `/api/contact` 429 | N/A | Low | `lib/api/ip-rate-limit.ts` |
| Axe automation | partial | As QA I catch a11y regressions | WCAG | Playwright | `pnpm test:a11y` | Critical violations = fail | Low | `tests/a11y/` |

## Week 6 — Tests, deployment, polish

### Epic 3: Venue/provider onboarding (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Venue claim flow | done | As an owner I claim a venue | Data quality | Auth | Existing claim APIs | Form access | Med | `lib/access-venues/` |
| Provider interest | partial | As a provider I register | Pipeline | Forms | Dedicated form + page | Consent | Low | `/for-providers` |

### Epic 7: MapAble Core dashboard (done)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authenticated dashboard | done | As a user I manage services | Retention | Auth | `/dashboard/**` | Keyboard nav | Med | `app/dashboard/` |
| Demo dashboard shell | partial | As a visitor I preview Core | Marketing | Design system | `/demo/dashboard` static | Tabs keyboard | Low | `app/(marketing)/demo/dashboard/` |

### Deployment (partial)

| Story | Status | User story | Business value | Dependencies | Acceptance criteria | A11y notes | Risk | File areas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deployment runbook | partial | As ops I deploy safely | Reliability | Vercel | `docs/deployment-runbook.md` | Launch checklist | Med | `docs/` |
| Health check | partial | As ops I monitor uptime | Ops | API route | `GET /api/health` | N/A | Low | `app/api/health/` |

## Cross-cutting: Design system (partial → done)

| Story | Status | File areas |
| --- | --- | --- |
| Tokens + reduced motion | partial | `app/index.css` |
| Core components | partial | `components/ui/`, `components/a11y/` |
| Demo route | partial | `app/(marketing)/design-system/page.tsx` |

## Items requiring legal, NDIS, or clinical review

- NDIS rule engine outputs and public messaging
- MapAble Accreditation tier claims (not legal compliance)
- Care + transport demo funding category placeholders
- Employment disclosure and employer-facing access need sharing

## Dependencies graph

```
Design system → Homepage → Forms → Demos → Governance UI
Access map MVP → Access landing → Accreditation explainer
Orchestrator → Care+transport demo → NDIS rule flags
Contract runner → Pure layer → Governance UI
```
