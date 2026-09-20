# Architecture — MapAble Provider-Neutral Push Notifications System

## Status

**Proposed — revised provider-neutral design approved conversationally; awaiting written-spec review before implementation. Not implemented or verified live.**

Repository baseline: `ausdisau/mapableau-new` `main` at `3de67d09c1be3f6ae778decec35170f130106241` on 20 September 2026.

## Objective

Implement one participant-controlled notification fabric across MapAble web/PWA, Android, iOS/iPadOS, Windows and macOS while keeping MapAble—not any hosting, analytics, queue or push vendor—as the owner of notification semantics, privacy policy, authority, state and continuity.

The architecture must remain usable if Vercel, PostHog or a push vendor changes or becomes unavailable. External providers supply bounded capabilities through replaceable adapters. They do not become the source of truth.

Push is a delivery channel, not a second inbox, not proof of receipt or understanding, and not an emergency-warning replacement. Opening a push must resolve to the current authorised MapAble record.

## Participant outcome

Participants can choose whether push is enabled, which categories may notify them, quiet hours, preview privacy and trusted devices. They can revoke lost devices, use MapAble without push, and recover every user-visible notification from the accessible in-app inbox.

Notification delivery must not make a participant's ability to use Care, Transport, Jobs, messaging, consent, billing or support dependent on an external notification provider.

Accessibility remains a release gate across screen readers, switch access, AAC, keyboard/external keyboard, large text, reduced motion and voice-independent flows.

## Current implementation evidence

| Capability | State | Repository evidence | Consequence |
|---|---|---|---|
| In-app Notification record | Implemented, not independently verified | `lib/notifications/notification-service.ts` | Keep as canonical inbox record |
| In-app + email wrapper | Implemented, not independently verified | `lib/notifications/notification-cloud.ts` | Preserve during migration |
| Push channel enum | Implemented | Core Prisma schema/migration includes `push` | No parallel channel taxonomy |
| Push contracts | Scaffold | `lib/platform/push/push-contracts.ts` | Refactor toward provider-neutral ports |
| Production push provider | Missing | `lib/platform/push/stub-provider.ts` | Safe to introduce recording transport first |
| Android push feature flag | Implemented, default off | `MAPABLE_MOBILE_PUSH_ENABLED=false` | Preserve for compatibility |
| Android device API | Scaffold | `/api/mobile/devices` | Preserve compatibility contract |
| Device registry durability | Missing | `lib/mobile/device-registry.ts` process memory | Replace as persistence source of truth |
| Android privacy policy | Scaffold | `apps/android/core/notifications/NotificationPrivacy.kt` | Reuse privacy intent |
| PostHog server analytics | Implemented for LLM analytics, not notification analytics | `lib/analytics/llm-analytics.ts` | New notification telemetry must be optional |
| Postgres outbox pattern | Implemented elsewhere | `lib/platform/event-outbox-service.ts` | Reuse pattern, not vendor queue |
| Vercel preview deployments | Verified available | connected `mapableau-new` project | Use as current deployment adapter, not runtime authority |

## Core invariants

1. **MapAble owns the domain.** Notification meaning, priority, privacy, routing intent, consent, recipient authority, audit and state live in MapAble Core.
2. **Providers are adapters.** Hosting, analytics, queueing and push transports are replaceable implementations of MapAble-owned interfaces.
3. **Canonical notification first.** Domain services create one MapAble notification; external delivery derives from it.
4. **No provider in the domain transaction.** An unavailable analytics, push or runtime provider cannot invalidate an otherwise valid Care, Transport, Jobs, billing, messaging, consent or support transaction.
5. **Push is optional.** The in-app inbox remains the persistent accessible fallback.
6. **Provider acceptance is not delivery.** `provider_accepted` means the transport provider accepted the request, not that the user saw or understood it.
7. **Privacy policy precedes provider selection.** Sensitive-field minimisation happens before any adapter receives an event or payload.
8. **External feature systems cannot override MapAble safety controls.**
9. **No emergency-broadcast claim.** MapAble push must not impersonate or replace AusAlert, carrier cell broadcast, Triple Zero or OS public-warning systems.
10. **Fail closed.** External sends remain disabled until adapter-specific evidence gates pass.

## Provider-neutral architecture

