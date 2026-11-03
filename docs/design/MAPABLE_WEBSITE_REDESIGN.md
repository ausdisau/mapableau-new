# MapAble Website Redesign

**Status:** Cursor-ready build brief (v1)  
**Sources:** live homepage screenshot (mapable.com.au), `app/index.css` tokens, `docs/strategy/*`, marketing + dashboard route inventory  
**Missing inputs:** `Executive Summary.docx` and `MapAble Competitive Analysis & Marketing Strategy.docx` were not present in this environment (Google Drive MCP unauthenticated). Re-run brand translation when those files are uploaded.

**North star (repo SoT):** MapAble is **participant-controlled infrastructure** for accessibility journeys — not another marketplace, directory, rostering tool, or generic AI assistant. Public marketing must under-claim; bookings, claims, and Managed Support stay GO-gated until authorised.

---

## Brand translation

### What the homepage already signals

| Signal | Evidence | Keep / change |
|--------|----------|---------------|
| Brand name as hero-level identity | Logo + “POWERING INDEPENDENCE.” in header | Keep; make brand larger than secondary headlines on first viewport |
| Navy + gold CTA system | Yellow primary CTA, navy secondary, white outline tertiary | Keep; map to existing CSS tokens |
| Plain-language promise | “Accessibility you can plan around.” | Keep as H1 pattern |
| Honesty about maturity | Pilot / informational framing in meta + body | Strengthen; never imply live national bookings |
| Feature checklist under hero | Four ticks (evidence, a11y-first, pilot, lived experience) | Keep as trust strip; reduce competing CTAs |

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

### Positioning line (marketing)

**For participants:** Plan access around your real requirements — places, transport, support — with consent you control.  
**For providers:** Join a governed pilot where readiness, evidence, and participant authority come first.  
**Not for public copy:** commissions, pay-to-rank, auto-assign workers, “book care nationwide,” Managed Support delivery.

### Claim discipline (non-negotiable)

- Connect ≠ Network ≠ Managed Support ≠ Infrastructure (`docs/strategy/OPERATING_LANES.md`).
- Informational GO routes only for programme explainers; no silent marketplace monetisation until leadership Option A/B is recorded (`BUSINESS_PLAN_ANZ_GAP_ANALYSIS.md`).
- AI may explain/draft — never approve workers, claims, payments, consent, or clinical decisions.

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
3. One support sentence (pilot honesty).  
4. CTA group: Pre-register (gold) · Explore places (navy) · About (outline)  
5. Dominant atmosphere (soft surface / map texture — full-bleed, no inset card collage)  
**Do not put** stats, schedules, address blocks, or secondary promos in the first viewport.

### Below the fold

1. **Explore MapAble** — what is public today (Places, Guides, Transport explainer, Services explainer).  
2. **How a journey works** — 5–7 step chain from competitive position (goal → consent → passport → fit → delivery → evidence → recovery).  
3. **Who it’s for** — participant / provider / coordinator (plain language).  
4. **Trust & limits** — what is pilot vs informational; link accessibility statement.  
5. **Get started** — role chooser into contact / pre-register.

### Tone

- Plain language, short sentences, active voice.  
- Prefer “you can…” over “we leverage…”.  
- Always pair capability with maturity label: `Available now` | `Pilot` | `Explainer only`.

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
Rewrite components/marketing/MapAbleCareCombinedHomepage to the hero budget in
docs/design/MAPABLE_WEBSITE_REDESIGN.md: brand, one H1, one sentence, three CTAs,
trust strip, then Explore / How it works / Who it’s for / Trust & limits.
Full-bleed atmosphere only; no inset hero collage; no cards in the hero.
Add maturity chips on Explore cards. Keep claim honesty.
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
**Must not:** auto-assign workers; AI approval of payments/claims; ambient nominee access.  
**First slice:** participant home + trip status + preferences + consent panel.  
**Success:** participant completes “check trip → confirm/dispute → update preference” keyboard-only in <2 minutes on Preview.

---

## Handoff — MapAble Strategy & Delivery

**Owner:** leadership + strategy  
**Decisions needed:**
1. Record Option A (orchestration) vs B (marketplace plan) in `BUSINESS_PLAN_ANZ_GAP_ANALYSIS.md`.  
2. Confirm PayPal placement (footer/support only vs remove).  
3. Confirm `/how-it-works` as primary education URL.  
4. Supply official brand PDFs (`Executive Summary`, Competitive Analysis & Marketing Strategy) for v2 brand translation.  
**Delivery sequence:** R15 decision → R1/R7 → R2/R3 → R8/R13 → R5/R9/R10 → remaining.  
**Risk:** marketplace-plan language leaking into public UI while claim registry forbids it.

---

## Tech stack recommendations

- Stay on **Next.js App Router** + existing Tailwind token bridge.  
- Prefer server components for marketing; client only for interactive dashboard widgets.  
- A11y: eslint-plugin-jsx-a11y + Playwright axe smoke.  
- Content: keep programme copy adjacent to GO/claim helpers — do not hardcode maturity in random components.  
- No new component library; extend current primitives.

---

## Delivery sequence

1. Strategy gate (Option A/B).  
2. Shell + tokens + primitives.  
3. Homepage + How it works + Contact.  
4. Dashboard participant slice.  
5. Consent/evidence.  
6. Transport/Services honesty + trip status.  
7. Jobs/messaging polish.  
8. Full a11y regression + Preview demo.

---

## Open input — brand Drive files

When `Executive Summary.docx` and `MapAble Competitive Analysis & Marketing Strategy.docx` are uploaded (or Google Drive MCP is authenticated), update:
- Brand translation section (voice, audience segments, competitive messaging).  
- Homepage subcopy variants.  
- Provider vs participant value props.  
- Any visual rules that differ from `app/index.css` tokens.
