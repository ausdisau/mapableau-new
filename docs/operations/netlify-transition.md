# MapAble Vercel-to-Netlify transition

**Status:** implementation-ready fallback path  
**Primary source:** `ausdisau/mapableau-new`  
**Fallback host:** Netlify Free  
**Release authority:** GitHub Actions  
**Production DNS:** unchanged until explicit cutover approval

## Why this path exists

Vercel returned `402 resource_creation_blocked` for the MapAble team because the Pro subscription is suspended. The fallback must therefore preserve release continuity without bypassing Vercel account controls or weakening MapAble's accessibility, provenance, security, or production-environment gates.

Netlify is used as a host, not as the release authority. GitHub remains the record of the exact commit, test evidence, accessibility evidence, and release approval.

## Phase 1 — create the free Netlify project

Create one Netlify Free project for this repository. Do not point `mapable.com.au` at it yet.

Use the repository root and allow Netlify's current Next.js/OpenNext adapter to detect the application automatically. The repository includes `netlify.toml`; do not pin the legacy `@netlify/plugin-nextjs`.

After the project exists, record its site ID as a GitHub environment secret named:

- `NETLIFY_SITE_ID`

Create a Netlify personal access token that can deploy this site and store it only as:

- `NETLIFY_AUTH_TOKEN`

Store both secrets in GitHub environments rather than source control.

Recommended GitHub environments:

- `netlify-preview`
- `netlify-production`

Protect `netlify-production` with required human approval and restrict it to `main`.

## Phase 2 — configure Netlify environment contexts

### Deploy Preview context

Use a dedicated non-production Neon/Postgres branch where available.

Configure:

- `DATABASE_URL` — preview database connection
- `DIRECT_URL` — preview direct/migration connection
- `NEXTAUTH_SECRET` — preview-only secret, at least 16 characters
- any external API credentials strictly required for public `/access` rendering

Do **not** reuse production credentials unless the specific credential is intentionally shared and documented.

Authenticated preview routes are not part of the first fallback gate because Netlify deploy URLs are generated dynamically. Public `/access`, provenance, map/list parity and authoring accessibility are the first acceptance surface.

### Production context

Before any production deploy, configure:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=https://mapable.com.au`
- `NEXT_PUBLIC_APP_URL=https://mapable.com.au`

The repository's host-neutral production gate is enabled by `MAPABLE_ENFORCE_PRODUCTION_ENV=true` in the Netlify production context. A production build must fail closed if those values are absent or invalid.

## Phase 3 — GitHub release candidate

Run the **Netlify fallback release** workflow with target `preview`.

The workflow:

1. checks out the exact commit;
2. validates Prisma and TypeScript;
3. lints the Access slice rather than being blocked by unrelated historical lint debt;
4. runs the GCCSA, AccessFit/mobility and ATAG-informed authoring tests;
5. builds Next.js against an ephemeral PostgreSQL database;
6. runs the WCAG 2.2 AA Playwright/axe `/access` suite;
7. produces an immutable Next.js standalone recovery artifact;
8. deploys the same commit to a Netlify draft/preview;
9. smoke-tests `/access` and the accessibility statement;
10. reruns WCAG 2.2 AA against the deployed Netlify URL.

A preview is not a production claim.

## Phase 4 — ATAG/WCAG design validation

The release target is WCAG 2.2 AA, plus ATAG-informed checks for MapAble's authoring surfaces.

Automated checks must be supplemented before production cutover with:

- keyboard-only walkthrough;
- visible focus and logical focus order;
- 200% zoom/reflow;
- reduced-motion review;
- screen-reader landmarks, names, roles, states and status announcements;
- map/list functional parity;
- no colour-only meaning;
- community observation authoring and review-before-submit;
- accessible error recovery;
- confirmation that reported/community evidence is not relabelled as verified;
- AAC-compatible text interaction.

Do not claim formal WCAG or ATAG certification from automated checks alone.

## Phase 5 — production candidate

Only after preview validation, dispatch the workflow with:

- target: `production`
- confirmation: `PROMOTE NETLIFY`

The job uses the protected `netlify-production` GitHub environment.

It builds under Netlify's production context, which must satisfy the canonical `https://mapable.com.au` production gate. It then checks:

- `/access`
- `/api/auth/providers`
- `/privacy`
- `/terms`
- WCAG 2.2 AA browser gate

The workflow deliberately does **not** change DNS.

## Phase 6 — DNS cutover

Cut over only after the production candidate is healthy.

1. Add `mapable.com.au` to the Netlify project.
2. Confirm Netlify has provisioned TLS for the apex domain.
3. Confirm NextAuth callback/origin configuration still uses `https://mapable.com.au`.
4. Confirm database connections from the production function runtime.
5. Record the current DNS values and previous serving deployment.
6. Reduce DNS TTL before the maintenance window where supported.
7. Change the apex DNS to the values Netlify supplies.
8. Verify HTTPS, authentication, `/access`, public legal pages and key API routes from the canonical domain.
9. Run WCAG smoke tests again against the canonical domain.
10. Keep the previous host configuration intact during the rollback window.

Do not automate this DNS change from the fallback workflow.

## Rollback

Rollback is host-neutral.

If Netlify fails before DNS cutover, do nothing to production.

If it fails after DNS cutover:

1. stop further Netlify releases;
2. restore the recorded prior DNS target if that target is still healthy;
3. otherwise publish the most recent known-good Netlify production deploy;
4. verify TLS and canonical auth;
5. run the same public smoke and accessibility checks;
6. document the incident and exact commit/deploy identifiers.

The immutable GitHub standalone artifact remains an additional recovery option for any Node-compatible host.

## Cost guardrail

Netlify Free is intentionally a continuity option, not an unlimited production entitlement. Its hard monthly credit allowance can pause the project if exhausted. Monitor credits and request volume before treating it as the permanent production host.

## Claim state

- GitHub release pipeline: **implemented on transition branch**
- Netlify configuration in repo: **implemented on transition branch**
- Netlify account/site: **requires account-side creation/connection**
- Netlify preview: **not yet independently verified**
- Production DNS cutover: **not performed**
- WCAG target: **2.2 AA**
- ATAG status: **ATAG-informed authoring validation; no formal conformance claim**
