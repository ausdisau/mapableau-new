# Mission — Build the Coverage Care × MapAble White-Label System

You are Cursor acting as the lead full-stack engineer, accessibility engineer, security reviewer and QA engineer for Australian Disability Ltd's canonical MapAble platform.

**Implement a functional, synthetic-data-only, default-off Coverage Care white-label vertical slice in `ausdisau/MapAble`.** Do not stop at a wireframe, PRD, screenshot or a pretty homepage. Deliver end-to-end running behaviour with types, routes, server-side policy controls, automated tests, accessible UX, reviewable documentation and a draft pull request when authorised. Keep production unchanged.

## Repository context and current implementation evidence

- **Canonical repository:** `https://github.com/ausdisau/MapAble`. Work in this repository, NOT the migrated `ausdisau/mapableau-new` repository.
- **Known `main` tip when this brief was prepared (5 November 2026):** `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0`. Fetch the latest remote state, PRs and branch protection first; do not assume this SHA remains current.
- `apps/web`: Next.js 15, React 18, TypeScript, Tailwind, Prisma/PostgreSQL, NextAuth and Vitest/Playwright. Respect its independent `pnpm` dependency root.
- `apps/mobile`: Expo SDK 57 / React 19; preserve its separate dependency root and do not expand the first slice into a mobile rewrite.
- `apps/web/middleware.ts`: existing authentication, CSP, correlation IDs and `peer.mapable.com.au` routing. Extend carefully, do not replace wholesale.
- `apps/web/lib/platform/multi-tenant-admin/{tenant-context,tenant-service}.ts`: existing tenant models and organisation membership. **Do not assume existing resolvers enforce every tenant boundary**; fail closed in new paths.
- `apps/web/prisma/schema.prisma`: existing `Tenant`, `TenantMembership`, `Organisation`, `OrganisationMember` and `EnterpriseProviderWorkspace`. Reuse rather than duplicate.
- `apps/web/lib/config/canonical-url.ts` and `apps/web/app/layout.tsx`: canonical MapAble apex, metadata, login origin, analytics/ads. Preserve apex behaviour and isolate tenant metadata, analytics and health-facing pages.
- `apps/web/docs/modules/care.md`: participant Care request, provider inbox, agreements and service logs exist but are **controlled-pilot**, not production-supported. Reuse only with accurate maturity controls.
- `apps/web/lib/ndis/provider-claiming/{config,ndia-api-client,claim-service}.ts`: NDIA example/mocking paths exist, but there is no verified permission for live claiming. Never activate these routes for this slice.
- `apps/web/lib/careos/opportunities/tenant-isolation.ts` and `apps/web/docs/cloud-platform-audit.md`: tenant-isolation foundations and known gaps; inspect and reconcile.
- Existing source references, if available in the local Cursor workspace: `Coverage_Care_x_MapAble_Whitelabel.html`, `Coverage_Care_BrandOS.html`, `Coverage_Care_GoDaddy_Airo_TS_v1`, `MapAble_Multi_Tenant_Domain_Blueprint.md`, and `MAPABLE_NDIA_GATEWAY_SCOPE.md`. Treat their demos as design references, not secure production code. Do not invent or assume missing files.

## Required operating boundaries

1. **MapAble Core is the system of record** for identity, organisation/tenant membership, consent, delegates, communication preferences, audit, care requests and any future payment or NDIA integration.
2. **Coverage Care is an independent proposed provider tenant**, ABN `54 655 649 308` as supplied by the project owner. Its NDIS registration, practitioner credentials, available services, integration approval and live operating capacity must be verified separately. No registration, booking, availability or accreditation claim without evidence.
3. **GoDaddy Airo**, if used, is the Coverage Care public marketing front door only. It must not possess NDIA credentials, health records, privileged API tokens or confidential enquiry payloads. Provide simple deep links to a MapAble-hosted authenticated tenant experience; no iframe or cross-origin token sharing by default.
4. `mapable.com.au` remains the parent platform and canonical identity origin; `peer.mapable.com.au` remains reserved. `coveragecare.mapable.com.au` is the **proposed, not-live** tenant hostname. Do not change DNS, Vercel domains, nameservers, certificate, `NEXTAUTH_URL`, SSO callbacks or production env settings.
5. Use only synthetic people, mock requests and development/test database fixtures. No real participant data; no production migrations; no live claims, payment execution, NDIA API calls, marketing publication or social-platform posting.
6. All new features default **OFF** in deployed environments. Provide an explicit, development-only test/preview mode with prominent `SYNTHETIC DEMO — NOT LIVE` labels, and fail-closed behaviour without that mode.
7. Do not replace existing MapAble access, care, transport, billing, or provider identities. Avoid a second source of truth.

