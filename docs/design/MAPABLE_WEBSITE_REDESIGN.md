# MapAble Website Redesign

**Status:** Cursor-ready build brief (v2 — brand docs ingested)  
**Sources:**
- Live homepage screenshot (mapable.com.au)
- `app/index.css` tokens; marketing + dashboard route inventory
- `docs/strategy/*` (competitive position, operating lanes, ANZ gap analysis)
- Uploaded: *MapAble Marketing Plan.docx*, *Executive Summary.docx* (MapAble Go architecture), *MapAble Competitive Analysis & Marketing Strategy.docx*

**North star (repo SoT):** MapAble is **participant-controlled infrastructure** for accessibility journeys — not another marketplace, directory, rostering tool, or generic AI assistant. Public marketing must under-claim; bookings, claims, and Managed Support stay GO-gated until authorised.

**Doc reconciliation rule:** Marketing Plan + trust/brand recommendations drive **public site voice**. Competitive Analysis “super-app / marketplace commission” language is **strategy input only** until leadership records Option A vs B. Executive Summary (AccessLens / Digital Twin / MapAble Go) informs **dashboard + future product** handoffs — not first-viewport marketing claims.

---

## Brand translation (v2)

### Audience & value props (from Marketing Plan)

| Audience | Message | Site implication |
|----------|---------|------------------|
| People with disability (esp. mobility) | Empowerment / independence: **“Find accessible places confidently.”** | Home + Places as primary public job |
| NDIS participants & families | Closing the accessibility information gap | Guides, How it works, plain-language trust |
| Venues / businesses / agencies | Free listing → positive exposure to access-aware patrons | Providers / for-providers freemium pitch |
| Support coordinators / LACs | Practical aid to plan outings for clients | Dedicated SC pathway on Contact + How it works |

Accessible tourism context (Tourism Australia: ~21% of domestic tourism spend from travellers with disability) may appear in **About / evidence**, not the hero.

### Narrative layers (do not collapse)

| Layer | Source | Public copy today? |
|-------|--------|--------------------|
| **A — Map & community** | Marketing Plan | **Yes** — free, community-powered, evidence-based places |
| **B — Connected life / journey** | Competitive Analysis USP (“Your Life, Connected.”) aspirational; repo journey chain | **Soft** — How it works + pilot honesty; no national booking CTA |
| **C — MapAble Go / Digital Twin** | Executive Summary | **No** on marketing hero — Labs / future / dashboard roadmap only |
| **D — Marketplace commissions / 7 verticals** | Competitive Analysis | **Blocked** until Option A/B decision (R15) |

### Recommended public positioning (v2)

- **Tagline keep:** POWERING INDEPENDENCE.  
- **H1 keep:** Accessibility you can plan around.  
- **Support line (new):** Use MapAble’s evidence-based accessibility map and local guides today — then pre-register for the controlled pilot as a participant or provider.  
- **Alt conversion line (Places / SEO):** Find accessible places confidently.  
- **Ecosystem line (How it works only):** Connect places, transport, and support planning in one journey — with consent you control.  
- **Trust pillar:** Social enterprise under Australian Disability Ltd / “by the community, for the community” — lead on About and Trust sections.  
- **Differentiation vs Google / AccessNow / Wheelmap:** depth + evidence + hyper-local AU last-mile detail — not global scale; do **not** promise transactional Care booking on public map until authorised.

### Competitive takeaways → site rules

| Recommendation (Competitive Analysis) | Redesign action |
|---------------------------------------|-----------------|
| Phase 1 foundation = Map + Care + Transport; Sydney beachhead | Homepage Explore prioritises Places, Transport, Services; maturity chips |
| Fortify brand of trust / ADL social enterprise | About + Trust strip; avoid for-profit marketplace tone |
| Win last-mile accessibility data | Places/Guides content strategy; mapping days CTA |
| B2B partnership engine | Providers, for-providers, Contact role = employer/provider |
| Diversify beyond NDIS dependence | About/Contact language includes aged care / private-pay *interest* without inventing products |
| Contagion risk of super-app failures | Never market verticals that are not claim-approved; lane honesty |

### MapAble Go / Executive Summary → product (not marketing)

Use for Unified Dashboard + future Labs, not hero claims:

- ParticipantAuthority + ActionEnvelope (search free; book needs confirmation)
- Mobility Cockpit / Chair Mode: large targets, high contrast, informational only (never drive motors)
- AccessLens / Digital Twin / AccessVR as maturity-gated roadmap items
- Control Tower + human oversight levels for agent actions

### What the homepage already signals

| Signal | Evidence | Keep / change |
|--------|----------|---------------|
| Brand name as hero-level identity | Logo + “POWERING INDEPENDENCE.” | Keep; brand > secondary headlines |
| Navy + gold CTA system | Yellow primary, navy secondary, outline tertiary | Keep; map to CSS tokens |
| Plain-language promise | “Accessibility you can plan around.” | Keep H1; add Marketing Plan Places line on `/places` |
| Honesty about maturity | Pilot / informational framing | Strengthen; align Phase 1 beachhead honesty |
| Feature checklist under hero | Four ticks | Keep trust strip; reduce competing header CTAs |
| PayPal in primary header | Screenshot | Move to footer/support (R14) |

### Token mapping (shipped → redesign)

Canonical tokens already live in `app/index.css`:

| Token | HSL / hex | Role |
|-------|-----------|------|
| `--mapable-navy` / `--foreground` | `#0C1833` | Text, primary navy buttons, headers |
| `--mapable-brand` / `--primary` | `#005B7F` | Links, focus ring companion, brand teal-navy |
| `--mapable-gold` / `--accent` | `#F8C51C` | Primary conversion CTA (pre-register) |
| `--secondary` | `#00A979` | Success / “available now” — **never** white text on this colour (AA fail) |
| `--mapable-surface` / `--background` | `#F6FBFC` | Page surface |
| `--card` | `#FFFFFF` | Interactive cards only |
| Fonts | Outfit (display), Plus Jakarta Sans (body), Atkinson Hyperlegible (readable mode) | Keep; expose readable/dyslexia modes |

### Inclusive content rules (Marketing Plan)

- Diverse disability imagery — not wheelchair-only.  
- People-first / inclusive language.  
- Accessible media: alt text, captions, high contrast, large type.  
- SEO content: local guides, outing checklists, success stories (blog/knowledge base).  
- Lead magnets: newsletter + “accessible outing checklist” PDF on Contact / Home secondary.

### Claim discipline (non-negotiable)

- Connect ≠ Network ≠ Managed Support ≠ Infrastructure (`docs/strategy/OPERATING_LANES.md`).
- Informational GO routes only for programme explainers; no silent marketplace monetisation until leadership Option A/B is recorded (`BUSINESS_PLAN_ANZ_GAP_ANALYSIS.md`).
- AI may explain/draft — never approve workers, claims, payments, consent, or clinical decisions.
- Competitive Analysis commission / freemium marketplace copy must not ship on public pages while Option A remains default.

---

## Information architecture

### 1. Public marketing site

| Route | Purpose | Primary CTA |
|-------|---------|-------------|
| `/` Home | One composition: brand, promise, three CTAs, trust strip, explore grid | Pre-register |
| `/about` | Lived experience, mission, lane honesty | Contact / Pre-register |
| `/how-it-works` | Journey chain in plain language | Pre-register (participant / provider) |
| `/transport` Accessible Transport | Explainer + pilot status; not GTFS product claim | Explore places / Pre-register |
| `/care` or `/services` Support Coordination / Services | Programme explainer; not open marketplace | For providers / Pre-register |
| `/employment` Jobs / Opportunities | Explainer / alpha honesty | Get started (auth) |
| `/contact` Contact / Get Started | Single form + role chooser | Submit interest |
| Existing keepers | `/places`, `/guides`, `/providers`, `/accessibility-statement`, legal | Deep links from Explore |

**Nav (simplified):** Home · Places · How it works · Transport · Services · Jobs · About · Contact  
**Header actions:** Log in · Get started (navy) · Pre-register (gold, highest salience)

### 2. Unified Accessible Dashboard (`/dashboard` + `/my`)