```text
MapAble domain services
Care / Transport / Jobs / Messages / Core
                    |
                    v
          Notification Core
    contracts / templates / privacy
    preferences / authority / audit
                    |
       +------------+-------------+
       |            |             |
       v            v             v
Persistence Port  Delivery Port  Telemetry Port
       |            |             |
       v            v             v
Prisma/Postgres  Push Router   Telemetry Router
                    |             |
          +---------+------+      +----------------+
          |         |      |      |        |       |
          v         v      v      v        v       v
        FCM       APNs    WNS   PostHog  OTel   Recording/
          \         |      /                     Noop
           \---- Web Push
                    |
                    v
             MapAble client
                    |
            authenticated open
                    |
                    v
        current authorised record
```

## Domain boundaries

### Notification Core

`lib/notifications/core/` owns:

- canonical notification intent;
- versioned templates;
- privacy/redaction;
- priorities and sensitivity;
- preferences;
- deduplication;
- endpoint-independent routing intent;
- outbox semantics;
- audit events;
- delivery result normalisation.

It must not import FCM, APNs, WNS, PostHog, Vercel or another provider SDK.

### Ports

`lib/notifications/ports/` defines MapAble interfaces:

- `PushTransport`
- `TelemetrySink`
- `NotificationEndpointStore`
- `NotificationJobRunner`

Adapters implement these contracts.

### Adapters

Provider-specific code lives behind the ports:

```text
lib/notifications/adapters/
  persistence/
    prisma-postgres.ts
  push/
    recording.ts
    fcm.ts
    apns.ts
    wns.ts
    web-push.ts
  telemetry/
    recording.ts
    noop.ts
    posthog.ts
    opentelemetry.ts
  runtime/
    nextjs-vercel.ts
```

Only the adapters required by the current implementation phase are created. The directory model defines ownership; it does not require speculative code.

## Provider-neutral push contract

```ts
export interface PushTransport {
  readonly key: string;

  send(request: PushEnvelope): Promise<PushTransportResult>;
}

export type PushTransportResult =
  | { state: "accepted"; providerReference?: string }
  | { state: "transient_failure"; reason: PushFailureClass }
  | { state: "permanent_failure"; reason: PushFailureClass }
  | { state: "invalid_endpoint"; reason: PushFailureClass };
```

Canonical failure classes include:

```text
INVALID_ENDPOINT
TEMPORARY_PROVIDER_FAILURE
PROVIDER_RATE_LIMIT
AUTH_CONFIGURATION_FAILURE
PAYLOAD_REJECTED
UNKNOWN_PROVIDER_FAILURE
```

Vendor-specific errors may be retained in tightly controlled operational diagnostics, but MapAble business logic sees only canonical classes.

## Provider conformance contract

Every push adapter must pass the same conformance suite:

- accepts the canonical envelope;
- never mutates or expands the payload;
- never logs endpoint credentials;
- respects expiry;
- maps provider-specific failures to canonical failure classes;
- handles retryable and permanent failures distinctly;
- identifies invalid endpoints;
- has bounded timeout behavior;
- honors provider-specific enable/disable configuration;
- produces honest `provider_accepted` semantics only.

A new provider cannot be activated merely because its SDK compiles.

## Priority model

V1 priorities:

- `background`: silent refresh hint.
- `normal`: routine user-visible update.
- `time_sensitive`: time-bounded service change such as a worker delay or imminent booking.
- `urgent_attention`: immediate human attention within MapAble, still not an emergency-broadcast class.

Do not expose `critical` or `emergency_broadcast` in v1. Platform-specific critical-alert entitlements require a separate design and approval.

## Event taxonomy

Keep the existing `NotificationCategory` enum initially. Add precise `eventType` metadata such as:

`care.booking.confirmed`, `care.worker.cancelled`, `transport.driver.delayed`, `messages.new`, `consent.expiring`, `support.human_response`, `billing.invoice_ready_for_review`, `safeguarding.human_review_update`, `system.security_notice`, `system.sync_complete`.

MapAble event names remain stable even if an analytics or delivery provider changes.

## Data model

### Existing Notification

Preserve as the persistent inbox record. Add only nullable/default-safe routing fields when necessary:

`purpose`, `priority`, `sensitivity`, `sourceModule`, `eventType`, `entityType`, `entityId`, `correlationId`, `dedupeKey`, `expiresAt`, and strictly validated non-secret metadata.

### NotificationEndpoint

New durable model replacing the in-memory registry as persistence source of truth:

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

