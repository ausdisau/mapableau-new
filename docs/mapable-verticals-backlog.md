# MapAble verticals product backlog

Generated from the vertical registry (`lib/mapable/verticals.ts`). Prioritised for asset-light, ecosystem-native rollout.

## Priority 1 — PlanOps

| Field | Detail |
|-------|--------|
| **Goal** | Unified support coordination and plan visibility dashboard |
| **Target users** | Participants, families, support coordinators, providers, plan managers |
| **MVP scope** | Read-only plan summary, booking list, invoice status, gap alerts, CSV export |
| **Out of scope** | Automated funding decisions, payment release, legal advice |
| **Data required** | Bookings, invoices, NDIS line items, consent scopes |
| **Ecosystem dependencies** | Core, Care, Transport, Access Pass |
| **Accessibility** | WCAG 2.2 AA dashboard, plain-language budget summaries |
| **Privacy / consent** | Participant-controlled sharing; role-based views |
| **Regulatory notes** | NDIS-aware, not NDIS-dependent; informational only |
| **Monetisation** | Coordinator and plan manager subscriptions |
| **Launch risk** | Medium — financial data sensitivity |
| **Success metrics** | Pilot retention, time saved reconciling invoices, coordinator NPS |
| **First experiment** | 10-family pilot with manual data import |

## Priority 2 — Home

| Field | Detail |
|-------|--------|
| **Goal** | Accessible housing discovery and modification pathway |
| **Target users** | Participants, families, OTs, housing providers, contractors |
| **MVP scope** | Home profile, modification checklist, "Can I live here?" address concept |
| **Out of scope** | Tenancy legal advice, building certification, funding eligibility |
| **Data required** | Address access notes, modification history, provider directory |
| **Ecosystem dependencies** | Care, Transport, Marketplace, Accreditation, PlanOps |
| **Accessibility** | Plain-language housing terms; no colour-only risk indicators |
| **Privacy / consent** | No public address display without consent |
| **Regulatory notes** | Not building or tenancy legal advice |
| **Monetisation** | Provider listings, assessor partnerships |
| **Launch risk** | Medium — sensitive housing data |
| **Success metrics** | Pilot sign-ups, modification pathway completions |
| **First experiment** | Partner with 3 OT assessors for guided home profiles |

## Priority 3 — AccessOps

| Field | Detail |
|-------|--------|
| **Goal** | B2B/B2G accessibility operations for venues and councils |
| **Target users** | Councils, venues, universities, event organisers, tourism operators |
| **MVP scope** | Structured assessment, public guide page, improvement roadmap, trust badge |
| **Out of scope** | Legal certification claims, automated compliance scoring |
| **Data required** | Assessment domains, staff training records, reassessment dates |
| **Ecosystem dependencies** | Accreditation, Intelligence, Academy, Access Map |
| **Accessibility** | Text labels on badges; not colour-only status |
| **Privacy / consent** | Public vs internal assessment data separation |
| **Regulatory notes** | Verification is not legal certification |
| **Monetisation** | Venue and council subscriptions |
| **Launch risk** | Low–medium |
| **Success metrics** | Assessments completed, public page views, reassessment rate |
| **First experiment** | 5-venue pilot with manual assessments |

## Priority 4 — Life

| Field | Detail |
|-------|--------|
| **Goal** | Accessible community activity and event discovery |
| **Target users** | Adults with disability, event organisers, councils |
| **MVP scope** | Event directory, access filters, transport/care booking prompts |
| **Out of scope** | Event liability, full moderation at scale |
| **Data required** | Event access details, venue links, transport options |
| **Ecosystem dependencies** | Access Map, Transport, Care, Access Pass |
| **Accessibility** | Structured access fields per event |
| **Privacy / consent** | User participation privacy controls |
| **Regulatory notes** | Not responsible for third-party events |
| **Monetisation** | Event listings, council partnerships |
| **Launch risk** | Low |
| **Success metrics** | Events listed, attendance via MapAble transport links |
| **First experiment** | Council activity feed in one LGA |

## Priority 5 — Transition

| Field | Detail |
|-------|--------|
| **Goal** | Life transition coordination (hospital-to-home, job-start) |
| **Target users** | Participants, families, hospitals, rehab providers, coordinators |
| **MVP scope** | Checklist, transport booking, care schedule, task board |
| **Out of scope** | Clinical discharge decisions, emergency care |
| **Data required** | Discharge tasks, appointments, equipment needs |
| **Ecosystem dependencies** | Care, Transport, Foods, Home, PlanOps |
| **Accessibility** | Plain-language checklists |
| **Privacy / consent** | Family/coordinator sharing with consent |
| **Regulatory notes** | Not clinical advice; human review for high-risk |
| **Monetisation** | Hospital and coordinator partnerships |
| **Launch risk** | High |
| **Success metrics** | Checklist completion rate, readmission proxy indicators |
| **First experiment** | Hospital-to-home pilot with one rehab unit |

## Priority 6 — Ageing