| Surface | Audience | Job |
|---------|----------|-----|
| Participant home | Participant / nominee | Next actions, upcoming trips/care, alerts |
| Provider / support worker view | Provider staff / workers | Assigned work, readiness, evidence capture |
| Trip / booking status | Participant + dispatcher | Status timeline with plain-language states |
| Accessibility preferences | Participant | Functional requirements (not diagnosis inference) |
| Messaging / notifications | All roles | Consent-scoped threads |
| Tasks / approvals | Nominee, coordinator, provider | Human gates only |
| Settings / profile | All | Identity, roles, readable mode, motion |
| Evidence / audit / consent | Participant authority | Purpose-bound consent, export, dispute |

### Current → target IA deltas

| Today (repo) | Target |
|--------------|--------|
| Dense marketing nav (Pre-register, Places, Guides, Transport, Providers, NDIS Guidance) | Shorter primary nav + “Explore” secondary |
| Many parallel app roots (`/my`, `/dashboard`, `/care`, `/transport`, …) | Role home that deep-links into lane products |
| Homepage explore cards (Places, Care, …) | Keep; one job per card; honesty label on each |

---

## Homepage / content strategy

### First viewport (hero budget)

1. Brand (logo + POWERING INDEPENDENCE)  
2. One H1: **Accessibility you can plan around.**  
3. One support sentence: evidence-based map + guides today; pilot pre-register (participant or provider).  
4. CTA group: Pre-register (gold) · Explore places (navy) · About (outline)  
5. Dominant atmosphere (soft surface / map texture — full-bleed, no inset card collage)  
**Do not put** stats, tourism %, schedules, device roadmaps, or secondary promos in the first viewport.

### Below the fold

1. **Explore MapAble** — Places (Available now), Guides (Available now), Transport (Explainer / Pilot), Services (Explainer / Pilot).  
2. **How a journey works** — repo chain + soft “life connected” narrative without national booking CTAs.  
3. **Who it’s for** — participants & families · providers/venues · support coordinators (Marketing Plan audiences).  
4. **Trust & community** — ADL social enterprise; mapping days / volunteer campaigns; testimonials slot.  
5. **Trust & limits** — beachhead / pilot honesty; accessibility statement.  
6. **Get started** — role chooser → pre-register / contact; optional newsletter + outing checklist lead magnet.

### Tone

- Plain language, short sentences, active voice.  
- Prefer “you can…” over “we leverage…”.  
- Always pair capability with maturity label: `Available now` | `Pilot` | `Explainer only` | `Future research`.  
- Prefer Marketing Plan empowerment voice on Places; journey voice on How it works; never Executive Summary device jargon on Home.

---

## Design system translation

### Principles → UI rules

| Principle | UI rule |
|-----------|---------|
| Keyboard-first | Visible `:focus-visible` ring (`--ring`); skip link; no mouse-only menus |
| Strong contrast | Navy text on white/surface; gold CTA uses navy text; never white on `#00A979` |
| Clear focus | 3px ring, 2px offset; focus order matches reading order |
| Plain language | Max ~20 words per sentence in marketing; status chips use verbs |
| Large hit targets | Min 44×44px; CTA buttons ≥ 48px height |
| Landmarks | `header`, `nav`, `main`, `aside`, `footer`; one `h1` per page |
| Reduced cognitive load | One job per section; max 3 CTAs in a group |
| Consistent structure | Title → one sentence → action → optional detail |
| Motion controls | Honour `prefers-reduced-motion`; no essential info in motion only |
| Zoom resilience | Layout to 200% zoom; no horizontal scroll at 320–1280px |

### Component inventory (accessible)

| Component | Notes |
|-----------|-------|
| `SkipLink` | First focusable |
| `SiteHeader` / `SiteFooter` | Landmark + mobile disclosure with focus trap |
| `Button` (primary gold / secondary navy / tertiary outline / ghost) | Disabled ≠ remove from tab order without reason |
| `StatusChip` | Available / Pilot / Explainer / Action needed |
| `TrustStrip` | Check list with text, not colour alone |
| `ExploreCard` | Interactive card only; title, one sentence, maturity chip, link |
| `JourneyStepper` | List alternative always present |
| `RoleChooser` | Radiogroup pattern |
| `ConsentPanel` | Purpose, recipient, fields, revoke |
| `AlertBanner` | Role=`status` or `alert` as appropriate |
| `DataTable` + `CardList` | Table + list dual presentation for maps/graphs |
| `FocusRing` utility | Shared token |
| `ReadableModeToggle` | Settings + header affordance |
| `MotionPreference` | Settings sync with OS |