Transport identifiers are data, not code ownership. The endpoint model must not contain vendor-specific business fields.

Raw endpoint credentials are restricted secrets and must not enter logs, analytics, model prompts, admin HTML, screenshots or error responses.

### NotificationOutbox

Durable MapAble-owned work state:

```text
id
notificationId
state
attempts
dedupeKey
nextAttemptAt
lastFailureClass
processedAt
createdAt
updatedAt
```

The database outbox is the continuity anchor. Queue vendors may accelerate delivery later, but loss of a queue provider cannot erase notification intent.

### NotificationDelivery

Durable delivery-attempt ledger:

```text
id
notificationId
endpointId
transport
state
attemptCount
providerReference
queuedAt
providerAcceptedAt
openedAt
failedAt
nextAttemptAt
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

No full domain record is transported. Deep links use allow-listed route identifiers, never arbitrary URLs supplied by domain data, AI output or providers.

## Delivery semantics

Use at-least-once attempt semantics with deduplication. Each notification has a MapAble-owned dedupe/idempotency key. Transient failures retry with bounded exponential backoff and jitter. Invalid endpoints become `invalid` and stop retrying. Expired items are cancelled.

Provider collapse/replacement features may be used inside adapters, but the canonical dedupe and expiry semantics remain MapAble-owned.

Consequential actions reached from a notification still pass normal MapAble authentication, permissions, consent, confirmation and Governed Action Kernel controls.

## Service continuity transaction boundary

Push, telemetry and runtime providers must sit outside the domain transaction.

```text
DATABASE TRANSACTION
  domain record
  Notification
  NotificationOutbox
COMMIT
  |
  +--> participant receives successful domain response
  |
  +--> asynchronous delivery processing
             |
             +--> push transport
             +--> telemetry sink
```

Hard invariant:

> No failure in the push-notification subsystem or its external providers may cause an otherwise valid Care, Transport, Access, Jobs, messaging, consent, billing or participant-account transaction to fail.

Provider outages create bounded degradation, not domain rollback.

## Job execution neutrality

MapAble owns a callable unit such as:

```ts
drainNotificationOutbox({
  limit,
  now,
}): Promise<DrainResult>
```

The core function does not know how it was scheduled.

It may be invoked by Vercel Cron/Functions, another managed scheduler, a Kubernetes CronJob, a self-hosted worker, an operator command or a later queue consumer without changing notification semantics.

The first slice uses the existing PostgreSQL/outbox pattern rather than adding a required external queue.

## Queue neutrality

If a queue is introduced later, it is an adapter/accelerator over the durable outbox:

```text
NotificationOutbox
      |
      +--> Postgres polling
      +--> Vercel Queue adapter
      +--> SQS adapter
      +--> Pub/Sub adapter
      +--> Service Bus adapter
      +--> self-hosted queue
```

The queue is never the only record of pending notification intent.

## Telemetry neutrality

MapAble owns a canonical telemetry schema and privacy filter.

```ts
export interface TelemetrySink {
  capture(event: NotificationTelemetryEvent): Promise<void>;
}
```

Flow:

```text
notification lifecycle
        |
        v
privacy allowlist
        |
        v
canonical telemetry event
        |
        +--> PostHogTelemetrySink
        +--> OpenTelemetrySink
        +--> RecordingTelemetrySink
        +--> NoopTelemetrySink
