# MapAble Static Companion — existing-host deployment

**Status:** feature branch / preview-only. This is a *bounded rebuild* of MapAble Care + Places + offline discovery, NOT migration of all Next.js modules.

## Why this target
- Existing `apps/places` Expo/React Native application supports iOS, Android and web.
- `apps/places` now has five tabs: Home, Care, Places, Saved, More.
- Care uses a build-time, privacy-minimised organisation-level index generated from the checked-in public NDIS provider snapshot.
- Browsing, search, static public results and local draft workflows run without an application server, Neon credentials or new hosting subscription.
- Web output is static files in `apps/places/dist`, suitable for authorised Wasmer static hosting or VentraIP cPanel Apache.
- **Do not** use this build as a replacement for authenticating participants, booking workers, NDIS registration checks, payment processing, live availability, secure health information or server-side regulatory decisions.

## Verified source and privacy constraints
- Source: `public/data/provider-outlets.json` and `app/provider-finder/regGroupOptions.ts`.
- Generation excludes raw outlet addresses, emails, phone numbers, coordinates, ABNs and worker identities.
- Records are grouped by organisation + state + postcode. The source's `Active` flag is a historical import attribute, NOT verification of current NDIS registration. Records with `Active=0` are omitted; other records must be independently confirmed.
- Generation date is **not source freshness**. No claim is made that a published category reflects current registration, clearance, service area, access fit or availability.
- Local place reports and notes remain in **unencrypted** AsyncStorage; do not use for personal health or high-risk information.

## Local checks

```sh
cd apps/places
npm install
npm run test
npm run typecheck
npm run build:web
```

Build exports `apps/places/dist` with no deployed Node server.
`apps/places/src/generated/provider-directory.json` is generated locally and is gitignored. It may be large: confirm browser memory on low-cost Android devices before public launch. Do not blindly cache or embed the 45 MB source file.

## Wasmer staging
- App config: `apps/places/app.yaml`; package: `apps/places/wasmer.toml`.
- Intended preview name: `mapable-companion-preview` under account `ausdisau`. Never overwrite `ausdisau/mapable` without separate approval.
- Run `npm run build:web` on a developer machine or CI; the package's `dist` directory must exist before publishing to Wasmer.
- Validate that the currently supported Wasmer package/Static Web Server manifest accepts these config fields before attempting deployment. This is a staged template **not verified in Wasmer runtime**.
- No DNS change to `mapable.com.au`; the screenshot of Wasmer's custom-domain setup showed the apex unresolved.

## VentraIP cPanel
- Copy only static build output under a **staging subdomain document root**, never overwrite production `public_html`.
- If cPanel Apache is the web server, copy the preview security configuration `apps/places/deploy/cpanel/.htaccess` alongside the output's `index.html`.
- Domain registration/DNS in VentraIP VIPcontrol is independent of hosting; check authoritative DNS before modifying any records.
- Test TLS, cache behaviour, unknown /api/* returning 404, root-page tab navigation, resource loads and index accessibility on preview hostname first.

## Deployment controls
- `.github/workflows/mapable-static-companion.yml` runs tests, a no-lockfile runtime dependency audit, typecheck, static export and public-data/artifact checks on PRs, then uploads a preview build as a CI artifact. No deploy credentials and no production deploy are configured.
- `MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED` remains disabled on static builds; no storage of sensitive matching profiles is implemented in this bundle.
- Existing Next.js/Neon application stays unchanged. Complete platform replacement needs a separate backend plan, migration, security review and cutover approval.

## Release gates
1. Build passes with pinned/reviewed package dependencies and acceptable bundle sizes.
2. Validate data indexing and source-license/provenance, source age and source redactions.
3. WCAG 2.2 AA and ATAG 2.0 QA: NVDA/Firefox, TalkBack, VoiceOver, keyboard, 400% reflow, switch, AAC and touch targets.
4. No mixed-content calls, analytics on private surfaces, inadvertent network traffic or client secrets; static hosts must not return HTTP 200 HTML for absent /api or /auth endpoints.
5. Commit and review a dedicated Expo package-lock.json, switch CI to npm ci, and re-run an audited dependency tree before production. Current npm install --package-lock=false is not reproducible.
6. Explicit user approval before attaching production domain or replacing Vercel.
