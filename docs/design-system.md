# MapAble design system

This document describes the shared visual language for MapAble Core, module apps, marketing surfaces, and maps. **Source of truth is always the code** — when in doubt, read the files linked below rather than copying hex values from older screenshots.

## Design tokens

CSS custom properties live in `app/index.css`:

| Token | Role |
| --- | --- |
| `--primary` | Brand teal (`#005B7F`) — primary actions, links, map provider pins |
| `--secondary` | Brand green (`#00A979`) — success, secondary emphasis, user location pins |
| `--accent` | Gold highlight (`#F8C51C`) — marketing accents (not sole focus colour) |
| `--destructive` | Errors, selected/highlight map pins |
| `--background`, `--foreground`, `--muted`, `--border` | Surfaces and typography |
| `--mapable-navy-hex` | `#0C1833` — navy text and focus outer ring |
| `--mapable-teal-hex` | `#005B7F` |
| `--mapable-green-hex` | `#00A979` |
| `--mapable-gold-hex` | `#F8C51C` |
| `--mapable-surface-hex` | `#F6FBFC` |
| `--mapable-header-offset` | Sticky header offset for fragment targets (~105px desktop / 88px mobile) |

Tailwind maps these in `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, etc.).

Marketing-specific aliases (`--mapable-brand`, `--mapable-navy`, …) are also defined in `app/index.css` for public pages.

Typefaces: **Plus Jakarta Sans** (body, `--font-sans`) and **Outfit** (headings, `--font-heading`). Do not introduce a third UI typeface. `.mapable-soft` no longer overrides the body font.

### Canonical focus indicator

Do **not** use translucent gold alone for keyboard focus (`focus:ring-[#F8C51C]/30/40` is retired).

| API | Location |
| --- | --- |
| CSS class `.mapable-focus` | `app/index.css` — navy outline + white separation; `Highlight` under forced colours |
| `mapableCareFocusRing` / `mapableCareFocusRingSubtle` | `lib/marketing/mapable-care-tokens.ts` — Tailwind `:focus-visible` recipe |

Rules:

- Use `:focus-visible`, not plain `:focus`, for standard keyboard indicators.
- Do not remove the browser outline unless the replacement is active.
- Keep selected/pressed states visually distinct from focus (e.g. filled teal vs ring).

### Contrast decisions (accessibility map)

| Surface | Decision |
| --- | --- |
| `.access-map-marker--silver` | Background `#00A979`, **text `#0C1833`** (navy). White-on-green was ~3.02:1 and failed AA for marker glyphs. |
| Tier letters G / S / B / U | Remain as non-colour coding alongside colour. |
| Category badge on markers | White chip with navy text/border (unchanged). |

### Access score vs Access-Fit

| Label | Meaning |
| --- | --- |
| **Access evidence score** | Venue-level evidence strength from reported place data (global). |
| **Access-Fit** | Participant-specific suitability only when access needs are selected. Do not show `0/100 · Unknown` before needs exist. |

## Class recipes

Reusable Tailwind groups: `lib/brand/styles.ts`

- Headers: `mapableHeaderClass`
- Nav links: `mapableNavLinkClass`, `mapableNavLinkActiveClass`
- Section cards: `mapableSectionCardClass`
- Eyebrow badges: `mapableEyebrowBadgeClass`, `mapableEyebrowBadgeSecondaryClass`
- Search fields: `mapableSearchInputClass`
- Marketing focus/CTAs: `lib/marketing/mapable-care-tokens.ts`

## Module accents (carousel / marketing)

Do **not** assign arbitrary hex colors per module. Use semantic accents from `lib/brand/module-accents.ts`:

| Accent | Use |
| --- | --- |
| `primary` | Care, Moves |
| `secondary` | Transport, Foods, Kids |
| `brand` | Jobs, Marketplace, main hub |

Module metadata: `app/lib/modules.ts` — each module has an `accent` field, not `color` / `gradient`.

## UI primitives

| Component | Path | Notes |
| --- | --- | --- |
| Button | `components/ui/button.tsx` | Use `<Button asChild><Link …>` for link CTAs |
| Card | `components/ui/card.tsx` | Variants: `default`, `elevated`, `interactive`, `gradient`, `outlined` |
| Badge | `components/ui/badge.tsx` | Base chip; pair with status tone classes when needed |
| Hub link card | `components/core/CoreHubCard.tsx` | **Canonical** dashboard/core/module hub tile |

## Layout patterns

| Surface | Shell / nav |
| --- | --- |
| Core hub | `components/core/CoreShell.tsx`, `CorePageHeader`, `CoreHubCard` |
| Dashboard | `components/layout/DashboardNav.tsx` — hub tiles use `CoreHubCard` |
| Module apps | `components/layout/ModuleShell.tsx`, `ModuleNav.tsx` (when present) |
| Billing / safety sub-nav | `BillingCentreNav`, `SafetyCentreNav` — pill active state |

**Spacing convention**

- Page stack: `space-y-8` (`mapableHubPageStackClass` when exported)
- Section headings: `font-heading text-xl font-semibold` (`mapableSectionHeadingClass`)
- Main content width: `max-w-6xl px-4 py-8`

Always include `SkipToContent` (`components/core/SkipToContent.tsx`) on authenticated shells.

## Maps

Map markers must use brand tokens, not hardcoded blues/greens/reds.

| Layer | Implementation |
| --- | --- |
| Leaflet divIcons | `lib/map/leaflet-markers.ts` + `.map-marker*` classes in `app/index.css` |
| Accessibility map markers | `.access-map-marker*` in `app/index.css` + `components/accessibility-map/` |
| MapLibre circles | `lib/map/map-colors.ts` → `getProviderCirclePaint()` |

Marker semantics:

- **Primary** — provider / default pin
- **Secondary** — user location
- **Destructive** — selected / highlighted provider

Accessibility map motor access:

- Leaflet zoom controls overridden to ~44×44px activation areas.
- Custom location / reset / fit / list controls use `min` 44×44px.
- List view remains available when coordinates or tiles fail.

### Future brand asset

Prefer a reviewed horizontal wordmark export when available. Until then, keep the committed logo artwork accessible (`aria-label` on the home link, decorative nested `alt=""`) and layout-stable with explicit width/height.

## Status badges

Prefer token-based badges (`components/ui/status-badge.tsx` or domain wrappers like `BillingStatusBadge`) over raw Tailwind palette classes (`bg-blue-100`, etc.).

## Adding new UI

1. Check for an existing primitive in `components/ui/` or `components/core/`.
2. Use CSS variables / Tailwind token classes — avoid new hex literals.
3. For module marketing, pick `primary`, `secondary`, or `brand` accent only.
4. Hub navigation tiles → `CoreHubCard`.
5. Primary actions → `Button` with focus ring and `min-h-11` touch target.

## Accessibility panel (presentation preferences)

MapAble ships a first-party **Accessibility settings** panel (`components/accessibility/`). It personalises presentation on the current device. It does **not** replace core accessibility, claim WCAG conformance, or toggle keyboard/screen-reader support.

| Piece | Location |
| --- | --- |
| Provider + single panel instance | `AccessibilityPreferencesProvider` mounted in `components/providers.tsx` |
| Triggers | Header/nav/footer buttons via `AccessibilityPanelTrigger` (no floating map overlay) |
| Preference model | `types/accessibility-ui.ts` + Zod in `lib/accessibility/ui-preferences.ts` |
| CSS application | `data-a11y-*` attributes / CSS variables in `app/index.css` |
| Pre-hydration | Inline script from `getPreHydrationAccessibilityScript()` in `app/layout.tsx` |
| Local storage | `mapable:accessibility-ui:v1` (no cookie; private by default) |
| Optional account sync | `PATCH /api/accessibility-profile/digital-preferences` (opt-in; merges only digital prefs) |

Rules for contributors:

- Prefer goal-based preset labels (e.g. “Clearer vision”), never medicalised profiles.
- Apply reading alignment only to prose surfaces (`.a11y-prose`, `.prose`, `[data-a11y-reading-content]`).
- Mark purely decorative sections with `data-a11y-nonessential` / `data-a11y-decorative` — never hide alerts, forms, maps, or service results.
- Honour `prefers-reduced-motion` and `forced-colors`; never override a system reduced-motion request by enabling animation.
- Do not send panel preference values to analytics or advertising tools.

## Related docs

- Combined-care marketing tokens: `styles/mapable-care.css`
- Brand constants (URLs, logos): `lib/brand/constants.ts`
- Public UI a11y remediation checklist: `docs/qa/public-ui-accessibility-remediation.md`