```

The privacy filter runs before any sink.

### Canonical telemetry fields

Allowed operational properties are limited to fields such as:

`platform`, `transport`, `category`, `priority`, `templateVersion`, `failureClass`, `latencyBucket`, `previewMode`, `endpointStatus`.

Do not capture notification title/body, diagnosis, support need, NDIS data, precise location, Private Storage Blob data, safeguarding narrative, raw endpoint/token values, participant IDs or user IDs in the first slice.

### PostHog role

PostHog is the currently selected product/operational telemetry adapter, not a domain dependency.

If PostHog is unavailable or disconnected:

- notification creation continues;
- endpoint registration continues;
- delivery processing continues;
- telemetry drops or buffers according to adapter policy;
- the participant sees no service failure attributable solely to analytics.

A PostHog dashboard is operational convenience, not the source of truth for notification state.

## Hosting/runtime neutrality

Vercel is the current preview/deployment environment for the Next.js application, not the notification architecture.

MapAble runtime code must use standard Next.js/Node/PostgreSQL contracts where practical and avoid making notification correctness dependent on Vercel-only semantics.

A later migration to another compatible host must not require changing:

- notification intent;
- privacy/redaction;
- preferences;
- dedupe;
- endpoint persistence;
- delivery state;
- provider failure taxonomy;
- audit semantics.

Vercel-specific code belongs only in a runtime adapter or deployment configuration.

## Source-control/CI neutrality

GitHub is the current repository/review/CI collaboration system. Notification runtime code must not depend on GitHub APIs or Actions.

Tests, migrations and verification commands must remain runnable outside GitHub Actions.

## Platform push adapters

### Android / FCM

FCM is the initial Android transport adapter, not the notification domain. Native code obtains an FCM registration token and registers it after authentication. Invalid registrations are mapped to `INVALID_ENDPOINT`.

### Apple / APNs

APNs is the Apple transport adapter for iOS/iPadOS/macOS. Payloads remain minimal; the app fetches current state on open. APNs-specific status values are normalised at the adapter boundary.

### Windows / WNS

WNS is the initial Windows transport adapter. The WebView receives only safe activation data through a typed bridge. Polling/in-app fallback remains available.

### Web/PWA / Web Push

Web Push is the standards-oriented browser transport. Subscription create/update/delete is authenticated and CSRF/XSRF protected. In-app remains the fallback.

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

Push must never transport Private Storage Blob contents. A push may signal that protected content changed. The local sync engine then authenticates, checks authority/consent/storage policy and retrieves only the authorised encrypted update.

A provider notification cannot create a new participant disclosure grant.

## Identity, consent and delegates

- Endpoint registration derives the user from the authenticated session; request payloads cannot choose another `userId`.
- Organisation membership does not imply participant authority.
- Delegate delivery must respect active authority grants.
- Notification preference is not consent to disclose sensitive details.
- Marketing, if ever added, uses separate opt-in and purpose.
- Revoking a device prevents future sends.
- Logout detaches/revokes the endpoint according to explicit trusted-device policy.
- Provider selection never expands participant consent or disclosure scope.

## Privacy

Default lock-screen preview is `redacted`.

Allowed default example:

> MapAble — A care booking has changed. Open MapAble to review.

Do not include diagnosis, medical history, NDIS identifiers, full address, precise live location, safeguarding/incident narrative, payment/bank information, sensitive message bodies, API/session tokens or Private Storage Blob content in push payloads.

Sensitive categories stay generic unless a participant has explicitly chosen descriptive previews on that device and deterministic policy permits the disclosure.

## AusAlert boundary

MapAble Push Notifications are not AusAlert. If MapAble later provides an accessible warning companion, the official warning remains clearly identified and unchanged; MapAble may add accessible rendering or participant-controlled assistance but cannot suppress, replace, downgrade or impersonate the official warning.

## AI boundary

AI may draft optional plain-language variants from approved source material, summarise after the participant opens MapAble, or suggest non-consequential reminder wording.

AI must not independently classify an event as emergency/urgent, bypass quiet hours, choose recipients, choose providers, add participant details, infer incapacity from communication behaviour or send safeguarding/clinical/financial/legal alerts.

High-impact templates remain deterministic and governance-approved.

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
  sourceModule,
  entityRef,
  templateKey,
  templateData,
  dedupeKey,
  expiresAt
})
```

`templateData` is schema-validated and never copied wholesale into OS payloads.

## Template registry

Version templates in MapAble-owned source:

```text
lib/notifications/core/templates/
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

Each template declares key, version, category, allowed priorities, sensitivity, redacted/descriptive strings, route, expiry, quiet-hours behaviour and required fields.

No provider owns or silently rewrites the authoritative template.

## Security controls

Provider credentials remain server-only. Endpoint addresses/tokens are encrypted at rest with a one-way hash for uniqueness where practical. Raw delivery credentials and sensitive payloads are excluded from logs, telemetry, model context and error responses.

Apply rate limits, cross-tenant targeting checks, deep-link allowlists, device revocation auditing and step-up authentication for especially sensitive records where required.

Production sends remain disabled until credentials and operational readiness are approved.

## Feature controls

Retain `MAPABLE_MOBILE_PUSH_ENABLED=false` for compatibility and add MapAble-owned safety flags:

```text
MAPABLE_PUSH_SEND_ENABLED=false
MAPABLE_PUSH_FCM_ENABLED=false
MAPABLE_PUSH_APNS_ENABLED=false
MAPABLE_PUSH_WNS_ENABLED=false
MAPABLE_WEB_PUSH_ENABLED=false
MAPABLE_PUSH_KILL_SWITCH=false
```

All send flags default false.

External feature-flag products may later govern rollout UX or cohorts, but they cannot override these safety controls. Effective permission is the intersection of external rollout intent and MapAble policy.

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

Audit semantics remain provider-neutral.

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
- per-transport failure distribution;
- adapter conformance state;
- worker/drain lag.

Analytics use classifications, never message bodies or disability/health/support content.

## Failure isolation and degradation ladder

Provider or runtime failures degrade capability rather than taking down MapAble:

```text
Level 0: push + in-app
   |
   | push transport failure
   v