| Field | Detail |
|-------|--------|
| **Goal** | Coordinated support for older people and ageing carers |
| **Target users** | Older disabled people, carers, adult children, aged care providers |
| **MVP scope** | Family dashboard, transport/meals links, home checklist |
| **Out of scope** | Aged care funding eligibility advice |
| **Data required** | Support schedules, family contacts, service reminders |
| **Ecosystem dependencies** | Care, Transport, Foods, Home, Life |
| **Accessibility** | Large text options; dignity-focused language |
| **Privacy / consent** | Consent-controlled family sharing |
| **Regulatory notes** | General information only |
| **Monetisation** | Aged care provider partnerships |
| **Launch risk** | Medium |
| **Success metrics** | Family dashboard adoption, service reminder engagement |
| **First experiment** | 20-family ageing carer pilot |

## Priority 7 — Academy

| Field | Detail |
|-------|--------|
| **Goal** | Micro-learning for accessible service skills |
| **Target users** | Workers, venues, drivers, employers, volunteers |
| **MVP scope** | 3 micro-courses, completion badges, org dashboard |
| **Out of scope** | Replacing formal qualifications |
| **Data required** | Course content, completion records, renewal dates |
| **Ecosystem dependencies** | AccessOps, Accreditation, Care, Transport |
| **Accessibility** | Plain-language modules; captioned video |
| **Privacy / consent** | Training records tied to org consent |
| **Regulatory notes** | Awareness training only |
| **Monetisation** | Organisation training subscriptions |
| **Launch risk** | Low |
| **Success metrics** | Course completions, org renewal rate |
| **First experiment** | Support worker essentials course with 2 providers |

## Priority 8 — Access Pass

| Field | Detail |
|-------|--------|
| **Goal** | Consent-controlled accessibility profile |
| **Target users** | Participants, workers, venues, employers, transport partners |
| **MVP scope** | Profile, share links with expiry, consent log |
| **Out of scope** | Mandatory profiles, surveillance features |
| **Data required** | Access preferences, communication notes, emergency contacts |
| **Ecosystem dependencies** | Care, Transport, Jobs, Home |
| **Accessibility** | User-controlled disclosure levels |
| **Privacy / consent** | Private by default; revocable shares |
| **Regulatory notes** | User-owned; no mandatory sharing |
| **Monetisation** | Premium features, partner API access |
| **Launch risk** | Medium — privacy sensitivity |
| **Success metrics** | Profiles created, shares per user, revoke rate |
| **First experiment** | Transport driver share pilot |

## Priority 9 — Ready

| Field | Detail |
|-------|--------|
| **Goal** | Emergency and disruption readiness planning |
| **Target users** | Participants, families, providers, councils |
| **MVP scope** | Readiness checklist, equipment notes, emergency contacts |
| **Out of scope** | Emergency response, crisis automation |
| **Data required** | Equipment dependencies, backup contacts, shelter directory |
| **Ecosystem dependencies** | Transport, Care, Home, Access Pass |
| **Accessibility** | Plain-language plans; prominent 000 signposting |
| **Privacy / consent** | Controlled emergency contact sharing |
| **Regulatory notes** | Not an emergency service |
| **Monetisation** | Council readiness partnerships |
| **Launch risk** | High — safety expectations |
| **Success metrics** | Checklists completed, council partnerships |
| **First experiment** | Community readiness workshop + checklist |

## Priority 10 — Rights Navigator

| Field | Detail |
|-------|--------|
| **Goal** | Plain-language issue organisation and escalation support |
| **Target users** | Participants, advocates, families, coordinators |
| **MVP scope** | Issue log, evidence timeline, share with advocate |
| **Out of scope** | Legal advice, automated escalation, safeguarding authority |
| **Data required** | Issue entries, dates, evidence attachments |
| **Ecosystem dependencies** | PlanOps, Access Pass, Intelligence |
| **Accessibility** | Plain language; trauma-informed UX |
| **Privacy / consent** | Strict sharing controls; safeguarding signposting |
| **Regulatory notes** | Not legal advice; refer to advocates |
| **Monetisation** | Advocacy organisation partnerships |
| **Launch risk** | High |
| **Success metrics** | Issues logged, advocate shares, resolution tracking |
| **First experiment** | Advocate partnership with issue export |

## Priority 11 — Intelligence

| Field | Detail |
|-------|--------|
| **Goal** | Privacy-safe aggregated accessibility insights |
| **Target users** | Councils, governments, providers, employers |
| **MVP scope** | Gap dashboard, heatmap concept, policy brief export |
| **Out of scope** | Individual tracking, data sales |
| **Data required** | Aggregated access scores, service density, transport gaps |
| **Ecosystem dependencies** | Access Map, Accreditation, AccessOps |
| **Accessibility** | Readable reports; data tables with headers |
| **Privacy / consent** | Aggregation thresholds; opt-out where applicable |
| **Regulatory notes** | No sale of personal disability data |
| **Monetisation** | Council and enterprise reporting subscriptions |
| **Launch risk** | Medium — data ethics scrutiny |
| **Success metrics** | Reports delivered, council renewals, gap actions taken |
| **First experiment** | One council accessibility scorecard |

---

## Do not build yet

These require more validation, capital, or governance before engineering investment:

- **Full transport fleet operations** — high capital and operational intensity
- **Clinical advice automation** — regulatory and safety risk
- **Legal advice automation** — unauthorised practice risk
- **Crisis response automation** — must not replace emergency services
- **Food production operations** — physical ops before demand validation
- **Direct worker employment model changes** — labour and compliance complexity
- **AI decisions without human review** — trust and safeguarding risk

---

*Source: `lib/mapable/verticals.ts` — update registry first, then refresh this backlog.*
