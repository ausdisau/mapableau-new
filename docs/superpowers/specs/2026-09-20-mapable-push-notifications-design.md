# Architecture — MapAble Push Notifications System

## Status

**Proposed — approved design awaiting written-spec review before implementation. Not implemented or verified live.**

Repository baseline: `ausdisau/mapableau-new` `main` at `3de67d09c1be3f6ae778decec35170f130106241` on 20 September 2026.

## Objective

Implement one participant-controlled notification delivery fabric across MapAble web/PWA, Android, iOS/iPadOS, Windows, and macOS while preserving the existing MapAble `Notification` record and Accessible Communications Fabric as the source of truth.

Push is a delivery channel, not a second notification database, not proof of receipt or understanding, and not an emergency-warning replacement. Opening a push must resolve to the current authorised MapAble record.

## Participant outcome

Participants can choose whether push is enabled, which categories may notify them, quiet hours, device-specific preview privacy, and which devices remain trusted. They can revoke old or lost devices, use MapAble without push, and recover every user-visible notification from an accessible in-app inbox.

Notifications must work with screen readers, switch access, AAC, keyboard/external keyboard, large text, reduced motion, and voice-independent flows.

## Current implementation evidence

| Capability | State | Repository evidence |
|---|---|---|
| In-app Notification record | Implemented, not independently verified | `lib/notifications/notification-service.ts` |
| In-app + email wrapper | Implemented, not independently verified | `lib/notifications/notification-cloud.ts` |
| Push channel enum | Implemented | Core Prisma migration already includes `push` |
| Push contracts | Scaffold | `lib/platform/push/push-contracts.ts` |
| Production push provider | Missing | `lib/platform/push/stub-provider.ts` |
| Android push feature flag | Implemented, default off | `MAPABLE_MOBILE_PUSH_ENABLED=false` |
| Android device registration API | Scaffold | `/api/mobile/devices` |
| Device registry durability | Missing | `lib/mobile/device-registry.ts` is process memory only |
| Android privacy policy | Scaffold | `apps/android/core/notifications/NotificationPrivacy.kt` |
| Accessible Communications Fabric | In development | `docs/innovation/epics/08-accessible-communications-fabric.md` |
| Push production gap | Documented | `docs/careos-completion-audit.md` |

## Architectural principles

1. **Canonical notification first, push second.** Domain services create one MapAble notification; push delivery derives from it.
2. **The model is never the policy boundary.** Consent, permissions, urgency policy, redaction, rate limits, recipient selection, and execution are deterministic.
3. **Push payloads are privacy-minimised hints.** The client authenticates and fetches current state after open.
4. **Provider acceptance is not delivery.** State names and analytics must not imply that a person saw or understood a push.
5. **Push is optional.** The in-app inbox remains available.
6. **No emergency-broadcast claim.** MapAble push must not impersonate or replace AusAlert, carrier cell broadcast, Triple Zero, or operating-system public warnings.
7. **Fail closed.** External sends remain disabled until each platform adapter, credentials, tests, accessibility, privacy and operational gates are satisfied.

## Context

```text
Domain event / service action
        |
        v
Canonical Notification Service
        |
        +--> Notification record + accessible inbox
        |
        v
Preference + Privacy Policy Router
        |
        v
Durable Notification Outbox
        |
        v
Push Delivery Worker
        |
   +----+-----+-----+----------+
   |          |     |          |
  FCM        APNs  WNS      Web Push
Android   iOS/macOS Windows     PWA
   |          |     |          |
   +----------+-----+----------+
              |
              v
       MapAble client shell
              |
        authenticated open
              |
              v
     current authorised record
```

## Domain ownership

`lib/notifications/` remains canonical for notification creation, preference evaluation, templates, privacy redaction, routing and delivery receipts.

`lib/platform/push/` contains transport interfaces and provider adapters only. It must not embed Care, Transport, billing, consent, safeguarding or participant-authority rules.

Existing domain services continue to call the canonical notification layer and must not call FCM/APNs/WNS/Web Push directly.

Native clients own OS registration and presentation. They do not become a source of truth.

## Priority model

V1 priorities:

- `background`: silent refresh hint.
- `normal`: routine user-visible update.
- `time_sensitive`: time-bounded service change such as a worker delay or imminent booking.
- `urgent_attention`: immediate human attention within MapAble, still not an emergency-broadcast class.

Do not expose a general MapAble `critical` or `emergency_broadcast` priority in v1. Platform-specific critical-alert entitlements require a separate design and approval.

## Event taxonomy

Keep the existing `NotificationCategory` enum initially. Add precise `eventType` metadata such as:

`care.booking.confirmed`, `care.worker.cancelled`, `transport.driver.delayed`, `messages.new`, `consent.expiring`, `support.human_response`, `billing.invoice_ready_for_review`, `safeguarding.human_review_update`, `system.security_notice`, `system.sync_complete`.

## Data model

### Existing Notification

Preserve as persistent inbox record. Add only missing routing fields when necessary:

`purpose`, `priority`, `sensitivity`, `sourceModule`, `eventType`, `entityType`, `entityId`, `correlationId`, `dedupeKey`, `expiresAt`, and strictly validated non-secret metadata.

### NotificationEndpoint

New durable model replacing the in-memory device registry:

```text
id
userId
deviceId
platform: android | ios | macos | windows | web
transport: fcm | apns | wns | web_push
addressCiphertext
addressHash
appVersion
clientVersion
locale
timeZone
previewMode: redacted | descriptive
status: active | stale | revoked | invalid
lastRegisteredAt
lastSeenAt
revokedAt
createdAt
updatedAt
```

Raw FCM/APNs/WNS/Web Push credentials are restricted secrets. They must not enter logs, analytics, model prompts, admin HTML, screenshots or error responses.

### NotificationDelivery

New durable delivery-attempt ledger:

```text
id
notificationId
endpointId
transport
state
attemptCount
providerMessageId
queuedAt
providerAcceptedAt
openedAt
failedAt
nextAttemptAt
failureCode
failureClass
createdAt
updatedAt
```

States: `queued`, `sending`, `provider_accepted`, `retry_scheduled`, `permanent_failure`, `cancelled`, `opened`.

### Preferences

Existing `NotificationPreference` remains the canonical user/category/channel opt-in. Extend push presentation preferences separately with quiet hours, timezone, digest mode and minimum priority. Device preview mode belongs to `NotificationEndpoint`.

## Payload contract

Push payloads contain only opaque routing and privacy-safe presentation data:

```json
{
  "schemaVersion": 1,
  "notificationId": "uuid",
  "category": "booking",
  "eventType": "care.shift.changed",
  "priority": "time_sensitive",
  "title": "MapAble",
  "body": "A care booking has changed. Open MapAble to review.",
  "route": {
    "screen": "care_booking",
    "entityId": "opaque-id"
  },
  "collapseKey": "care-booking:opaque-id",
  "issuedAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "contentPolicy": "redacted"
}
```

No full domain record is transported. Deep links use allow-listed route identifiers, never arbitrary URLs from domain data or AI output.

## Delivery semantics

Use at-least-once attempt semantics with deduplication. Each notification has a dedupe/idempotency key. Transient provider failures retry with bounded exponential backoff and jitter. Invalid endpoints become `invalid` and stop retrying. Expired items are cancelled. Provider collapse/replacement semantics should reduce stale repetitive state updates.

Consequential actions reached from a notification must still pass normal MapAble authentication, permissions, consent, confirmation and Action Kernel controls.

## Durable outbox

Do not send push inside the Care/Transport transaction or request path.

```text
domain transaction
  -> domain record
  -> Notification
  -> notification outbox row
COMMIT
  -> worker claims row
  -> preference/privacy routing
  -> provider adapter
  -> NotificationDelivery
```

Prefer the existing Postgres/outbox architecture for the first slice. A provider outage must never fail the Care, Transport, Jobs, billing, messaging or support transaction.

## Platform adapters

### Android / FCM

Native code obtains the FCM registration token and registers it with MapAble after authentication. Server sends only from trusted server code. High priority is reserved for genuinely time-sensitive, user-visible events. Invalid registrations are retired. WorkManager handles deferred work after receipt.

### Apple / APNs

