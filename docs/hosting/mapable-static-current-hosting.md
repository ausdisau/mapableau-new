# MapAble: no-new-server hosting migration

**Status: draft implementation, not merged or deployed.** 30 October 2026.

## Decision

Retain the existing MapAble Next.js/Neon system for authenticated sensitive actions. Reuse the existing Expo React Native web/mobile source (apps/places) for a static-first companion that runs on the user's existing Wasmer account or, if available, VentraIP Apache/cPanel hosting. Native builds can operate on bundled data without a dedicated runtime backend.

**Source of truth:** current GitHub repository. The full Next.js application cannot simply be exported as static because it uses protected API routes, Prisma, NextAuth, payments, real-time services and server-side safeguards. Those functions have not been rebuilt or displaced.

## Implemented in this branch

- A five-tab Expo app: Home, Care (offline organisations search), Places, Saved and More.
- Build-time generation of a compact provider directory from the existing public NDIS outlet snapshot and canonical registration-group mapping.
- Exclusion of imported inactive rows; deduplication of organisation name, state and postcode.
- No private addresses, phones, emails, raw ABNs, exact coordinates or worker identities are included in the generated data. This does not establish live provider status.
- Accessible on-device filtering with pagination and source/uncertainty disclosure; locality-only OpenStreetMap links.
- Offline transport accessibility checklist, employment guidance, places and community drafting interfaces, and local record export/deletion.
- Wasmer staging manifest and a separate Apache .htaccess fallback.
- Isolated GitHub Actions tests and static web artifact packaging.

## Build

From a complete checkout: cd apps/places, then npm install, npm run test, npm run typecheck and npm run build:web. The output is the dist directory. It does not require a long-running Node.js server.

The generator uses ../../public/data/provider-outlets.json plus ../../app/provider-finder/regGroupOptions.ts. This source is an imported snapshot; a build timestamp is NOT the regulator's current verification date. Review publication terms, data age, and identifiable sole-trader names before a public release.

## Wasmer staging, no automatic release

- Target configuration: apps/places/app.yaml, owner ausdisau and app mapable-companion-preview.
- It deliberately DOES NOT target the currently configured ausdisau/mapable production app.
- Use Wasmer CLI from apps/places, inspect app context and staging manifest before a manually approved wasmer deploy.
- Test the resulting staged https domain, client-side navigation refresh, source labels, keyboard/screen readers and privacy.
- Keep mapable.com.au at the current DNS target. The screenshot shows mapable.wasmer.app valid but mapable.com.au pending DNS validation; it does not prove the application code works.

## VentraIP cPanel alternative

If an existing Apache-based web hosting subscription is available, copy the **contents** of dist into a staging subdomain document root. Add deploy/cpanel/.htaccess beside index.html so client-side links reload correctly. Confirm HTTPS, correct fallback and rollback. No cPanel subscription is needed merely to manage VentraIP DNS for Wasmer.

Use VentraIP's actual authoritative DNS controls when staging a new hostname such as edge.mapable.com.au. Do not assume the Wasmer display label 'mapable' is the apex CNAME name.

## Safety, accessibility and quality gates

1. CI green for exact PR head, including Expo web output, TypeScript and data privacy tests.
2. Verify source freshness/license and redaction; no clinical, personal-care or NDIS worker screening status in the static snapshot.
3. WCAG 2.2 AA and ATAG 2.0 evaluation on web, plus VoiceOver, TalkBack and large-text native tests.
4. Measure search startup and memory on midrange devices with a full national index; use profiling rather than speculative optimisations.
5. Test offline start, search, 0 results, external link, export/delete, keyboard focus and 400% reflow.
6. Manual staging sign-off before DNS or production service changes; preserve backups and rollback.

## Not implemented, still requires a trusted backend

AD.iD/NextAuth, personal profiles stored in Neon, NDIS screening database access, current provider registration checks, Care support transactions, real-time chat, worker matching, bookings, payments, and audited consent decisions.

The discovery app may be run without **another** paid application-server plan, but it still needs existing static file distribution and can incur domain, Wasmer usage, native app store and CI costs. The full protected platform continues to need server-side services.

Sources: https://docs.wasmer.io/edge/guides/react-static-site/ , https://docs.expo.dev/workflow/web/ and https://docs.expo.dev/guides/progressive-web-apps/ .
