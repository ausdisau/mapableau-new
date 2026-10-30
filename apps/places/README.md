# MapAble Static-First Companion (Expo) — staging build

**Implemented in a draft branch, not deployed.** This extends the original MapAble Places / CripSquare Expo prototype into a portable MapAble entrypoint with five accessible tabs: Home, Care, Places, Saved, More.

**Purpose:** run the public discovery experience without paying for another application server. Use a statically exported `dist/` on the existing Wasmer account, or upload the same files to existing VentraIP/cPanel static hosting. Android/iOS use the Expo native application with bundled data; they do not require a hosted backend for the offline subset.

## Working capabilities in this release
- Home: clear navigation, connectivity and source limitations.
- Care: full-text and category search across a privacy-minimised, **build-time generated** snapshot of the existing NDIS outlet dataset. Organisation-level only; no clearance, current registration or personal suitability claims. Results are paginated using a virtualized FlatList; locality links open OpenStreetMap rather than inferring precise coordinates.
- Places: existing offline demonstration venues, user-controlled saved places and descriptive access observations.
- More: local community drafts, access-report authoring, an optional transport-access checklist, employment guidance, and data export/deletion.
- No mandatory login, browser tracking, GPS, payment service, or new database credentials.

## Build from the repository root

```bash
cd apps/places
npm ci
npm run test
npm run typecheck
npm run build:web
node scripts/verify-static-release.mjs
```

The standalone Node build step reads `../../public/data/provider-outlets.json` and the canonical `../../app/provider-finder/regGroupOptions.ts`. It removes confidential addresses, phone numbers, emails, precise coordinates and individual-worker identities; output goes to the ignored `src/generated/provider-directory.json`. **Do not copy the raw outlet export into a deployed web directory.**

`dist/` is a self-contained static website; deploy that directory to Wasmer or cPanel without running `next start` or Node.js in production. The optional `app.yaml` in this directory targets **`ausdisau/mapable-companion-preview`**, not the existing `ausdisau/mapable` production app.

The isolated npm lockfile is committed at `apps/places/package-lock.json`, and CI uses `npm ci`. The complete dependency audit is **not green**: the Expo 57 CLI dependency tree includes high-severity `zod@3.25.76` (GHSA-mrhx-c7xc-m3w5) and low-severity `deepmerge@4.3.1` (GHSA-gcqx-w48m-w2h4). An unsupported `npm audit fix --force` would downgrade Expo to 51, so no upgrade or waiver has been applied. Until the audit gate is resolved, the staging artifact remains blocked.

For installation/backup/DNS cutover, see [the staged hosting guide](../../docs/hosting/mapable-static-current-hosting.md).

## Important boundaries

A static client cannot safely hold a Neon database password, signing secret, payment key, privileged cPanel token or NDIS worker screening credential. The existing Next.js API, consent, sensitive Care and payments remain separate until a reviewed authenticated backend is retained or moved. The optional MapAble Places public endpoint is read-only and off by default. Native app build packages and app-store distribution are separate from website hosting.

The imported directory is a **snapshot**. Its build date is not the NDIS Commission verification date. Public names can still include sole traders, so perform licensing/source freshness and privacy review before releasing it. Locally authored drafts remain **unencrypted** in AsyncStorage; do not enter sensitive participant or health information. Do not call this release WCAG 2.2 AA conformant before completing assistive-technology tests.

---

# MapAble Places × CripSquare — UX-first Expo prototype

**Branch-only prototype. Not deployed, not linked to production accounts or CripSquare, and not WCAG/ATAG certified.**

This code implements an isolated Expo SDK 57 / React Native 0.86 mobile and web experience, informed by:
- the CripSquare / DisabilitySquare *village square* community concept and project briefs;
- MapAble's existing \`AccessPlace\` model and \`GET /api/access/places\` published-place endpoint;
- ATAG 2.0 Parts A/B and WCAG 2.2 AA, with native platform accessibility equivalents.

See [ATAG/WCAG acceptance matrix](./ACCESSIBILITY-QA.md).

## Working participant journeys

1. **Discover:** Browse Sydney example venues, search text, filter explicit step-free/toilet evidence, read published source warnings, save/unsave locally.
2. **My Places:** Write, edit and delete private journal notes about saved places without location check-ins or account identifiers.
3. **CripSquare:** Browse three **hypothetical** groups and activities; follow locally; record interest (NOT an RSVP); write, preview, edit and retain plain-text discussion drafts (NOT published).
4. **Contribute:** Choose a venue; record one accessibility feature, observed condition, source method and observation date; validate, preview, save, edit or delete a local draft. "Prepared for review" means **local status only**, not server submission.
5. **Privacy:** View connection state, export portable JSON by explicit OS sharing, reset/delete local records and read accessible authoring guidance.