iOS/iPadOS/macOS native shells register with APNs and upload device tokens. Payloads remain minimal. The app fetches current state on open. macOS uses its own topic/bundle and independent endpoint preferences.

### Windows / WNS

Windows native shell owns WNS channel acquisition and OS presentation. The WebView receives only safe activation data through a typed bridge. Polling/in-app fallback remains available.

### Web/PWA / Web Push

Use a service worker plus Web Push subscription. Subscription create/update/delete is authenticated and CSRF/XSRF protected. In-app remains the fallback.

## WebView/native bridge

The bridge exposes narrow commands only:

```text
push.permissionStatus()
push.requestPermission()
push.register()
push.unregister()
push.getDeviceSettings()
push.setPreviewMode()
push.openNotification(notificationId)
```

Never expose raw database access, encryption keys, arbitrary filesystem access or shell execution to WebView JavaScript.

## Private Storage Blob integration

Push must never transport Private Storage Blob contents. A push may signal that protected content changed. The local sync engine then authenticates, checks authority/consent/storage policy, and retrieves only the authorised encrypted update.

A provider notification cannot create a new participant disclosure grant.

## Identity, consent and delegates

- Endpoint registration derives the user from the authenticated session; request payloads cannot choose another `userId`.
- Organisation membership does not imply participant authority.
- Delegate delivery must respect active authority grants.
- Notification preference is not consent to disclose sensitive details.
- Marketing, if ever added, uses separate opt-in and purpose.
- Revoking a device prevents future sends.
- Logout detaches/revokes the endpoint according to explicit trusted-device policy.

## Privacy

Default lock-screen preview is `redacted`.

Allowed default example:

> MapAble — A care booking has changed. Open MapAble to review.

Do not include diagnosis, medical history, NDIS identifiers, full address, precise live location, safeguarding/incident narrative, payment/bank information, sensitive message bodies, API/session tokens, or Private Storage Blob content in push payloads.

Sensitive categories stay generic unless a participant has explicitly chosen descriptive previews on that device and policy permits the disclosure.

## AusAlert boundary

MapAble Push Notifications are not AusAlert. If MapAble later provides an accessible warning companion, the official warning remains clearly identified and unchanged; MapAble may add accessible rendering or participant-controlled assistance but cannot suppress, replace, downgrade or impersonate the official warning.

## AI boundary

AI may draft optional plain-language variants from approved source material, summarise after the participant opens MapAble, or suggest non-consequential reminder wording.

AI must not independently classify an event as emergency/urgent, bypass quiet hours, choose recipients, add participant details, infer incapacity from communication behaviour, or send safeguarding/clinical/financial/legal alerts. High-impact templates remain deterministic and governance-approved.

## Accessibility

Release gates include:

- persistent accessible inbox equivalent for every user-visible push;
- named actions that do not rely on icons alone;
- voice-independent completion;
- AAC-safe defer/dismiss without losing the record;
- no capacity inference from response delay;
- configurable non-urgent sound/haptics and quiet hours;
- no colour/sound/vibration-only meaning;
- large text/display scaling without loss of essential action;
- manual Narrator/NVDA, VoiceOver, TalkBack, switch access, keyboard/external keyboard and voice-control testing;
- WCAG 2.2 AA for web surfaces;
- accessible human-help paths without requiring a phone call where relevant.

## API contracts

Canonical endpoints:

```text
POST   /api/notifications/endpoints
PATCH  /api/notifications/endpoints/:id
DELETE /api/notifications/endpoints/:id
GET    /api/notifications/endpoints

GET    /api/notifications/preferences
PATCH  /api/notifications/preferences

GET    /api/notifications
POST   /api/notifications/:id/read
POST   /api/notifications/:id/opened
```

Keep `/api/mobile/devices` temporarily as a compatibility adapter over the canonical endpoint service.

Domain code uses an internal typed service:

```ts
notify({
  userId,
  category,
  eventType,
  purpose,
  priority,
  source,
  entityRef,
  templateKey,
  templateData,
  dedupeKey,
  expiresAt
})
```

`templateData` is schema-validated and never copied wholesale into OS payloads.

## Template registry

Version templates in source:

```text
lib/notifications/templates/
  booking.ts
  care.ts
  transport.ts
  messages.ts
  consent.ts
  billing.ts
  support.ts
  safeguarding.ts
  system.ts
```

Each template declares key, version, category, allowed priorities, sensitivity, redacted/descriptive strings, route, expiry, quiet-hours behaviour and required fields. No free-form safeguarding/high-impact template editor in v1.

## Security controls

Provider credentials remain server-only. Endpoint addresses/tokens are encrypted at rest with a one-way hash for uniqueness where practical. Raw delivery credentials and sensitive payloads are excluded from logs, PostHog, model context and error responses.

Apply rate limits, cross-tenant targeting checks, deep-link allowlists, device revocation auditing and step-up authentication for especially sensitive records where required.

Production sends remain disabled until credentials and operational readiness are approved.

## Audit events

At minimum:

`notification.created`
`notification.suppressed.preference`
`notification.suppressed.quiet_hours`
`notification.queued`
`notification.provider_accepted`
`notification.delivery_failed`
`notification.endpoint_registered`
`notification.endpoint_refreshed`
`notification.endpoint_revoked`
`notification.opened`
`notification.preference_changed`

## Observability

Operational metrics:

- queued-to-provider latency;
- provider acceptance rate;
- transient/permanent failure rate;
- stale/invalid endpoint rate;
- duplicate suppression rate;
- preference suppression rate;
- open rate where appropriate;
- fallback rate;
- retry queue age;
- per-platform failure distribution.

Analytics use IDs/categories/classes, never message bodies or disability/health/support content.

### PostHog boundary

PostHog is for privacy-minimised product/operational telemetry only. Candidate events:

`notification_endpoint_registered`
`notification_preference_changed`
`notification_provider_accepted`
`notification_delivery_failed`
`notification_opened`
`notification_settings_opened`

Allowed properties are non-sensitive technical fields such as platform, transport, category, priority class, template version, failure class and latency bucket. Do not capture notification body/title, diagnosis, support need, NDIS data, precise location, provider-visible Private Storage Blob data, safeguarding narrative, or raw push tokens.

PostHog feature flags may later govern non-safety rollout UX, but server-side MapAble fail-closed flags remain the safety control and source of truth.

## Vercel role

The Vercel `mapableau-new` project is the preview/deployment surface for server routes and the web/PWA portion. The first implementation should rely on standard Vercel Functions for authenticated APIs and a Postgres-backed outbox worker mechanism already compatible with the repo. Do not make Vercel preview readiness equivalent to production readiness.

Preview deployments are required for each implementation phase. Production enablement remains a separate approval.

## Feature flags

Retain `MAPABLE_MOBILE_PUSH_ENABLED=false` for compatibility and add:

```text
MAPABLE_PUSH_SEND_ENABLED=false
MAPABLE_PUSH_FCM_ENABLED=false
MAPABLE_PUSH_APNS_ENABLED=false
MAPABLE_PUSH_WNS_ENABLED=false
MAPABLE_WEB_PUSH_ENABLED=false
MAPABLE_PUSH_KILL_SWITCH=false
```

All send flags default false. The kill switch stops external push while preserving canonical in-app notifications.

## Failure behaviour

- Push disabled -> create in-app notification; no provider call.
- OS permission denied -> in-app remains available.
- Provider outage -> bounded retry; domain action succeeds.
- Invalid token -> mark endpoint invalid.
- Device revoked -> no future sends.
- Expired notification -> cancel queued send.
- Invalid deep link -> open secure inbox/home.
- Deleted/revoked domain record -> display unavailable without leaking old content.
- Duplicate domain event -> dedupe.
- Worker unavailable -> visible outbox backlog and operator alert.
- Provider accepted but unseen -> do not infer delivery.

## Migration

1. Preserve existing `Notification`, `NotificationPreference`, `notifyUser()`.
2. Add richer `notify()`.
3. Make `notifyUser()` a compatibility wrapper.
4. Add durable endpoint and delivery models.
5. Replace the in-memory mobile device registry with an adapter over endpoint persistence.
6. Preserve `/api/mobile/devices` during migration.
7. Keep all external send flags off.
8. Enable transports independently after evidence gates.

