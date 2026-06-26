# MapAble Strategic Wedges Roadmap

## Executive summary

MapAble's competitive positioning is **"Find support you can actually use."** These 25 strategic wedges extend the existing platform beyond directory search by combining verified availability, access-fit matching, care and transport coordination, evidence-based trust, and participant-controlled preferences.

Implementation follows a **shared-layers-first** approach: provider registry, availability graph, access-fit engine, trust/evidence layer, request tracker, consent system, and aggregated analytics — not 25 isolated mini-products.

## Strategic positioning

| Principle | Implementation |
|-----------|----------------|
| Beyond directories | Availability + access-fit + transport feasibility |
| Participant control | Access Pass, consent, share previews |
| Evidence-based trust | Verification badges separate from paid tiers |
| NDIS-aware, not determining | Informational copy only; no funding decisions |
| WCAG 2.2 AA | Semantic HTML, labels, focus states, plain language |

## Wedge table

| # | Wedge | Target user | Problem solved | MVP scope | Complexity | Impact | Monetisation | Dependencies | Priority |
|---|-------|-------------|------------------|-----------|------------|--------|--------------|--------------|----------|
| 1 | Availability Graph | Participants, coordinators | Find providers who can actually respond and accept new participants | Availability fields, filters, cards, mock data | Medium | High | Verified Profile tier | Provider registry | P0 |
| 2 | Access-Fit Matching | Participants | Match on real access needs, not just category/postcode | Scoring function, summary UI, demo profile | Medium | High | Conversion to requests | W1, Access Pass | P0 |
| 3 | Request Concierge | Participants, families, coordinators | Guided structured support requests | Multi-step form, review screen, filters output | Medium | High | Qualified introductions | W2 | P0 |
| 4 | Support Coordinator OS | Support coordinators | Track requests, shortlists, consent, first appointments | Dashboard shell, mock data, task board | Medium | High | B2B subscription | W3, W13, consent | P1 |
| 5 | Provider Access Profiles | Participants | Physical/digital/communication access readiness | Profile component, evidence list, disclaimers | Medium | High | Verified Profile | Accreditation domain | P0 |
| 6 | Provider Trust Score | Participants | Transparent evidence-based trust beyond stars | Scoring, badge, breakdown, evidence labels | Medium | High | Indirect (conversion) | Verification cases | P1 |
| 7 | PlanOps Lite | Participants, families | Plan visibility without plan-manager lock-in | Category explainer, request tracker, invoice checklist | Medium | Medium | Freemium | Dashboard | P1 |
| 8 | No-Waitlist Zones | Participants | Location-aware near-term capacity marketplace | Filters, cards, map/list toggle placeholder | Low | High | Qualified introductions | W1, W2 | P1 |
| 9 | SDA/SIL Vacancy Intelligence | Participants, families | Housing vacancy with access/support fit | Data model, cards, compatibility checker | High | Medium | Partner listings | Access-fit | P2 |
| 10 | MapAble Access Pass | Participants | Reusable accessibility profile with consent | Editor, summary, share preview, local-first | Medium | High | Platform stickiness | AccessibilityProfile | P2 |
| 11 | Provider Growth Tools | Providers | Operational tools better than ads | Listing quality score, checklist, demo analytics | Medium | Medium | Provider subscriptions | W1, W5, W6 | P2 |
| 12 | Qualified Introduction Pricing | Providers | Fair monetisation without pay-to-trust | Pricing page, tiers, enquiry form | Low | Medium | Direct revenue | W6, W16 | P2 |
| 13 | First Appointment Tracking | All roles | Discovery → real support completion | Timeline, status helpers, blocker capture | Medium | High | Platform value | Request tracker | P1 |
| 14 | Transport-Aware Profiles | Participants | "Can I actually get there?" on every profile | Transport panel, feasibility score, trip placeholder | Medium | High | Transport bundle | Transport module | P1 |
| 15 | Thin-Market Rescue Campaigns | Communities, MapAble ops | Organise demand in underserviced areas | Campaign cards, register forms, aggregation ethics | Medium | Medium | B2G partnerships | Analytics aggregation | P2 |
| 16 | MapAble Verified | Participants | Evidence-based verification levels | Badge, requirements, policy page | Medium | High | Separate from paid | W6, verification | P1 |
| 17 | Participant Review 2.0 | Participants | Structured practical feedback | Form, preview, moderation stub | Medium | Medium | Trust signals | W6 | P2 |
| 18 | AI Navigator with Receipts | Participants | Safe transparent assistant | Chat shell, receipts panel, demo responses | Medium | Medium | Premium feature | Agent infra, consent | P2 |
| 19 | Provider Response SLA | Participants | Visible provider responsiveness | Badge, stale warning, provider widget | Low | High | Trust differentiation | Reliability service | P1 |
| 20 | Journey Bundles | Participants | Life journeys not standalone searches | Bundle cards, step planner, progress state | Medium | High | Cross-sell | W3, W13, W14 | P2 |
| 21 | Local Access SEO Pages | Searchers | Useful local landing pages | Dynamic template, mock results, sitemap | Medium | High | SEO acquisition | W1, W2, W8 | P2 |
| 22 | B2B/B2G Intelligence | Councils, partners | Privacy-safe aggregated reporting | Dashboard, ethics notice, partner form | High | Medium | Enterprise | Analytics aggregation | P2 |
| 23 | MapAble Academy | Providers, workers | Accessibility and readiness training | Course catalog expansion, enquiry form | Low | Medium | Training revenue | Existing academy | P2 |
| 24 | Community Ambassadors | Volunteers | Community mapping and verification | Program page, challenges, safety guidelines | Medium | Medium | Community growth | Access map | P2 |
| 25 | Partner API | Developers, partners | Infrastructure for integrations | Developer page, module registry, mock examples | Medium | High | API partnerships | Auth, consent, rate limiting | P2 |