## Design system — Coverage Care

Use the latest user-approved Coverage Care visual direction and actual image assets when available:

- Organic **wave** motif integrated into the Coverage Care wordmark, suggesting empowerment, connectedness, fluid support and collaborative movement; do not substitute a generic wheelchair or medical cross logo.
- Naturalistic **sage green** `#849F63` for “Coverage”, **olive green** `#4B630C` for “Care”; warm off-white `#F7F8F3`, dark ink `#243528`, optional restrained turquoise `#366F66`. Recalculate colour contrast for text and interactive states; do not force the pale sage onto small white-background text where it fails contrast.
- Brand line: **“Your life. Your choices. Our commitment.”**
- Mission: respect dignity, autonomy, individuality, personhood and strengths; work with people, not over them.
- Guiding values: **Hope, Transparency, Bond/Connection, Courage, Collaboration, Compassion, Inclusivity**.
- Editorial style: clear, non-paternalistic, strengths-based Australian English; disability is not a tragedy and the participant is not a passive recipient.
- Avoid stock-photo stereotypes. Use authentic images only with meaningful permission and accurate descriptions; use a designed placeholder when no approved assets exist.
- Responsive layout, clear hierarchy, short task paths, keyboard-visible focus and no excessive animation.

## Primary users and first functional vertical slice

**Participant, including AAC user:** Opens a branded Coverage Care preview, explores *proposed* services, chooses a preferred communication channel, creates a synthetic enquiry, reviews precisely what will be shared, submits to the mock tenant inbox, sees its status and can correct, withdraw or delete the mock request. There must be a clear human-contact alternative and no mandatory diagnosis disclosure.

**Coverage Care staff preview:** An authenticated, specifically authorised *synthetic* provider actor accesses only Coverage Care's mock inbox, reviews minimal enquiry details and changes a status (`new`, `in_review`, `needs_information`, `closed`). Access is denied to other tenants and when consent is withdrawn. Display who is responding and how the participant can contact a person. No automated clinician assignment.

**MapAble tenant administrator:** Reviews tenant identity, brand configuration, service catalogue publication status, default-off flags, public claims, access evidence and domain readiness. Cannot self-activate live hosting or regulated operations. Does not automatically gain access to participant records by being a platform administrator.

**Delegate/supporter:** Show the difference between participant agency and a scoped, expiring, revocable delegate grant; for the first slice use synthetic test coverage, not a general permission bypass.

## In scope — implement code now