No production data migration or feature enablement occurs in the first implementation PR without separate approval.

## Test plan

Unit: preference routing, quiet hours/timezones/DST, redaction, template schemas, dedupe, expiry, endpoint transitions, retry classification, deep-link allowlist.

Integration: domain event -> Notification -> outbox -> fake provider -> receipt; endpoint registration/revocation; invalid token handling; logout/lost-device flow; cross-user/cross-org denial; push-disabled fallback; local-vault non-disclosure.

E2E: Android receive/tap, Apple receive/tap, Windows activation, macOS activation, PWA Web Push, offline/degraded mode, multiple devices and privacy modes.

Security/privacy: token-leak scans, IDOR, CSRF/XSRF, route injection, content minimisation, shared-device lock-screen review, secrets absent from repository/client/logs.

Accessibility: automated checks plus manual AT testing; automated accessibility tests are not sufficient.

## Delivery sequence

**Phase 0 — Contract convergence.** Extend contracts/templates, preserve in-app/email behaviour, add tests. No production sends.

**Phase 1 — Durable endpoints and delivery ledger.** Add Prisma models, migration, endpoint APIs, durable outbox linkage and compatibility adapter.

**Phase 2 — Android vertical slice.** FCM adapter + native registration/receive path; synthetic/test users only; flags off by default.

**Phase 3 — Apple mobile.** APNs iOS/iPadOS with same contracts and privacy rules.

**Phase 4 — Web/PWA.** Replace stub Web Push provider and add service-worker path.

**Phase 5 — Desktop.** macOS APNs and Windows WNS/Windows App SDK, with polling/in-app fallback.

**Phase 6 — Hardening/pilot.** Security, accessibility, privacy, load/retry, operator dashboards, rollback drill and bounded pilot.

## First implementation slice

The smallest safe build is **Phase 0 + the non-sending portion of Phase 1**:

- canonical typed `notify()`;
- versioned template registry;
- privacy/redaction and deep-link policy;
- durable `NotificationEndpoint` and `NotificationDelivery` schema;
- authenticated endpoint CRUD;
- compatibility adapter for `/api/mobile/devices`;
- fake/recording push provider for tests;
- outbox record creation;
- PostHog event contract with sensitive-field denylist;
- Vercel preview verification;
- all external send flags remain false.

No APNs/FCM/WNS/Web Push credentials are needed for this slice.

## Launch gates

Production push remains disabled until durable migration proof, approved secret storage, token-leak checks, in-app fallback, privacy/redaction tests, lost-device revocation, IDOR/cross-tenant tests, provider retry tests, worker lag observability, manual AT tests, usable preferences/quiet hours, safeguarding/AusAlert review, rollback drill, platform account prerequisites, and explicit production-flag approval are complete.

## Rollback

```text
engage MAPABLE_PUSH_KILL_SWITCH
  -> stop all external push sends
  -> continue canonical in-app Notification creation
  -> preserve/cancel queued attempts according to policy
  -> retain permitted email fallback
```

## Open implementation decisions

Before the external-provider phases, confirm encryption/key-management for endpoint tokens, retention for delivery receipts, Apple/Firebase/Microsoft/VAPID credential ownership, and whether provider/worker descriptive previews remain permanently disabled for selected sensitive categories.

For the first non-sending slice, use the existing Core Prisma migration stream and the repo's current Postgres/outbox patterns unless implementation inspection reveals an incompatible concurrency or deployment constraint.

## Definition of done for first slice

The slice is done only when:

- tests are added before implementation and pass;
- existing notification flows remain green;
- schema migration is additive and clean on a disposable database;
- endpoint CRUD enforces authenticated ownership;
- no raw push credentials or sensitive notification text enter logs or analytics;
- in-memory mobile registry is no longer the persistence source of truth;
- notification outbox rows can be created idempotently;
- fake-provider delivery receipts use honest `provider_accepted` terminology;
- accessibility of notification settings/inbox changes is verified;
- Vercel preview builds successfully;
- PostHog instrumentation is privacy-minimised and disabled/no-op when not configured;
- all external send flags remain off;
- no production deploy, feature enablement or provider credential change is performed without separate approval.