Level 1: in-app only
   |
   | realtime path unavailable
   v
Level 2: REST polling + in-app
   |
   | broader connectivity outage
   v
Level 3: authorised local/offline information
   |
   v
Level 4: accessible human support path
```

Users must be told when functionality is degraded rather than being left to infer missing notifications.

## Migration strategy

Use **expand -> shadow -> switch -> soak -> contract**.

### R0 — Baseline

Capture current notification, mobile-device API, test, deployment and fallback behavior.

### R1 — Expand

Add only backward-compatible contracts, additive database schema and neutral ports. Existing call sites remain unchanged.

### R2 — Durable state

Add `NotificationEndpoint`, `NotificationOutbox` and `NotificationDelivery`. Preserve existing APIs. No external sends.

### R3 — Reference adapters

Implement:

- `RecordingPushTransport`
- `RecordingTelemetrySink`
- `NoopTelemetrySink`
- Prisma/Postgres persistence adapter

No external provider is required to prove core behavior.

### R4 — Shadow

Run production-shaped notification intent through the neutral core and recording adapters. Compare expected recipients, templates, redaction, dedupe, preferences and endpoint selection. No participant-facing push.

### R5 — Compatibility cutover

Route `/api/mobile/devices` through durable endpoint persistence while preserving old request/response compatibility. Existing clients do not need an immediate forced update.

### R6 — First external adapters

Wire currently selected adapters independently:

- PostHog telemetry adapter;
- one push transport;
- current Vercel runtime invocation.

Each remains separately disableable.

### R7 — Provider conformance

Every active adapter passes the same MapAble contract suite.

### R8 — Controlled pilot

Use synthetic/internal accounts first, then a specifically consented pilot with a low-risk notification category. Do not start with safeguarding, medication, payment or emergency-like messages.

### R9 — Resilience and exit test

Deliberately test:

- analytics sink unavailable;
- push transport unavailable;
- runtime worker unavailable;
- one transport disabled;
- all external push disabled.

MapAble domain services and canonical in-app notifications must continue.

### R10 — Scale

Add transports, notification categories and cohorts only after reliability, privacy, accessibility and continuity evidence.

### R11 — Contract

Retire obsolete compatibility code only after the replacement demonstrates equivalent or better reliability, accessibility, privacy and rollback behavior.

## First implementation slice

The smallest safe build is R0-R4, stopping before any external provider is required:

- canonical typed `notify()`;
- versioned template registry;
- privacy/redaction and deep-link policy;
- provider-neutral ports;
- durable `NotificationEndpoint`, `NotificationOutbox` and `NotificationDelivery`;
- authenticated endpoint CRUD;
- compatibility adapter for `/api/mobile/devices`;
- `RecordingPushTransport`;
- `RecordingTelemetrySink`;
- `NoopTelemetrySink`;
- provider conformance test harness;
- shadow-mode processing;
- Vercel preview verification as the current deployment adapter;
- all external send flags remain false.

PostHog is not required for this slice. FCM/APNs/WNS/Web Push credentials are not required.

## Provider selection framework

Before promoting an external provider, assess it against:

| Dimension | Evidence required |
|---|---|
| Functional capability | Required platform/API support |
| Privacy | Data collected and metadata exposed |
| Data locality | Processing/storage regions |
| Security | Authentication, key handling, isolation |
| Reliability | Observed failure/recovery behavior |
| Latency | Measured MapAble workload |
| Accessibility impact | User-visible behavior |
| Cost | Expected and measured MapAble volume |
| Operational complexity | Support/on-call burden |
| Auditability | Logs, receipts, exportability |
| Exit cost | Difficulty replacing the provider |
| Conformance | MapAble adapter test results |

Provider popularity, ownership or existing commercial relationship is not a technical selection criterion.

## Test plan

### Core unit tests

- template schemas;
- sensitivity/redaction;
- deep-link allowlist;
- priority restrictions;
- preference routing;
- quiet hours/timezones/DST;
- dedupe;
- expiry;
- endpoint transitions;
- retry classification;
- canonical provider-error normalisation.

### Port/conformance tests

Run identical contract tests against every adapter.

### Integration tests

- domain event -> Notification -> Outbox -> RecordingPushTransport -> Delivery;
- notification lifecycle -> privacy filter -> RecordingTelemetrySink;
- endpoint registration/revocation;
- invalid-token handling;
- logout/lost-device flow;
- cross-user/cross-org denial;
- push-disabled fallback;
- Private Storage Blob non-disclosure;
- duplicate/replayed event handling.

### Provider-neutrality tests

- swap `RecordingTelemetrySink` for `NoopTelemetrySink` without domain code changes;
- disable telemetry entirely and preserve notification behavior;
- swap push transport implementation without changing notification core tests;
- invoke outbox drain directly without Vercel;
- run tests without GitHub Actions;
- no provider package imports from notification core.

### Continuity tests

- push transport throws -> domain operation succeeds;
- telemetry sink throws -> domain operation succeeds;
- worker unavailable -> outbox remains durable;
- external send kill switch -> inbox remains active;
- old mobile endpoint API -> durable endpoint store;
- rollback to previous application version remains safe after additive migration.

### Security/privacy tests

- raw token leak scan;
- IDOR/cross-tenant endpoint access;
- CSRF/XSRF where browser endpoints require it;
- route injection;
- sensitive content minimisation;
- shared-device preview review;
- no secrets in repository/client/logs/telemetry.

### Accessibility tests

Automated checks plus manual assistive-technology testing. Automated checks alone are insufficient.

## Launch gates

Production push remains disabled until:

- additive migration proof on a clean database;
- backward compatibility proof;
- provider-neutral conformance suite;
- approved secret storage;
- token-leak checks;
- in-app fallback;
- privacy/redaction tests;
- lost-device revocation;
- IDOR/cross-tenant tests;
- provider retry tests;
- worker lag observability;
- manual assistive-technology testing;
- usable preferences/quiet hours;
- safeguarding/AusAlert review;
- resilience/exit test;
- rollback drill;
- platform-account prerequisites;
- explicit production-flag approval.

## Rollback

```text
engage MAPABLE_PUSH_KILL_SWITCH
  -> stop all external push sends
  -> continue canonical in-app Notification creation
  -> leave domain transactions unaffected
  -> retain queued state for operator review/policy
  -> retain permitted email fallback