### Spacing & type scale

- Base unit: 4px; section padding: 64–96px desktop, 40px mobile.  
- H1: clamp(2.25rem, 4vw, 3.25rem); H2: 1.75–2rem; body: 1.0625rem / 1.65.  
- Radius: `--radius` 0.75rem for interactive surfaces; avoid pill CTAs for primary actions (keep rounded-lg for a11y clarity).

---

## Design tokens (implementation)

```css
:root {
  --mapable-navy: 222 56% 12%;      /* #0C1833 */
  --mapable-brand: 196 100% 25%;     /* #005B7F */
  --mapable-gold: 45 94% 54%;        /* #F8C51C */
  --mapable-surface: 195 50% 98%;    /* #F6FBFC */
  --mapable-success: 160 100% 33%;   /* #00A979 — use navy text */
  --focus-ring: 215 100% 35%;
  --target-min: 2.75rem;            /* 44px */
  --font-display: "Outfit", sans-serif;
  --font-body: "Plus Jakarta Sans", sans-serif;
  --font-readable: "Atkinson Hyperlegible", sans-serif;
}
```

Tailwind bridges already exist under `theme.extend.colors.mapable.*`. Prefer those over new hex literals.

---

## Page-by-page rewrite

### Marketing

#### Home `/`
- H1 unchanged.  
- Subcopy: one sentence on public map + programme explainers + pilot pre-register.  
- CTA: Pre-register · Explore places · About.  
- Explore grid: Places, Guides, Transport, Services — each with maturity chip.  
- Remove PayPal from primary header (move to funding/support footer if required).

#### About `/about`
- Lived experience origin; participant authority; four lanes explained without legal theatre.  
- Team / contact CTA.

#### How it works `/how-it-works` (new or rewrite)
- Visual + list dual: goal → consent → Communication Passport → provider/worker readiness → transport/environment fit → delivery → evidence → recovery.  
- Explicit: no automatic assignment; no pay-to-rank.

#### Accessible Transport `/transport`
- Honest status from `lib/transport/public-copy.ts` patterns.  
- What pilot includes vs journey-planner demo.  
- CTA to places + pre-register — not “book a ride nationally.”

#### Services `/care` (Support Coordination / Services)
- Connect vs Network language.  
- Provider path: `/for-providers`.  
- Participant path: pre-register.

#### Jobs `/employment`
- Explainer + alpha honesty; link authenticated jobs only after login.

#### Contact `/contact`
- Role chooser (participant, provider, coordinator, other).  
- Single form; confirm plain-language privacy note.

### Dashboard

| Page | Rewrite intent |
|------|----------------|
| Participant home | “What needs you today” — tasks, trips, messages; no dense widget wall |
| Provider / worker | Assigned shifts/trips; readiness checklist; evidence capture |
| Trip / booking status | Timeline + list; dispute / confirm actions |
| Accessibility preferences | Functional requirements editor; export |
| Messaging | Consent-scoped; unread as text not colour only |
| Tasks / approvals | Human gate queue; AI suggestions clearly labelled |
| Settings / profile | Readable mode, motion, notification channels |
| Evidence / audit / consent | Purpose-bound grants; revoke; download audit |

---

## Accessibility-first design principles (acceptance)

1. Keyboard-first navigation across marketing + dashboard.  
2. Contrast ≥ WCAG 2.2 AA (prefer AAA for body text).  
3. Clear focus states on all interactive elements.  
4. Plain-language content reviewed for cognitive load.  
5. Hit targets ≥ 44×44px.  
6. Screen-reader landmarks and labelled controls.  
7. One primary job per view.  
8. Consistent page chrome (header, title, actions, content).  
9. Motion respects `prefers-reduced-motion`.  
10. Usable at 200% zoom and with readable font mode.

---

## Cursor prompt set