1. **Tenant discovery and branding.** Create a typed Coverage Care tenant configuration and reusable tenant-themed shell. Resolve tenant from an approved server-side registry, not a client-supplied hostname, slug, header or `organisationId` alone. On a local explicit preview route such as `/t/coveragecare`, show the tenant without enabling real subdomain routing.
2. **Public pages:** branded landing page; about/mission/values; accessible service directory; contact and privacy information; clear provider identity and “Powered by MapAble” attribution. Apply tenant-scoped SEO and metadata; prevent MapAble apex metadata, global AdSense or analytics from leaking into tenant pages. Mark previews `noindex`.
3. **Proposed service catalogue:** Physiotherapy, Occupational Therapy, Speech Pathology, Exercise Physiology, Dietetics, Podiatry, Psychology, Remedial Therapy, Diabetes Care and Fitness Consultation. Every entry must display `proposed / awaiting verification` until an authorised human publishes evidence of actual service availability, practitioners, location and scope. Do not invent treatment outcomes, NDIA eligibility, pricing, appointment slots or qualifications.
4. **Accessible, synthetic enquiry flow:** short multi-step form; plain-language purpose notice; name optional for initial demo; preferred communication method; optional functional access requirements; review/confirm screen; mock submission receipt; participant can edit, withdraw and delete. Simulated backend should be functional and testable, not a decorative button; never forward to real email or external APIs. Avoid real sensitive data storage for this slice.
5. **Provider inbox:** authorised test actor can list only Coverage Care synthetic enquiries, change permitted state, provide a mock reply/status, and see immediate revocation. Backend must independently check actor, tenant, organisation, action, request ownership and scope on each call. Include a denied-access state and an accessible error recovery path.
6. **BrandOS administration preview:** adapt the existing BrandOS concepts for brand tokens, mission, values, approved content and marketing status. Content updates should have a local/draft review state and mock approval trace; no live social publishing, no clinical advertising claims.
7. **Domain-readiness card:** show proposed `coveragecare.mapable.com.au`, reserved-host checks, required DNS/TLS/human review, and a clear NOT CONFIGURED label. Do not issue actual DNS changes or certificates. Other tenant names (`auth`, `admin`, `api`, `www`, `peer`, etc.) are permanently reserved.
8. **NDIA integration readiness:** render only an accurate disabled state and a server-side mock capability contract (`products.read`, `plan.determine`, `plan.read`, `budget.read`, `payments.submit`, `payments.status.read`). All protected operations return explicit `NOT_AUTHORISED_OR_NOT_CONFIGURED`; NDIA payment submission remains impossible. Do not use guessed NDIA paths or introduce network credentials. Keep public reference data separate from protected NDIA transaction APIs.
9. **Audit and provenance:** record synthetic preview actions and denials with a correlation ID and state change, without recording sensitive narrative content in telemetry. Surface mock versus verified evidence clearly.

## Out of scope — do not build or enable

- NDIA production API, PRODA/B2B live connectivity, payment claiming, Stripe charge creation, roster/payroll, actual clinical records, real booking confirmations or worker assignment.
- NDIS registration verification claims without official evidence; automatic service/clinical matching; automated risk, safeguarding, eligibility or funding decisions.
- Domain registrar operations, changing `mapable.com.au` DNS, Vercel deployment, production cert issuance, opening wildcard domains, or changing canonical login cookies.
- Generalised multi-tenant public beta; social media auto-posting; marketing analytics that track disability or health information; AI decision automation.
- Rewriting the Expo application, creating a second organisation/identity database, or replacing MapAble's existing Care and accessibility architecture.

## Architecture and proposed file map (inspect conflicts before creating)

Keep existing core in place. Prefer small typed packages and routes consistent with the repository. This is a suggested map; adapt to actual conventions and naming after inspection:

```text
apps/web/
  lib/tenancy/
    coverage-care-brand.ts           # typed theme, wording and approved assets
    tenant-host-policy.ts            # pure allow-list hostname parser
    tenant-preview-policy.ts         # deterministic feature + status gates
    tenant-enquiry-model.ts          # pure synthetic workflow / scope checks
    tenant-ndia-capabilities.ts      # disabled, typed NDIA readiness contracts
  components/tenants/
    TenantShell.tsx
    CoverageCareHome.tsx
    ServiceDirectory.tsx
    AccessibleEnquiry.tsx
    TenantProviderInbox.tsx
    TenantAdminReview.tsx
  app/(tenant-preview)/t/[slug]/
    page.tsx
    services/page.tsx
    enquire/page.tsx
    portal/page.tsx
    admin/page.tsx
  tests/tenancy/
    tenant-host-policy.test.ts
    tenant-enquiry.test.ts
    tenant-authorization.test.ts
    tenant-brand-a11y.test.tsx
  docs/tenancy/
    COVERAGE_CARE_PILOT.md
    DOMAIN_ACTIVATION_GATES.md
    SECURITY_ACCESSIBILITY_EVIDENCE.md
```

If a real database-backed feature is necessary, propose a minimal **additive** Prisma schema/migration with explicit per-record `tenantId` / `organisationId`, uniqueness, status and audit linkage. Do not apply production migrations. Avoid creating parallel data tables if MapAble's existing ones can be safely reused; if existing query helpers return an unscoped `{}` on missing tenant context, **do not call them in protected tenant operations**. New operations must fail closed.

## Tenant, identity, consent and privacy contract