### Functional boundary — important
- Local records persist across app restarts using AsyncStorage, **unencrypted**. Do not use identifiable medical details, exact movements or confidential information in prototype notes.
- No GPS permission, location events, background tracking, map SDK, check-in, location attestation, analytics SDK, booking, payment or AI is required. No contacts or photo permission.
- Optional live, read-only \`GET /api/access/places\` on an expressly configured MapAble base URL. It receives no location, disability preferences or personal records.
- The API returns a directory summary, **not detailed access evidence**; imported venue attributes remain **unknown** even when the directory confidence flag says verified. Do not infer step-free entry or toilet suitability from venue-category tags.
- The offline example dataset includes operator-source links reviewed 27 October 2026, but is not a MapAble audit or venue partnership.
- **CripSquare API integration is not implemented**: there was no verified executable CripSquare source or API contract in the selected project materials. Groups/events are test fixtures and posts stay on-device.

## Local setup (Node >=22.13 recommended)

\`\`\`bash
cd apps/places
npm ci
npm run test
npm run typecheck
npm run web
\`\`\`

Visit the URL printed by Expo, typically \`http://localhost:8081\`.

For native prototypes, run \`npm run android\` or \`npm run ios\` with the appropriate simulator, or \`npm start\` and follow Expo's device instructions. Network access is required to install dependencies.

**Optional published MapAble places:**

\`\`\`bash
cp .env.example .env.local
# Set EXPO_PUBLIC_MAPABLE_API_URL=https://approved-mapable-host.example
npm run web
\`\`\`

Only configure an authorised HTTPS host or local loopback. Do not place keys/secrets in \`EXPO_PUBLIC_\` variables. Native phones cannot use \`localhost\` to reach a server running on another computer; use approved reachable development networking instead. Cross-origin web requests use a restricted allowlist on the MapAble server, not wildcard CORS. The server API is disabled unless `MAPABLE_PLACES_PROTOTYPE_ENABLED=true`; production Expo Web requires a reviewed exact `MAPABLE_PLACES_EXPO_ORIGIN`. When unavailable, the offline demonstration remains functional.

## UX and authoring constraints

- All core flows work without a map, GPS, voice, camera, drag-and-drop or AI.
- Labelled controls, radio-state indicators, text alternatives, large targets, readable contrast, visible errors and explicit previews.
- ATAG Part A: the authoring interface is intended to be operable by disabled authors.
- ATAG Part B: content prompts encourage descriptive titles, practical evidence, source dates and independent review; no image upload until alt-text/editor support is added.
- Intermittent connection: the demonstration dataset works offline after app launch, and venue import gracefully fails back to it. First install still requires packages.
- The app is intentionally small; no social-media feed, passive geolocation, leaderboards or personalised behavioural advertising.

## Verification

\`\`\`bash
npm run test
npm run typecheck
npm run build:web
\`\`\`

The tests exercise place data validation, on-device actions, restoration and evidence separation. Manual VoiceOver/TalkBack, desktop keyboard/screen-reader, 200%/400% reflow, accessible error recovery and participant co-design sessions remain essential.

The first feature release should not proceed until privacy/safeguarding governance, real content moderation, AD.iD integration and venue evidence review are approved. The demo is **not a replacement** for MapAble's existing canonical AccessPlace source of truth.

## Integrated MapAble entrypoint (this PR)

The main Next.js application now includes a **controlled, default-off** `/places` gateway linking published canonical MapAble places to the independently hosted Expo prototype. Existing marketing navigation and MapAble Access include a 'Places Lab' link **only when** `NEXT_PUBLIC_MAPABLE_PLACES_PROTOTYPE_ENABLED=true`. The server route requires `MAPABLE_PLACES_PROTOTYPE_ENABLED=true` independently and otherwise returns 404.

For a local two-process preview, configure the root Next `.env.local`:

```dotenv
MAPABLE_PLACES_PROTOTYPE_ENABLED=true
NEXT_PUBLIC_MAPABLE_PLACES_PROTOTYPE_ENABLED=true
MAPABLE_PLACES_PREVIEW_URL=http://localhost:8081
```

And the Expo `apps/places/.env.local`:

```dotenv
EXPO_PUBLIC_MAPABLE_API_URL=http://localhost:3000
```

Run `pnpm dev` from the root and `npm run web` from `apps/places`. Open `http://localhost:3000/places` to see the integrated gateway and `http://localhost:8081` to use the full interactive Expo prototype. Expo Web is permitted from localhost:8081 only in development. No credentials, account identifiers, GPS or authored content are sent in the published-place request.

**Before production exposure:** audit the root MapAble Next layout, which includes existing site-level analytics/advertising scripts. The gateway itself does not capture member check-ins or notes, but inherited script activity must be assessed and disabled on privacy-sensitive surfaces as necessary. Preserve the dedicated Expo app's no-tracking stance. Ensure CripSquare consent, moderation, authentication and secure storage before any real community publishing.