### Prompt A — Marketing shell
```text
Implement the MapAble marketing IA in the Next.js app/(marketing) group.
Use existing mapable.* Tailwind tokens from app/index.css. Simplify SiteHeader
nav to: Home, Places, How it works, Transport, Services, Jobs, About, Contact.
Header actions: Log in, Get started (navy), Pre-register (gold). Remove PayPal
from the primary header. Meet WCAG 2.2 AA; keyboard-first; skip link; one h1.
Do not invent marketplace booking claims. Follow docs/design/MAPABLE_WEBSITE_REDESIGN.md.
```

### Prompt B — Homepage rewrite
```text
Rewrite components/marketing/MapAbleCareCombinedHomepage to the v2 hero budget in
docs/design/MAPABLE_WEBSITE_REDESIGN.md: brand, H1 “Accessibility you can plan
around.”, support sentence with map + guides + pilot honesty, three CTAs, trust
strip, then Explore / How it works / Who it’s for (participants, providers,
coordinators) / Trust & community (ADL social enterprise + mapping days) /
Trust & limits. Full-bleed atmosphere only; no inset hero collage; no cards in
the hero. Maturity chips on Explore cards. Do not mention AccessLens, Digital
Twin, commissions, or nationwide care booking.
```

### Prompt C — How it works page
```text
Add app/(marketing)/how-it-works/page.tsx with journey stepper + list alternative
from COMPETITIVE_POSITION.md chain. Plain language. CTA to pre-register for
participant and provider. Link accessibility statement.
```

### Prompt D — Dashboard participant home
```text
Redesign app/dashboard/page.tsx (or my/home) as Unified Accessible Dashboard
participant home: next actions, upcoming trips/care, messages, preference summary.
Landmarks, 44px targets, readable mode support. No AI auto-approval UI.
```

### Prompt E — Consent / evidence surfaces
```text
Implement or harden consent + evidence panels: purpose, recipient, fields,
revoke, audit download. Participant authority; no ambient supporter access.
Align with docs/strategy/COMPETITIVE_POSITION.md defensibility rules.
```

### Prompt F — A11y pass
```text
Run an accessibility pass on marketing shell + homepage + dashboard home:
focus order, contrast, landmarks, reduced motion, zoom 200%, hit targets.
Add Playwright a11y smoke where patterns exist under tests/.
```

---

## Implementation backlog

| ID | Item | Lane | Priority |
|----|------|------|----------|
| R1 | Marketing nav + header CTA cleanup | Marketing | P0 |
| R2 | Homepage hero budget rewrite | Marketing | P0 |
| R3 | How it works page | Marketing | P0 |
| R4 | Contact role chooser | Marketing | P1 |
| R5 | Transport/Services copy honesty pass | Marketing | P1 |
| R6 | Design token documentation in Storybook or MDX | System | P1 |
| R7 | Accessible component primitives (Button, Chip, SkipLink) audit | System | P0 |
| R8 | Participant dashboard home | Dashboard | P0 |
| R9 | Trip/booking status dual view | Dashboard | P1 |
| R10 | Preferences + readable/motion settings | Dashboard | P1 |
| R11 | Messaging/notifications a11y | Dashboard | P2 |
| R12 | Tasks/approvals human-gate UI | Dashboard | P1 |
| R13 | Consent/evidence/audit surfaces | Dashboard | P0 |
| R14 | Remove/relocate PayPal primary chrome | Marketing | P1 |
| R15 | Leadership Option A/B recorded before marketplace UX | Strategy | P0 blocker |

---

## Acceptance criteria

### Marketing
- [ ] First viewport matches hero budget (brand, H1, one sentence, ≤3 CTAs, no secondary promos).  
- [ ] Primary nav ≤ 8 items; Pre-register is the gold CTA.  
- [ ] Every Explore card has a maturity chip.  
- [ ] No public copy implies nationwide live care/transport booking or Managed Support.  
- [ ] Lighthouse/axe: no critical a11y violations on `/`, `/about`, `/how-it-works`, `/contact`.  
- [ ] Keyboard-only completion of pre-register path.

### Dashboard
- [ ] Participant home answers “what do I need to do?” in one screenful.  
- [ ] All status colours have text labels.  
- [ ] Consent revoke works and is audited.  
- [ ] Maps/graphs have list alternatives.  
- [ ] Readable mode + reduced motion respected.  
- [ ] 200% zoom usable without loss of primary actions.

