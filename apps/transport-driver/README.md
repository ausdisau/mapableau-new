# MapAble Transport Drivers

## Current implementation

The Expo app and the MapAble.com.au practice desk share the same screens and trip model. Start at `/transport` and choose **Open MapAble Drivers**, or go to `/transport/drivers`. The public practice shift contains three fictional jobs between public Sydney venues. A driver can run it without credentials, including after the native bundle has been installed and the network disconnected.

**Assigned trips** opens the existing first-party entry at `/transport/driver`. On an enabled deployment, assigned drivers reach `/transport/drivers/assigned`. Native opens the site in the system browser so MapAble handles sign-in and session expiry. The original driver workspace at `/transport/driver` remains available for existing booking records. The new roster uses the scheduling domain's TransportTrip and active dispatch assignments. The two kinds of trip identifiers are distinct.

| Item | Status and evidence |
| --- | --- |
| Production integration point | Verified live on 25 November 2026. The Transport page returned HTTP 200. Its Vercel production deployment identified `ausdisau/mapableau-new` at `f7e9138`. |
| Practice app | Implemented for Expo iOS, Android and web, and for the Next.js site. Both use `components/transport/drivers/DriverDesk.tsx`. |
| Authenticated field pilot | In development. The server requires a current driver session, an active assignment, matching organisation and an active vehicle. Rollout uses the deployment flag below. |
| Mapping | Three dated Mapbox driving samples provide a diagram and written steps. Public endpoint coordinates came from the Mapbox Search Box routable points. A fresh road estimate can be requested for these same public corridors. Boarding access needs local confirmation. |

## Run

Use Node 24 and the repository's pnpm version for the website. The mobile app installs independently from the site's React 18 environment.

```sh
cd apps/transport-driver
npm ci
npm start
npm test
npm run typecheck
npm run build:web
```

Use Expo's Android or iOS target for a device build. Run `npx expo export --platform all` for the release JavaScript bundles. From the repository root, `pnpm install --frozen-lockfile` followed by `pnpm dev` serves the Next.js entry. Expo uses the existing site's accessibility pin and colour palette.

## Architecture and privacy

| Boundary | Behaviour |
| --- | --- |
| Device practice state | Saves only synthetic stage, pause, sharing choice and bounded practice history. Restart is available under Support. An unavailable local store leaves the session usable. |
| Driver workflow | Offer, acceptance, pre-start, travel to pickup, arrival, boarding decision, destination, handover and completion. A rider may decline to share access instructions. The training exercise demonstrates withdrawal immediately. An issue can pause the exercise until the driver confirms resolution. The rider controls consent to optional instructions. A disputed handover needs human review by the operator. |
| MapAble identity and assignments | Signed-in field actions revalidate driver, fleet, assignment, expected stage and revision on the server. The trip row is locked. Trip changes, handover or safety records, and the trip and audit events commit together. Declining releases the assignment. Repeating a stale form cannot record another transition. |
| Real trip fields | The roster supplies date, vehicle, stage and suburb. Exact stops are disclosed only for an accepted, in-progress assignment with a matching accepted participant quote, from two hours before the booked start until two hours after its end. For a missing end, the service window assumes two hours. The roster omits access profiles and free-text notes. Drivers ask the rider directly about assistance. There is no background GPS collection. |
| Mapbox and Redis | An explicit refresh sends one of three public corridor keys to the server. A Redis value holds distance, duration and freshness for 120 seconds. A separate 20-second Redis lease bounds concurrent calls per corridor, including failed upstream attempts. Redis receives no participant, driver, trip identifiers or private coordinates. The dated sample is the offline fallback when the cache or routing service is unavailable. |
| Human support | Operator changes and unsafe pickups require a human response. The practice support log stays on the device. Contact MapAble opens the website; the app does not claim an operator has received or acknowledged a request. |

### Configuration

| Server variable | Use |
| --- | --- |
| `MAPABLE_DRIVER_FIELD_PILOT_ENABLED=true` | Opens the signed-in scheduling roster on that deployment. Default closed. |
| `MAPABLE_DRIVER_PRACTICE_ROUTING_ENABLED=true` | Enables optional public-corridor Mapbox refresh. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Existing server-side Upstash Redis REST connection. |
| `MAPBOX_ACCESS_TOKEN` | Server-side Directions API access. |

Both deployment flags are independent. The practice UI runs with either flag disabled. Authenticated changes are submitted online. After an uncertain response, refresh the authoritative roster before repeating an action. No database migration is required.

## Test plan and accessibility

Run `pnpm exec vitest run tests/transport-driver-app.test.ts` at the root. It covers public and protected route boundaries, canonical trip transitions, the public-corridor allowlist, cache expiry, Redis failure and the refresh lease. The mobile tests cover required checks, duplicate taps, declined jobs, hold and resume, withdrawal and restored state.

For a protected preview, test two separate driver identities, reassignment during an open form, retry after a lost response, expired vehicle eligibility and a missing accepted quote. Check the operator's trip and audit records after completion. In the driver app, navigate without touching the route diagram and complete the trip at large text sizes. Verify that a withdrawal immediately hides the instructions. WCAG 2.2 AA is the web target. Physical-device TalkBack, VoiceOver, switch access, large text and disability-led testing remain release checks for the transport service owner.

## Pilot rollout and rollback

The web release owner publishes the public desk through the existing website release process. The transport operator owns a separately enabled, authenticated pilot using controlled assignments and tested support arrangements. Turn off the field flag to close its reads and writes. Turn off the routing flag to use dated practice routes. Existing trip evidence remains in the transport ledger.

[MapAble Transport](https://mapable.com.au/transport) · [Mapbox Directions](https://docs.mapbox.com/api/navigation/directions/) · [Redis SET](https://redis.io/docs/latest/commands/set/) · [React Native accessibility](https://reactnative.dev/docs/accessibility) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