## Phased timeline

### 0–90 days

| Phase | Days | Wedges |
|-------|------|--------|
| Foundation | 0–30 | W1 Availability Graph, W2 Access-Fit, W3 Request Concierge, W5 Access Profiles |
| Accountability | 30–60 | W19 Response SLA, W13 First Appointment, W6 Trust Score, W16 Verified |
| Coordination | 60–90 | W4 Coordinator OS, W7 PlanOps Lite, W8 No-Waitlist, W14 Transport Profiles |

### 3–6 months

W20 Journey Bundles, W21 Local SEO, W17 Review 2.0, W11 Provider Growth Tools

### 6–12 months

W9 Housing, W15 Thin-Markets, W22 Intelligence, W23 Academy, W24 Ambassadors, W25 Partner API, W12 Pricing, W18 AI Navigator

## Shared infrastructure

| Layer | Path | Wedges served |
|-------|------|---------------|
| Provider registry | `lib/wedges/provider-registry/` | W1, W5, W8, W11, W14, W16, W19, W21 |
| Availability graph | `lib/wedges/availability/` | W1, W8, W11, W19 |
| Access-fit engine | `lib/access-fit/` | W2, W3, W5, W8, W10, W14 |
| Trust/evidence | `lib/trust/` | W6, W16, W17 |
| Request tracker | `lib/wedges/request-tracker/` | W3, W4, W13, W20 |
| Consent/sharing | `lib/consent/` (existing) | W3, W4, W10, W22 |
| Aggregated analytics | `lib/wedges/analytics/` | W15, W22 |

## Do not build yet

- Live transport fleet operations without transport partners
- Clinical advice automation
- Legal advice automation
- Emergency response automation
- Payment release automation without audit controls
- Public API without auth, consent, and rate limiting
- NDIS eligibility or funding decision automation
- Pay-to-trust dynamics (paid plans must not auto-improve trust scores)

## Acceptance criteria (Phase 1)

### W1 Availability Graph
- [ ] Provider availability types and mock dataset exist
- [ ] Filters: available this week, no waitlist, mobile, telehealth, weekend, urgent, funding, postcode
- [ ] ProviderAvailabilityCard shows last updated and disclaimer
- [ ] Empty, loading, and error states are accessible

### W2 Access-Fit Matching
- [ ] accessFitScore returns 0–100 with hard barriers, partial matches, unknowns
- [ ] AccessFitSummary uses text labels (not colour-only)
- [ ] Recommended questions generated for unknowns
- [ ] Unit tests cover scoring edge cases

### W3 Request Concierge
- [ ] `/request-support` form with all sections and validation
- [ ] Review-before-submit and success states
- [ ] Privacy notice and consent checkbox
- [ ] Outputs structured summary and suggested filters

### W5 Provider Access Profiles
- [ ] ProviderAccessProfile and AccessEvidenceList components
- [ ] Verification source labels (provider-declared, community-checked, etc.)
- [ ] "What to confirm before attending" and report outdated action

## Feature flags

See `lib/config/wedges.ts`:

- `WEDGES_MVP_ENABLED` — enables wedge UI on provider-finder and public routes
- `WEDGES_USE_MOCK_DATA` — uses mock providers until live registry API is connected
- `WEDGES_PERSIST_REQUESTS` — enables Prisma persistence for concierge/availability (requires migration)

## Related documentation

- [Platform provider patterns](mapable/platform-provider-patterns.md)
- [Wedge modules README](modules/wedges/README.md)
- [Design system](../design-system.md)