### Delivery
- [ ] Preview deploy green.  
- [ ] Claim registry / GO gates unchanged unless leadership decision logged.  
- [ ] Definition of Done from Development Plan (security, consent, RLS, audit, a11y, CI, demoable).

---

## Handoff — Unified Accessible Dashboard

**Owner:** product + frontend  
**Scope:** role-aware shell over existing `/dashboard` and `/my` routes; do not fork a second design system.  
**Must reuse:** mapable tokens, consent APIs, transport/care status models, Communication Passport fields.  
**Must not:** auto-assign workers; AI approval of payments/claims; ambient nominee access; wheelchair motor control.  
**Authority model (Executive Summary):** search/filter may be self-serve; draft booking = participant confirmation; book/cancel = explicit approval + audit.  
**Chair Mode UI cues:** large hit targets, high contrast, plain route steps, REROUTE / DETAILS — informational only.  
**First slice:** participant home + trip status + preferences + consent panel.  
**Later (gated):** AccessLens / Digital Twin / AccessVR as Labs maturity, not default dashboard chrome.  
**Success:** participant completes “check trip → confirm/dispute → update preference” keyboard-only in <2 minutes on Preview.

---

## Handoff — MapAble Strategy & Delivery

**Owner:** leadership + strategy  
**Decisions needed:**
1. Record Option A (orchestration / repo SoT) vs B (Competitive Analysis marketplace + commissions) in `BUSINESS_PLAN_ANZ_GAP_ANALYSIS.md`.  
2. Confirm public Phase 1 narrative = Map + Care/Transport explainers + Sydney beachhead honesty (per Competitive Analysis sequencing).  
3. Confirm PayPal placement (footer/support only vs remove).  
4. Confirm `/how-it-works` as primary education URL; Places SEO line “Find accessible places confidently.”  
5. Confirm whether “Your Life, Connected.” is approved as secondary brand line or reserved.  
6. Decide when MapAble Go / AccessLens / Digital Twin may appear on Labs vs stay internal.  
**Delivery sequence:** R15 decision → R1/R7 → R2/R3 → R8/R13 → R5/R9/R10 → remaining.  
**Risk:** Competitive Analysis marketplace language leaking into public UI while claim registry forbids it; Executive Summary future-tech overclaiming on Home.

### Marketing engine backlog (from Marketing Plan — non-UI)

| ID | Item | Note |
|----|------|------|
| M1 | Newsletter + outing checklist lead magnet | Contact / Home secondary |
| M2 | Mapping days campaign page/module | Already has `/mapping-days` — align CTA |
| M3 | Blog / local guides SEO programme | Guides + resources |
| M4 | Advocacy / SC / LAC partner pack | PDF + Contact roles |
| M5 | Accessible social/email content standards | Alt text, captions, contrast |

---

## Tech stack recommendations

- Stay on **Next.js App Router** + existing Tailwind token bridge.  
- Prefer server components for marketing; client only for interactive dashboard widgets.  
- A11y: eslint-plugin-jsx-a11y + Playwright axe smoke.  
- Content: keep programme copy adjacent to GO/claim helpers — do not hardcode maturity in random components.  
- No new component library; extend current primitives.  
- Dashboard agent actions (if any) must follow ParticipantAuthority / ActionEnvelope patterns from Executive Summary — confirm before book.

---

## Delivery sequence

1. Strategy gate (Option A/B).  
2. Shell + tokens + primitives.  
3. Homepage + How it works + Contact (v2 messaging).  
4. Dashboard participant slice (authority-first).  
5. Consent/evidence.  
6. Transport/Services honesty + trip status.  
7. Jobs/messaging polish + mapping-days CTA.  
8. Full a11y regression + Preview demo.

---

## Source documents (ingested)

| File | Role in brief |
|------|----------------|
| MapAble Marketing Plan.docx | Public audience VPs, grassroots channels, inclusive content rules |
| MapAble Competitive Analysis & Marketing Strategy.docx | USP, competitive matrix, Phase 1–3 sequencing, beachhead, trust brand — **gated** vs Option A/B |
| Executive Summary.docx (MapAble Go) | Dashboard / future architecture: authority envelopes, Chair Mode a11y, Digital Twin — **not** Home claims |

Visual brand rules in these Word docs do not override `app/index.css` tokens unless design leadership issues a new token PR.