```

If one adapter fails, disable only that adapter where possible.

The additive database migration is not rolled back during an application incident unless it independently causes harm; application code can roll back while additive tables remain.

## Open implementation decisions

Before external-provider phases, confirm:

- encryption/key-management for endpoint credentials;
- retention for delivery receipts;
- Apple/Firebase/Microsoft/VAPID credential ownership;
- PostHog project/region and telemetry retention;
- OpenTelemetry/export strategy;
- whether provider/worker descriptive previews remain permanently disabled for selected sensitive categories;
- scheduling adapter for sustained outbox draining;
- timeout/bulkhead values for each provider.

These decisions do not block the neutral first slice.

## Definition of done for first slice

The first slice is complete only when:

- tests are written before implementation and pass;
- existing notification/email flows remain green;
- schema migration is additive and clean on a disposable database;
- endpoint CRUD enforces authenticated ownership;
- notification core imports no PostHog, Vercel, FCM, APNs or WNS SDK;
- no raw push credential or sensitive notification text enters logs or telemetry;
- in-memory mobile registry is no longer the persistence source of truth;
- notification outbox rows are idempotent and durable;
- RecordingPushTransport produces honest `provider_accepted` semantics;
- RecordingTelemetrySink and NoopTelemetrySink can be substituted without domain changes;
- provider conformance tests exist;
- shadow mode performs zero external sends;
- push/telemetry/runtime provider failure cannot fail a domain transaction;
- accessibility of any changed notification UI remains verified;
- Vercel preview builds successfully as the current deployment adapter;
- PostHog is optional and not required for the slice to pass;
- all external send flags remain off;
- no production deploy, feature enablement or provider credential change occurs without separate approval.