- Hostname is branding context only. Never treat a Host header, preview slug, query string or client-controlled `x-tenant-id` as authorisation.
- Resolve an authenticated user through MapAble Core; verify tenant membership, organisation scope, role, resource ownership, consent purpose and allowed action on the server each time.
- Prevent cross-tenant reads, writes, search, files, caches, logs, query joins, background jobs and analytics. Add explicit adversarial tests using two fictional tenants.
- Disallow privileged reads merely because an actor has a platform administrator role; require a narrowly scoped support/break-glass mechanism and audit if such use is contemplated.
- Participant remains the primary decision-maker; delegates have explicit scope, expiry and revocation, never implicit parent/family authority.
- Separate service contact from marketing consent. A withdrawn sharing grant must immediately block the provider view and be traceable in synthetic tests.
- No health or disability details in public metadata, query strings, ad scripts, CDN cache keys or analytics. Respect privacy, retention, correction, export and deletion requirements before allowing live data.
- Don't enable shared cookies across arbitrary tenant subdomains. Keep authentication on the established canonical origin unless security has approved a cross-origin design.
- Tenant route should never accidentally inherit incorrect global SEO/JSON-LD organisation identities, ad pixels or scripts.

## Accessibility acceptance criteria — must be demonstrably tested

- Target **WCAG 2.2 AA** and run automated checks **plus** manual keyboard, screen-reader and AAC/switch-access review.
- Complete the full participant enquiry and withdrawal flow with keyboard only; focus visible and ordered, correct landmarks, headings, labels, status announcements and validation errors.
- 200%-400% zoom/reflow without clipped essential content or forced two-dimensional scrolling (except intrinsically spatial content); test narrow mobile viewport.
- Minimum comfortable touch controls (target 44 × 44 CSS px where practical), robust spacing, no colour-only statuses, sufficient colour contrast; natural sage is a brand accent, not necessarily readable text colour.
- Support reduced motion, save/return in synthetic demo, flexible time to respond, clear back/cancel controls and accessible confirmation/recovery states.
- AAC-compatible text-only communication path, optional supporter involvement, no forced voice call, plain-language explanations, and a human-support fallback.
- For any maps or place discovery: provide equivalent accessible lists and no mandatory geolocation.

## Security, NDIA and legal release controls

- Keep `NDIA_REAL_SUBMISSION_ENABLED=false` and equivalent global/tenant feature flags false. Do not make any NDIA requests. The NDIA requires approval through the Digital Partnership Office and issues detailed API specifications after onboarding; do not invent or hardcode an API endpoint.
- Security review must address existing example NDIA adapter issues: global token caching, guessed URL/schema, mock status represented as submitted, and insufficient human approval association. Report them as blockers but **do not silently refactor unrelated claiming code** in this slice.
- Provider licensing/registration, clinician credentials, marketing claims and NDIS digital-platform operating classification require evidence and specialist review. Treat current official NDIS and NDIS Commission guidance as time-sensitive; do not manufacture compliance certifications.
- No secrets in Next public env variables, GitHub, screenshots, prompts or logs; no impersonation or spoofed credentials.
- Maintain existing middleware protections: CSP, nonce, peer subdomain, request correlation and NextAuth callback safeguards.

## Implementation sequence — execute, test and document

1. **Inspect before editing.** Read repository instructions/CODEOWNERS, current main SHA, open PR overlap, routes, schema, tenant auth, CSP, feature flags, package scripts and existing Care flows. Publish a compact current-state ledger and a file-by-file edit plan in your response.
2. **Create a code-only branch** named `feat/coverage-care-whitelabel-pilot` if available; otherwise choose a unique, descriptive branch. Do not commit to `main`.
3. **Implement the pure domain modules first:** typed brand/service config, host and feature policies, synthetic enquiry state machine, permission/consent guards and NDIA disabled contract. Write unit tests before wiring UI.
4. **Build responsive React screens** using existing components/tokens and approved Coverage Care assets, with typed data and real working demo interactions. Reuse MapAble Core auth and Care domain boundaries rather than copying their logic.
5. **Wire only synthetic, controlled server functionality** in local/test mode. No new public tenant host activation; show an explicit not-live state outside authorised preview. Verify error and cancellation paths, not just happy path.
6. **Add verification and review surfaces:** role-specific views, audit, contents/claims approval state and domain-readiness gate. Preserve the separate operator identities (Coverage Care as provider; MapAble as SaaS/facilitator).
7. **Run focused tests and existing required quality gates.** Compare failures to baseline, fix introduced failures, and document pre-existing blockers rather than disabling checks. Do manual accessibility checks with supported tools and clearly flag unperformed human testing.
8. **Document release conditions** and a rollback plan. Only if the repository permissions allow and the initial plan is approved, open a **draft PR**. Do not merge, make ready, deploy, change feature flags in production or apply production migrations.

