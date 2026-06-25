# MapAble site audit (Cursor Prompt Pack)

Audit date: June 2025. Repository: mapable.com.au (MapAbleAU monolith).

## Stack summary

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15.5 App Router (`app/`) |
| Language | TypeScript, React 18 |
| Package manager | pnpm 10.12.1 |
| Styling | Tailwind CSS + CSS tokens in `app/index.css`, marketing aliases in `styles/mapable-care.css` |
| UI primitives | Radix Slot, class-variance-authority, lucide-react |
| Database | PostgreSQL via Prisma 6.19 (`prisma/schema.prisma`) |
| Auth | NextAuth v4, passkeys, Twilio 2FA (optional), OAuth providers |
| Maps | MapLibre GL, Leaflet, react-map-gl |
| Email | SendGrid (contact, password reset) |
| Analytics | `lib/analytics/product-analytics.ts` (opt-in via env), PostHog server SDK, Metabase embeds |
| Testing | Vitest + Testing Library (~100 test files), ESLint jsx-a11y |
| Deployment | Vercel (`vercel.json` — CORS headers, NDIS provider ingest cron) |

## Commands

| Action | Command |
| --- | --- |
| Install + Prisma generate (cloud agent) | `pnpm setup:cloud-agent` |
| Install (local) | `pnpm install` |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm type-check` |
| Unit tests | `pnpm test` |
| Accessibility e2e | `pnpm test:a11y` |
| Build | `pnpm build` |
| DB migrate | `pnpm exec prisma migrate deploy` |
| Integration env check | `pnpm check:integrations-env` |

**Risk:** `next.config.ts` sets `eslint.ignoreDuringBuilds: true` — lint failures do not block production builds. Run `pnpm lint` explicitly in CI.

## Major public routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing homepage (`MapAbleCareCombinedHomepageSections`) |
| `/access` | Access module landing |
| `/access/map` | Live accessibility map (MapAble Access shell) |
| `/access/feed` | Community feed |
| `/access/places/[placeId]` | Place detail |
| `/care`, `/transport`, `/employment`, `/moves`, `/foods`, `/kids`, `/marketplace` | Module marketing pages |
| `/provider-finder` | Public provider search |
| `/providers`, `/for-providers` | Provider discovery + interest |
| `/contact` | Contact / pilot form |
| `/resources` | Resource index |
| `/resources/[slug]` | Article stubs |
| `/design-system` | Accessible component demo |
| `/demo/care-transport` | Care + transport bundled journey demo |
| `/demo/dashboard` | Unauthenticated dashboard preview |
| `/employers`, `/venues`, `/transport-partners` | Supply-side onboarding |
| `/privacy`, `/terms`, `/accessibility-statement` | Policy pages |

Authenticated surfaces: `/dashboard/**`, `/provider/**`, `/admin/**`, `/core`.

## Reusable components

| Component | Path |
| --- | --- |
| App shell + skip link | `components/marketing/MapAbleAppShell.tsx`, `components/core/SkipToContent.tsx` |
| Module marketing | `components/marketing/PublicModulePage.tsx`, `PublicInfoPage.tsx` |
| Homepage sections | `components/marketing/home/HeroSection.tsx`, `GuidedSearchPanel.tsx`, `PersonaEntrySection.tsx` |
| Forms | `components/forms/AccessibleFormField.tsx`, `components/marketing/ContactForm.tsx`, `InterestForm.tsx` |
| UI primitives | `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `link-button.tsx`, `section-header.tsx`, `toggle-group.tsx` |
| Governance | `components/governance/GovernanceStatusCard.tsx`, `ConsentSummary.tsx`, `AttestationBadge.tsx` |
| Access accreditation | `components/access-accreditation/AccreditationSummaryPanel.tsx`, `AccreditationDisclaimer.tsx` |
| Core hub | `components/core/CoreShell.tsx`, `CoreHubCard.tsx` |

## Homepage structure (current)

1. **Header** — `MapAbleCareMarketingHeader` with nav links
2. **Hero** — `HeroSection` with guided search CTA
3. **Persona entry** — participant / provider / partner paths
4. **Marketplace grid** — care, transport, jobs, access module cards
5. **Difference cards** — value proposition strip
6. **Sponsored placement** — optional marketing slot
7. **Footer** — `MapAbleCareMarketingFooter`

Post Prompt Pack: repositioned to ecosystem landing ("Your life, connected.") with trust strip, problem/solution, journey cards, community, provider, and final CTA sections.

## Forms and API routes

| Form | Route | API |
| --- | --- | --- |
| General contact | `/contact` | `POST /api/contact` |
| Early access (participant/carer) | `/early-access` | `POST /api/interest` |
| Provider interest | `/for-providers` (embedded) | `POST /api/interest` |
| Transport partner | `/transport-partners` | `POST /api/interest` |
| Employer partner | `/employers` | `POST /api/interest` |
| Council/venue partner | `/venues` | `POST /api/interest` |

Backend: Zod validation in `lib/contact/` and `lib/interest/`, SendGrid email via `lib/contact/send-contact-email.ts`. Sensitive access-need fields are not logged.

## Existing accessibility features

- `SkipToContent` on marketing shell
- `AccessibleFormField` with label, hint, error, `aria-describedby`
- Accessibility statement at `/accessibility-statement`
- Focus rings on buttons (`focus-visible:ring-4`)
- Vitest: `tests/mapable-app-shell.test.tsx` (skip link, main landmark)
- Design tokens documented in `docs/design-system.md`
- Status colour tokens and `prefers-reduced-motion` in `app/index.css`

## Missing / partial accessibility (before Prompt Pack)

- No Playwright + axe-core automation (added in `tests/a11y/`)
- Marketing animations (`framer-motion`) need reduced-motion guards on all surfaces
- Dedicated design-system demo route for QA
- Governance status announcements (`aria-live`) on demo flows

## Environment variables (summary)

See `.env.example` and `docs/integrations/environment.md`.

**Required production:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`.

**Contact/forms:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `MAPABLE_CONTACT_INBOX`.

**Maps:** `NEXT_PUBLIC_MAP_STYLE_URL`, map default lat/lng/zoom.

**Analytics (opt-in):** `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED`, `POSTHOG_API_KEY`.

**NDIS/security:** `NDIS_ENCRYPTION_KEY`.

Run `pnpm check:integrations-env` to validate enabled integrations.

## Risks before making changes

1. **ESLint ignored at build** — type errors block builds; lint does not.
2. **Sensitive data** — LLM analytics and contact forms must not log access needs, NDIS numbers, or health free text.
3. **Access media uploads** — community MVP may use local filesystem; production needs object storage.
4. **NDIS/legal copy** — public pages must use guidance language, not guarantees (`docs/operations/production-preflight.md`).
5. **Large monolith** — 400+ routes; prefer extending existing modules over parallel implementations.
6. **Branch overlap** — Access community MVP touches `app/access/*`; coordinate merges.

## Recommended next steps

1. Complete Prompt Pack implementation (design system → marketing → forms → demos → governance → analytics → a11y tests).
2. Run `pnpm exec prisma migrate deploy` after schema changes on deploy targets.
3. Wire cloud storage for access report photos before public launch at scale.
4. Legal/NDIS review for rule engine and accreditation public copy before claiming compliance.

## Related docs

- `docs/product-backlog.md` — sequenced MVP backlog
- `docs/design-system.md` — UI tokens and patterns
- `docs/deployment-runbook.md` — deploy and rollback
- `docs/security-privacy-notes.md` — privacy hardening notes