## Required tests and commands

Use commands appropriate to the inspected package scripts; the repository currently supports variants of:

```bash
corepack enable
pnpm --dir apps/web install --frozen-lockfile
pnpm --dir apps/web type-check
pnpm --dir apps/web test tests/tenancy
pnpm --dir apps/web lint
pnpm --dir apps/web format:check
pnpm --dir apps/web ci:feature-dependencies
pnpm --dir apps/web ci:production-claims
pnpm --dir apps/web build
# Run relevant Playwright/a11y tests using the repo's configured browsers.
```

Mandatory scenarios:

- Preview enabled locally vs. disabled in deployed environments.
- Unknown/reserved/forged hostnames do not resolve into active tenants.
- Two fictional tenants cannot see, mutate or infer one another's enquiries (direct object references, searches, IDs, caches).
- Participant can create, review, amend, withdraw and delete a synthetic enquiry; provider access is immediately revoked.
- Provider role is not an all-purpose participant consent bypass; platform admin does not imply participant authority.
- Marketing and service-consent choices are independent; NDIA operations remain denied.
- Branding does not leak MapAble global ads/metadata into health-facing tenant pages.
- Keyboard, screen reader, AAC/switch access, contrast, zoom, reduced motion and error recovery have test evidence or an explicit manual-review blocker.
- Site renders correctly on 320/375 px mobile widths and desktop; no accidental horizontal scrolling.

## Stop conditions and prohibited actions

STOP and document rather than guess if the approved logo assets, provider credentials, real service status, domain ownership, NDIA technical contract, tenant identity mapping, lawful consent basis, or major upstream schema decisions are unavailable. Finish safe independent code and mark blocked integrations clearly.

Never merge, deploy, publish the public tenant URL, change real DNS or Vercel settings, activate real transactions, retrieve real participant health records, use live NDIA credentials, make NDIS registration claims, expose sensitive data, weaken lint/CI/security tests, or introduce an unrelated framework rewrite.

## Final report — required from Cursor

Return:

1. Base and head commit SHAs, branch name and any draft PR URL (or reason no PR was opened).
2. A concise file tree of **Keep / Add / Update / Wire together** changes.
3. User journeys implemented, with labelled **Implemented (synthetic only)** / **Proposed** / **Blocked pending approval** states.
4. Tests and actual results, including TypeScript, unit, e2e, accessibility, security and mobile viewport evidence; separate pre-existing from introduced failures.
5. Screenshots of mobile and desktop flows using only synthetic people and data.
6. Explicit list of release blockers (branding approval, provider registration/services, privacy/health information, NDIA, production tenant identity, Vercel DNS/TLS, human accessibility testing).
7. Verification that **no production DNS, database, NDIA, billing or deployment operation** was performed.
8. The next small implementation-ready PR scope and rollback instructions.

**Success is not a mockup. Success is a working, testable, accessible Coverage Care white-label pilot on the canonical MapAble codebase that is demonstrably safe to keep disabled until separate production approval.**

## Verified source links and freshness checks

- MapAble canonical repo: https://github.com/ausdisau/MapAble
- MapAble Care maturity: https://github.com/ausdisau/MapAble/blob/main/apps/web/docs/modules/care.md
- Canonical auth/URL policy: https://github.com/ausdisau/MapAble/blob/main/apps/web/lib/config/canonical-url.ts
- Tenant resolver: https://github.com/ausdisau/MapAble/blob/main/apps/web/lib/platform/multi-tenant-admin/tenant-context.ts
- Existing provider-claiming config: https://github.com/ausdisau/MapAble/blob/main/apps/web/lib/ndis/provider-claiming/config.ts
- Current official NDIA onboarding guidance (verify current requirements before application): https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Vercel domains / wildcard constraints: https://vercel.com/docs/domains/working-with-domains
