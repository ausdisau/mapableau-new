# MapAble Push Notifications First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved non-sending MapAble push-notification foundation: canonical typed notification creation, privacy-safe templates, durable endpoints/delivery/outbox persistence, authenticated device management, a recording provider for deterministic tests, privacy-minimised PostHog telemetry, and Vercel preview verification while every external push transport remains disabled.

**Architecture:** Existing domain services continue to rely on MapAble Core. New push behavior is added under `lib/notifications/` and `lib/platform/push/`; the canonical `Notification` inbox record remains the source of truth. New endpoint/delivery/outbox tables provide durable state, and all live transports remain fail-closed behind server-side flags. The existing Android `/api/mobile/devices` route becomes a compatibility adapter over the durable endpoint service.

**Tech Stack:** Next.js 15.5.21 App Router, React 18, TypeScript 5.x, Prisma 6.19.2, PostgreSQL/Neon, Zod 4.3.6, Vitest 3.2.7, Playwright 1.61.1, `posthog-node` 5.36.7, Vercel preview deployments.

**Spec:** `docs/superpowers/specs/2026-09-20-mapable-push-notifications-design.md`

## Global Constraints

- Keep `Notification` and `NotificationPreference` as canonical MapAble Core records; do not create a second user-visible inbox.
- External provider sends remain disabled by default: `MAPABLE_PUSH_SEND_ENABLED=false`, `MAPABLE_PUSH_FCM_ENABLED=false`, `MAPABLE_PUSH_APNS_ENABLED=false`, `MAPABLE_PUSH_WNS_ENABLED=false`, `MAPABLE_WEB_PUSH_ENABLED=false`.
- `MAPABLE_PUSH_KILL_SWITCH=true` must stop external push attempts while preserving canonical in-app notification creation.
- Reuse `resolveDataEncryptionKey()` from `lib/security/encryption-keys.ts`; never fall back to NextAuth/session secrets.
- Never log, return, or send to PostHog raw push tokens, notification bodies, diagnosis/health/support details, NDIS identifiers, precise location, safeguarding narratives, payment/bank details, or Private Storage Blob content.
- Push is optional; existing in-app behavior must continue when push is disabled.
- Provider acceptance means only `provider_accepted`; never name that state `delivered` or infer that the user saw or understood the notification.
- Preserve existing mobile auth: native device registration remains bound to the authenticated `CurrentUser`; request payloads cannot choose another user.
- Do not implement or enable AusAlert impersonation, public-warning replacement, emergency-broadcast priority, FCM/APNs/WNS/Web Push credentials, or production rollout in this plan.
- Do not merge, deploy to production, change production environment variables, or enable live sends without a separate user approval.
- WCAG 2.2 AA remains the web baseline; no user-visible regression to notification inbox/settings behavior is permitted.

## Review Focus

1. **Duplicate/retried domain events:** the same `dedupeKey` must create one canonical notification/outbox item, not duplicate user alerts.
2. **Sensitive free text:** health/safeguarding/payment-like content must collapse to a generic lock-screen preview even when a caller supplies descriptive text.
3. **Endpoint ownership:** a browser or mobile caller must never register, update, list, or revoke an endpoint belonging to another user.
4. **Revoked/invalid endpoints:** they must never be selected for a delivery attempt, and invalid-token handling must be idempotent.
5. **Analytics leakage:** unknown or sensitive PostHog properties must be rejected before capture; event bodies/titles/tokens must never cross the analytics adapter.

---

## File Structure

### Create

- `lib/notifications/contracts.ts` — typed notification intent/result schemas and enums.
- `lib/notifications/privacy.ts` — deterministic preview redaction and sensitive-key denylist.
- `lib/notifications/templates/index.ts` — versioned template registry and route allowlist.
- `lib/notifications/endpoint-secret.ts` — AES-256-GCM encrypt/decrypt + stable token hash using existing MapAble data-encryption key material.
- `lib/notifications/endpoint-service.ts` — durable endpoint CRUD owned by authenticated user.
- `lib/notifications/outbox-service.ts` — idempotent notification outbox creation/claim/result transitions.
- `lib/notifications/push-delivery-service.ts` — endpoint selection + delivery state transitions via provider interface.
- `lib/platform/push/server-provider.ts` — server-side push transport interface and recording provider.
- `lib/analytics/notification-analytics.ts` — PostHog notification telemetry allowlist/no-op behavior.
- `app/api/notifications/endpoints/route.ts` — authenticated browser list/register endpoint API.
- `app/api/notifications/endpoints/[id]/route.ts` — authenticated browser update/revoke endpoint API.
- `tests/notifications/notification-contracts.test.ts`
- `tests/notifications/notification-persistence.test.ts`
- `tests/notifications/notification-endpoints.test.ts`
- `tests/notifications/notification-outbox.test.ts`
- `tests/notifications/push-delivery.test.ts`
- `tests/notifications/notification-analytics.test.ts`
- `tests/security/notification-endpoint-ownership.test.ts`
- `prisma/migrations/20260920150000_notification_push_foundation/migration.sql`

### Modify

- `prisma/schema.prisma` — additive notification metadata plus endpoint/delivery/outbox models.
- `lib/notifications/notification-service.ts` — add canonical `notify()`; preserve `notifyUser()` compatibility.
- `lib/notifications/notification-cloud.ts` — reuse shared redaction helper; do not add live push here.
- `lib/platform/push/push-contracts.ts` — align client-facing priority/preview contracts without breaking existing callers.
- `lib/mobile/device-registry.ts` — demote in-memory registry to compatibility shim over durable endpoint service, or remove its Map state once callers migrate.
- `app/api/mobile/devices/route.ts` — call durable endpoint service using `requireMobileAccessToken()`.
- `lib/mobile/config.ts` and `lib/config/mobile-communication.ts` — preserve current flag, add canonical push send/transport/kill-switch readers.
- `.env.example` — document new fail-closed flags only; no secrets.
- `docs/integrations/environment.md` — document flag behavior and PostHog telemetry boundary.
- `tests/notifications/notification-cloud.test.ts` — regression coverage for shared redaction and unchanged email/in-app behavior.
- `tests/mobile-api-backbone.test.ts` — durable registration compatibility coverage if this remains the canonical mobile API test file.

---

### Task 1: Lock notification contracts, templates, and privacy rules

**Files:**
- Create: `lib/notifications/contracts.ts`
- Create: `lib/notifications/privacy.ts`
- Create: `lib/notifications/templates/index.ts`
- Create: `tests/notifications/notification-contracts.test.ts`
- Modify: `lib/notifications/notification-cloud.ts`
- Modify: `tests/notifications/notification-cloud.test.ts`

**Interfaces:**
- Consumes: existing Prisma `NotificationCategory`.
- Produces:
  - `notificationIntentSchema`
  - `NotificationIntent`
  - `NotificationPriority = "background" | "normal" | "time_sensitive" | "urgent_attention"`
  - `NotificationSensitivity = "ordinary" | "sensitive" | "restricted"`
  - `NotificationPreviewMode = "redacted" | "descriptive"`
  - `resolveNotificationTemplate(input: NotificationIntent): ResolvedNotificationTemplate`
  - `redactNotificationPreview(text: string, sensitivity?: NotificationSensitivity): string`
  - `assertSafeNotificationRoute(screen: string): void`

- [ ] **Step 1: Write failing contract/privacy tests**

```ts
import { describe, expect, it } from "vitest";

import {
  notificationIntentSchema,
  resolveNotificationTemplate,
} from "@/lib/notifications/contracts";
import { redactNotificationPreview } from "@/lib/notifications/privacy";
import { assertSafeNotificationRoute } from "@/lib/notifications/templates";

describe("notification contracts", () => {
  it("rejects emergency-broadcast priority", () => {
    expect(() =>
      notificationIntentSchema.parse({
        userId: "user-1",
        category: "system",
        eventType: "system.test",
        purpose: "test",
        priority: "critical",
        sourceModule: "system",
        templateKey: "system.generic_update",
        templateData: {},
        dedupeKey: "system:test:1",
      }),
    ).toThrow();
  });

  it("redacts sensitive previews deterministically", () => {
    expect(
      redactNotificationPreview(
        "Medication and safeguarding notes changed",
        "sensitive",
      ),
    ).toBe("You have a new MapAble notification. Open MapAble to view it securely.");
  });

  it("rejects arbitrary deep-link routes", () => {
    expect(() => assertSafeNotificationRoute("https://evil.example")).toThrow();
  });

  it("resolves a versioned generic system template", () => {
    const resolved = resolveNotificationTemplate({
      userId: "user-1",
      category: "system",
      eventType: "system.account_update",
      purpose: "account.update",
      priority: "normal",
      sourceModule: "system",
      templateKey: "system.generic_update",
      templateData: {},
      dedupeKey: "system:account:user-1",
    });
    expect(resolved.templateVersion).toBe("1.0.0");
    expect(resolved.route.screen).toBe("notifications");
  });
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run:

```bash
pnpm vitest run tests/notifications/notification-contracts.test.ts
```

Expected: FAIL because the new modules/exports do not exist.

- [ ] **Step 3: Implement the typed contracts**

Use strict Zod schemas. The core input must include:

```ts
export const notificationPrioritySchema = z.enum([
  "background",
  "normal",
  "time_sensitive",
  "urgent_attention",
]);

export const notificationSensitivitySchema = z.enum([
  "ordinary",
  "sensitive",
  "restricted",
]);

export const notificationIntentSchema = z.object({
  userId: z.string().min(1),
  category: z.enum([
    "booking",
    "profile",
    "consent",
    "provider",
    "billing",
    "support",
    "safeguarding",
    "system",
  ]),
  eventType: z.string().min(1),
  purpose: z.string().min(1),
  priority: notificationPrioritySchema,
  sensitivity: notificationSensitivitySchema.default("ordinary"),
  sourceModule: z.string().min(1),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  correlationId: z.string().uuid().optional(),
  dedupeKey: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  templateKey: z.string().min(1),
  templateData: z.record(z.string(), z.unknown()),
}).strict();
```

The template registry must support only allow-listed route IDs such as `notifications`, `care_booking`, `transport_trip`, `messages`, `support`, and `billing`. It must not accept arbitrary URLs.

- [ ] **Step 4: Move preview redaction to `privacy.ts`**

The shared function must produce the exact generic string:

```ts
export const GENERIC_SECURE_PREVIEW =
  "You have a new MapAble notification. Open MapAble to view it securely.";
```

Sensitive/restricted messages always use the generic preview. Ordinary content also becomes generic when matching the existing clinical/safeguarding/payment-sensitive pattern.

Update `notification-cloud.ts` to import the shared function rather than own a separate regex.

- [ ] **Step 5: Run contract + cloud regressions**

```bash
pnpm vitest run   tests/notifications/notification-contracts.test.ts   tests/notifications/notification-cloud.test.ts
```

Expected: PASS.

- [ ] **Step 6: Lint touched notification files**

```bash
pnpm exec eslint   lib/notifications/contracts.ts   lib/notifications/privacy.ts   lib/notifications/templates/index.ts   lib/notifications/notification-cloud.ts   tests/notifications/notification-contracts.test.ts   tests/notifications/notification-cloud.test.ts   --max-warnings 0
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add   lib/notifications/contracts.ts   lib/notifications/privacy.ts   lib/notifications/templates/index.ts   lib/notifications/notification-cloud.ts   tests/notifications/notification-contracts.test.ts   tests/notifications/notification-cloud.test.ts
git commit -m "feat(notifications): define push privacy contracts"
```

---

### Task 2: Add durable endpoint, outbox, and delivery persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260920150000_notification_push_foundation/migration.sql`
- Create: `lib/notifications/endpoint-secret.ts`
- Create: `tests/notifications/notification-persistence.test.ts`

**Interfaces:**
- Consumes: `resolveDataEncryptionKey()` from `lib/security/encryption-keys.ts`.
- Produces:
  - Prisma models `NotificationEndpoint`, `NotificationOutbox`, `NotificationDelivery`
  - Prisma enums for endpoint platform/transport/status, delivery/outbox state, notification priority/sensitivity/preview mode
  - `encryptEndpointAddress(value: string): string`
  - `decryptEndpointAddress(ciphertext: string): string | null`
  - `hashEndpointAddress(value: string): string`

- [ ] **Step 1: Write failing encryption/persistence-shape tests**

```ts
import { describe, expect, it } from "vitest";

import {
  decryptEndpointAddress,
  encryptEndpointAddress,
  hashEndpointAddress,
} from "@/lib/notifications/endpoint-secret";

describe("notification endpoint secrets", () => {
  it("encrypts reversibly without returning plaintext", () => {
    process.env.MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK = "true";
    process.env.NODE_ENV = "test";
    const raw = "fcm:test-device-token";
    const encrypted = encryptEndpointAddress(raw);
    expect(encrypted).not.toContain(raw);
    expect(decryptEndpointAddress(encrypted)).toBe(raw);
  });

  it("creates a stable one-way lookup hash", () => {
    expect(hashEndpointAddress("token-a")).toBe(hashEndpointAddress("token-a"));
    expect(hashEndpointAddress("token-a")).not.toBe(hashEndpointAddress("token-b"));
  });
});
```

Also add a schema-source test that reads `prisma/schema.prisma` and asserts the three new model names and required unique/index declarations exist. This catches accidental model omission before Prisma generation.

- [ ] **Step 2: Run the new test and confirm RED**

```bash
pnpm vitest run tests/notifications/notification-persistence.test.ts
```

Expected: FAIL because the helper/models do not exist.

- [ ] **Step 3: Implement endpoint secret encryption**

Use Node `crypto` AES-256-GCM with `resolveDataEncryptionKey()`, the same versioned payload shape already used by `lib/crypto/ndis.ts`, and SHA-256 for `addressHash`.

The helper must throw `EncryptionKeyUnavailableError` when encryption material is unavailable; it must not silently fall back to session secrets.

- [ ] **Step 4: Extend Prisma schema additively**

Add these exact logical entities:

```prisma
enum NotificationEndpointStatus {
  active
  stale
  revoked
  invalid
}

enum NotificationEndpointPlatform {
  android
  ios
  macos
  windows
  web
}

enum NotificationTransport {
  fcm
  apns
  wns
  web_push
}

enum NotificationPreviewMode {
  redacted
  descriptive
}

enum NotificationOutboxState {
  queued
  processing
  processed
  retry_scheduled
  dead_lettered
  cancelled
}

enum NotificationDeliveryState {
  queued
  sending
  provider_accepted
  retry_scheduled
  permanent_failure
  cancelled
  opened
}
```

Add `NotificationEndpoint` with user relation, `deviceId`, platform, transport, `addressCiphertext`, `addressHash`, app/client version, locale/timezone, preview mode, status, registration/seen/revoked timestamps, and timestamps. Enforce `@@unique([userId, deviceId, transport])` and index status/user lookups.

Add `NotificationOutbox` keyed to `Notification`, with `state`, attempts, next-attempt timestamp, last error, dedupe key, created/updated/processed timestamps, and `@@unique([notificationId])`.

Add `NotificationDelivery` keyed to notification and endpoint, with provider message id, state, attempt count, accepted/opened/failed/next-attempt timestamps and failure class/code. Enforce `@@unique([notificationId, endpointId])`.

Extend `Notification` only with nullable/default-safe routing metadata so existing rows remain valid. Do not rewrite existing categories or drop columns.

- [ ] **Step 5: Generate the migration without touching production**

From an isolated implementation worktree:

```bash
pnpm prisma generate
pnpm prisma migrate diff   --from-migrations prisma/migrations   --to-schema prisma/schema.prisma   --script > /tmp/mapable-notification-push.sql
```

Use the generated SQL as the basis for `prisma/migrations/20260920150000_notification_push_foundation/migration.sql`; review it to ensure it contains only additive enum/table/column/index/FK changes for this feature.

- [ ] **Step 6: Validate migration ordering/integrity**

```bash
pnpm ci:migration-order
pnpm ci:migration-integrity
pnpm prisma validate
pnpm prisma generate
```

Expected: PASS.

- [ ] **Step 7: Prove clean database migration when Docker is available**

Run:

```bash
docker rm -f mapable-push-pg 2>/dev/null || true
docker run --rm -d   --name mapable-push-pg   -e POSTGRES_PASSWORD=postgres   -e POSTGRES_DB=mapable_push_test   -p 55432:5432   postgres:16
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/mapable_push_test?schema=public' pnpm prisma migrate deploy
docker rm -f mapable-push-pg
```

Expected: all repository migrations apply cleanly. If Docker is unavailable, stop and report that the required clean-DB proof is outstanding rather than claiming completion.

- [ ] **Step 8: Run persistence tests**

```bash
pnpm vitest run tests/notifications/notification-persistence.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add   prisma/schema.prisma   prisma/migrations/20260920150000_notification_push_foundation/migration.sql   lib/notifications/endpoint-secret.ts   tests/notifications/notification-persistence.test.ts
git commit -m "feat(notifications): persist push endpoints and delivery state"
```

---

### Task 3: Implement authenticated endpoint management and mobile compatibility

**Files:**
- Create: `lib/notifications/endpoint-service.ts`
- Create: `app/api/notifications/endpoints/route.ts`
- Create: `app/api/notifications/endpoints/[id]/route.ts`
- Modify: `lib/mobile/device-registry.ts`
- Modify: `app/api/mobile/devices/route.ts`
- Create: `tests/notifications/notification-endpoints.test.ts`
- Create: `tests/security/notification-endpoint-ownership.test.ts`
- Modify: `tests/mobile-api-backbone.test.ts`

**Interfaces:**
- Consumes: `encryptEndpointAddress`, `hashEndpointAddress`, Prisma client, `requireApiSession()`, `requireMobileAccessToken()`.
- Produces:
  - `registerNotificationEndpoint(userId, input)`
  - `listNotificationEndpoints(userId)`
  - `updateNotificationEndpoint(userId, endpointId, input)`
  - `revokeNotificationEndpoint(userId, endpointId)`
  - compatibility functions in `lib/mobile/device-registry.ts` backed by the durable service.

- [ ] **Step 1: Write failing service ownership tests**

```ts
it("binds endpoint ownership to authenticated user, not body userId", async () => {
  await registerNotificationEndpoint("user-a", {
    deviceId: "device-1",
    platform: "android",
    transport: "fcm",
    address: "token-1",
    appVersion: "1.0.0",
  });

  expect(prisma.notificationEndpoint.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId_deviceId_transport: {
          userId: "user-a",
          deviceId: "device-1",
          transport: "fcm",
        },
      },
    }),
  );
});

it("refuses to revoke another user's endpoint", async () => {
  vi.mocked(prisma.notificationEndpoint.updateMany).mockResolvedValue({ count: 0 });
  await expect(revokeNotificationEndpoint("user-b", "endpoint-owned-by-a"))
    .rejects.toThrow("NOTIFICATION_ENDPOINT_NOT_FOUND");
});
```

Add a security route test that passes a body containing `userId: "victim"` while the authenticated actor is `user-a`; assert the service receives only `user-a`.

- [ ] **Step 2: Run endpoint/security tests and confirm RED**

```bash
pnpm vitest run   tests/notifications/notification-endpoints.test.ts   tests/security/notification-endpoint-ownership.test.ts
```

Expected: FAIL because endpoint service/routes do not exist.

- [ ] **Step 3: Implement endpoint-service Zod inputs**

Registration schema:

```ts
const registerEndpointSchema = z.object({
  deviceId: z.string().min(1).max(200),
  platform: z.enum(["android", "ios", "macos", "windows", "web"]),
  transport: z.enum(["fcm", "apns", "wns", "web_push"]),
  address: z.string().min(1).max(8192),
  appVersion: z.string().min(1).max(100),
  clientVersion: z.string().max(100).optional(),
  locale: z.string().max(40).optional(),
  timeZone: z.string().max(100).optional(),
  previewMode: z.enum(["redacted", "descriptive"]).default("redacted"),
}).strict();
```

Upsert only on authenticated `userId + deviceId + transport`. Re-registration sets `status=active`, clears `revokedAt`, refreshes ciphertext/hash/version metadata, and updates `lastRegisteredAt/lastSeenAt`.

List results must never include `addressCiphertext` or decrypted address. Return endpoint metadata only.

Revoke via `updateMany({ where: { id, userId, status: { not: "revoked" }}})`; if count is zero, throw `NOTIFICATION_ENDPOINT_NOT_FOUND`.

- [ ] **Step 4: Implement thin browser endpoint routes**

`POST/GET /api/notifications/endpoints` use `requireApiSession()`.

`PATCH/DELETE /api/notifications/endpoints/:id` use `requireApiSession()`.

Route handlers validate JSON, call the service, map ownership/not-found errors to 404, validation to 400, encryption-key-unavailable to 503, and never echo raw token/address values.

- [ ] **Step 5: Replace mobile in-memory persistence**

Change `lib/mobile/device-registry.ts` to async compatibility functions over `endpoint-service.ts` or remove the module-level `Map` entirely and export wrappers with the existing intent.

Map mobile platform to transport:
- Android -> `fcm`
- iOS -> `apns`

If `pushToken` is null, register only when an existing endpoint is being refreshed without a credential; otherwise return metadata without inventing a token.

Update `app/api/mobile/devices/route.ts` to `await` the durable service and retain `requireMobileAccessToken()`.

- [ ] **Step 6: Extend mobile backbone tests**

Add assertions that:
- POST registers the authenticated mobile user;
- GET never returns ciphertext/token;
- DELETE cannot revoke another user's endpoint;
- feature-disabled behavior remains 503 as before.

- [ ] **Step 7: Run endpoint/mobile tests**

```bash
pnpm vitest run   tests/notifications/notification-endpoints.test.ts   tests/security/notification-endpoint-ownership.test.ts   tests/mobile-api-backbone.test.ts
```

Expected: PASS.

- [ ] **Step 8: Lint API/service changes**

```bash
pnpm exec eslint   lib/notifications/endpoint-service.ts   lib/mobile/device-registry.ts   app/api/notifications/endpoints/route.ts   'app/api/notifications/endpoints/[id]/route.ts'   app/api/mobile/devices/route.ts   tests/notifications/notification-endpoints.test.ts   tests/security/notification-endpoint-ownership.test.ts   tests/mobile-api-backbone.test.ts   --max-warnings 0
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add   lib/notifications/endpoint-service.ts   lib/mobile/device-registry.ts   app/api/notifications/endpoints/route.ts   'app/api/notifications/endpoints/[id]/route.ts'   app/api/mobile/devices/route.ts   tests/notifications/notification-endpoints.test.ts   tests/security/notification-endpoint-ownership.test.ts   tests/mobile-api-backbone.test.ts
git commit -m "feat(notifications): add durable endpoint management"
```

---

### Task 4: Add canonical `notify()` and idempotent outbox creation

**Files:**
- Modify: `lib/notifications/notification-service.ts`
- Create: `lib/notifications/outbox-service.ts`
- Create: `tests/notifications/notification-outbox.test.ts`
- Modify: `lib/mobile/config.ts`
- Modify: `lib/config/mobile-communication.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Task 1 contracts/templates, Prisma, existing `NotificationPreference`.
- Produces:
  - `notify(input: NotificationIntent): Promise<NotificationDispatchRecord>`
  - `enqueueNotificationOutbox(tx, notificationId, dedupeKey)`
  - `claimNotificationOutbox(limit, now)`
  - `completeNotificationOutbox(id, now)`
  - `retryNotificationOutbox(id, errorCode, nextAttemptAt)`
  - `isPushSendEnabled()`
  - `isPushKilled()`

- [ ] **Step 1: Write failing canonical notification tests**

```ts
it("creates one canonical notification and one outbox row per dedupe key", async () => {
  const first = await notify(makeIntent({ dedupeKey: "care:booking:123:changed" }));
  const second = await notify(makeIntent({ dedupeKey: "care:booking:123:changed" }));

  expect(second.notification.id).toBe(first.notification.id);
  expect(await prisma.notificationOutbox.count({
    where: { notificationId: first.notification.id },
  })).toBe(1);
});

it("still creates the canonical inbox record when external push is disabled", async () => {
  process.env.MAPABLE_PUSH_SEND_ENABLED = "false";
  const result = await notify(makeIntent({ dedupeKey: "system:test:no-push" }));
  expect(result.notification.id).toBeTruthy();
  expect(result.pushEligible).toBe(false);
});
```

Add a test that `MAPABLE_PUSH_KILL_SWITCH=true` returns `pushEligible=false` without preventing the `Notification` row.

- [ ] **Step 2: Run outbox tests and confirm RED**

```bash
pnpm vitest run tests/notifications/notification-outbox.test.ts
```

Expected: FAIL because `notify()` and outbox service do not exist.

- [ ] **Step 3: Implement fail-closed push config**

Add getters that treat only the literal string `"true"` as enabled. `MAPABLE_PUSH_KILL_SWITCH=true` overrides every send flag.

Keep existing `MAPABLE_MOBILE_PUSH_ENABLED` intact for compatibility; do not repurpose it as the canonical send authorization.

Document defaults in `.env.example`:

```bash
MAPABLE_PUSH_SEND_ENABLED=false
MAPABLE_PUSH_FCM_ENABLED=false
MAPABLE_PUSH_APNS_ENABLED=false
MAPABLE_PUSH_WNS_ENABLED=false
MAPABLE_WEB_PUSH_ENABLED=false
MAPABLE_PUSH_KILL_SWITCH=false
```

- [ ] **Step 4: Implement idempotent `notify()`**

`notify()` must:
1. parse `NotificationIntent`;
2. resolve a versioned template;
3. derive privacy-safe title/body;
4. create or reuse the canonical `Notification` by `dedupeKey`;
5. create exactly one `NotificationOutbox` row for that notification in the same Prisma transaction;
6. return `pushEligible=false` when push send is disabled/killed, without deleting the outbox or inbox record.

Do not migrate all domain call sites in this task.

Preserve the existing `notifyUser(userId, category, title, body)` signature and behavior for current callers. Implement it as a compatibility path, not as a wrapper that changes current preference semantics unexpectedly.

- [ ] **Step 5: Implement bounded outbox claim/retry transitions**

Use `queued/retry_scheduled -> processing -> processed` and `processing -> retry_scheduled/dead_lettered`.

Claim oldest eligible rows first. Guard double-processing with a conditional update on the expected current state; a failed claim is skipped.

Bound stored `lastError` to a non-sensitive error code/class, not raw provider body.

- [ ] **Step 6: Add duplicate retry review-focus test**

Invoke `notify()` twice with the same dedupe key and then claim the outbox twice. Assert only one claim succeeds.

- [ ] **Step 7: Run outbox and existing cloud tests**

```bash
pnpm vitest run   tests/notifications/notification-outbox.test.ts   tests/notifications/notification-cloud.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add   lib/notifications/notification-service.ts   lib/notifications/outbox-service.ts   lib/mobile/config.ts   lib/config/mobile-communication.ts   .env.example   tests/notifications/notification-outbox.test.ts
git commit -m "feat(notifications): add canonical notification outbox"
```

---

### Task 5: Add recording push provider and honest delivery lifecycle

**Files:**
- Create: `lib/platform/push/server-provider.ts`
- Create: `lib/notifications/push-delivery-service.ts`
- Modify: `lib/platform/push/push-contracts.ts`
- Create: `tests/notifications/push-delivery.test.ts`

**Interfaces:**
- Consumes: endpoint service, outbox service, encrypted endpoint addresses, push config.
- Produces:
  - `ServerPushProvider.send(request): Promise<ProviderAcceptance>`
  - `RecordingPushProvider`
  - `processNotificationOutboxItem(outboxId, provider, now)`
  - `markNotificationOpened(userId, notificationId, endpointId?)`

- [ ] **Step 1: Write failing delivery lifecycle tests**

```ts
it("records provider_accepted without calling it delivered", async () => {
  const provider = new RecordingPushProvider({
    result: { kind: "accepted", providerMessageId: "provider-123" },
  });

  const result = await processNotificationOutboxItem(
    "outbox-1",
    provider,
    new Date("2026-09-20T05:00:00Z"),
  );

  expect(result.state).toBe("provider_accepted");
  expect(result.state).not.toBe("delivered");
});

it("never selects revoked or invalid endpoints", async () => {
  vi.mocked(prisma.notificationEndpoint.findMany).mockResolvedValue([
    endpoint({ id: "active", status: "active" }),
  ] as never);

  await processNotificationOutboxItem("outbox-1", provider, new Date());

  expect(provider.requests.map((r) => r.endpointId)).toEqual(["active"]);
});
```

Add invalid-token behavior: provider returns `permanent_failure` with `invalid_endpoint`; endpoint transitions to `invalid`; a repeated processing attempt does not reselect it.

- [ ] **Step 2: Run delivery tests and confirm RED**

```bash
pnpm vitest run tests/notifications/push-delivery.test.ts
```

Expected: FAIL because provider/delivery service does not exist.

- [ ] **Step 3: Implement server provider contract**

Use a distinct server contract; do not overload the existing browser/client `PushProvider` permission API.

```ts
export type ServerPushRequest = {
  endpointId: string;
  transport: "fcm" | "apns" | "wns" | "web_push";
  address: string;
  notificationId: string;
  title: string;
  body: string;
  route: { screen: string; entityId?: string };
  collapseKey?: string;
  expiresAt?: string;
};

export type ProviderAcceptance =
  | { kind: "accepted"; providerMessageId?: string }
  | { kind: "transient_failure"; code: string }
  | { kind: "permanent_failure"; code: string };

export interface ServerPushProvider {
  send(request: ServerPushRequest): Promise<ProviderAcceptance>;
}
```

The `RecordingPushProvider` stores requests in memory only for tests/development and never performs network I/O.

- [ ] **Step 4: Implement delivery state transitions**

`processNotificationOutboxItem()` must:
- stop immediately when send disabled or kill switch engaged;
- load the canonical notification;
- select only `active` endpoints;
- respect push preference before creating a delivery;
- decrypt the endpoint address only immediately before provider call;
- create/update one `NotificationDelivery` per notification+endpoint;
- translate provider result to `provider_accepted`, `retry_scheduled`, or `permanent_failure`;
- mark endpoint invalid on invalid-token permanent failures;
- never persist decrypted address;
- mark outbox `processed` only after all eligible endpoints reach a terminal or scheduled state.

- [ ] **Step 5: Add no-endpoint / preference-disabled tests**

Assert no provider call occurs when the user has no active endpoint or push category preference is disabled. The canonical in-app notification remains intact.

- [ ] **Step 6: Run delivery tests**

```bash
pnpm vitest run   tests/notifications/push-delivery.test.ts   tests/notifications/notification-outbox.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add   lib/platform/push/server-provider.ts   lib/platform/push/push-contracts.ts   lib/notifications/push-delivery-service.ts   tests/notifications/push-delivery.test.ts
git commit -m "feat(notifications): add recording push delivery pipeline"
```

---

### Task 6: Add privacy-minimised PostHog notification telemetry

**Files:**
- Create: `lib/analytics/notification-analytics.ts`
- Create: `tests/notifications/notification-analytics.test.ts`
- Modify: `lib/notifications/endpoint-service.ts`
- Modify: `lib/notifications/push-delivery-service.ts`
- Modify: `docs/integrations/environment.md`

**Interfaces:**
- Consumes: `posthog-node`, existing `POSTHOG_API_KEY`, `POSTHOG_HOST`, and `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED`.
- Produces:
  - `NotificationAnalyticsEventName`
  - `NotificationAnalyticsProperties`
  - `captureNotificationAnalytics(eventName, properties): void`
  - `assertSafeNotificationAnalyticsProperties(properties): void`

- [ ] **Step 1: Write failing telemetry privacy tests**

```ts
it("no-ops unless product analytics and PostHog are both configured", async () => {
  process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED = "false";
  process.env.POSTHOG_API_KEY = "phc_test";
  const { captureNotificationAnalytics } = await import(
    "@/lib/analytics/notification-analytics"
  );

  captureNotificationAnalytics("notification_endpoint_registered", {
    platform: "android",
    transport: "fcm",
  });

  expect(captureMock).not.toHaveBeenCalled();
});

it("rejects sensitive or unknown analytics properties", async () => {
  const { assertSafeNotificationAnalyticsProperties } = await import(
    "@/lib/analytics/notification-analytics"
  );

  expect(() =>
    assertSafeNotificationAnalyticsProperties({
      platform: "android",
      body: "medication changed",
    } as never),
  ).toThrow("UNSAFE_NOTIFICATION_ANALYTICS_PROPERTY");
});

it("captures only allow-listed operational fields", async () => {
  process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED = "true";
  process.env.POSTHOG_API_KEY = "phc_test";
  const { captureNotificationAnalytics } = await import(
    "@/lib/analytics/notification-analytics"
  );

  captureNotificationAnalytics("notification_provider_accepted", {
    platform: "android",
    transport: "fcm",
    category: "booking",
    priority: "time_sensitive",
    template_version: "1.0.0",
    latency_bucket: "100-499ms",
  });

  expect(captureMock).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "notification_provider_accepted",
      properties: expect.not.objectContaining({
        body: expect.anything(),
        title: expect.anything(),
        push_token: expect.anything(),
      }),
    }),
  );
});
```

- [ ] **Step 2: Run telemetry test and confirm RED**

```bash
pnpm vitest run tests/notifications/notification-analytics.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement a strict event/property allowlist**

Allowed events:

```ts
type NotificationAnalyticsEventName =
  | "notification_endpoint_registered"
  | "notification_endpoint_revoked"
  | "notification_preference_changed"
  | "notification_provider_accepted"
  | "notification_delivery_failed"
  | "notification_opened"
  | "notification_settings_opened";
```

Allowed property keys:

```text
platform
transport
category
priority
template_version
failure_class
latency_bucket
preview_mode
endpoint_status
```

Reject every property key outside that set. Do not include `distinctId` based on participant identity in this first slice; use a non-personal operational distinct ID such as `"notification-system"` until identity/analytics consent is separately reviewed.

Only initialize PostHog when both:
- `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true"`
- `POSTHOG_API_KEY` is non-empty.

Use `after()` for background flush as the existing LLM adapter does. Do not throw back into notification business logic if PostHog capture/flush fails.

- [ ] **Step 4: Instrument safe lifecycle points**

Capture:
- endpoint registered/revoked;
- provider accepted;
- delivery failed.

Do not capture notification title/body, endpoint address/hash, user ID, participant ID, entity ID, raw provider error, or free-form purpose.

- [ ] **Step 5: Run analytics + notification tests**

```bash
pnpm vitest run   tests/notifications/notification-analytics.test.ts   tests/notifications/notification-endpoints.test.ts   tests/notifications/push-delivery.test.ts
```

Expected: PASS.

- [ ] **Step 6: Update environment documentation**

Document:
- product analytics remains default false;
- notification telemetry additionally needs `POSTHOG_API_KEY`;
- `POSTHOG_HOST` follows the connected project region;
- notification telemetry contains operational classifications only;
- no participant identity/content/token fields are permitted.

- [ ] **Step 7: Commit Task 6**

```bash
git add   lib/analytics/notification-analytics.ts   lib/notifications/endpoint-service.ts   lib/notifications/push-delivery-service.ts   tests/notifications/notification-analytics.test.ts   docs/integrations/environment.md
git commit -m "feat(notifications): add privacy-safe PostHog telemetry"
```

---

### Task 7: Full verification, PostHog project wiring, and Vercel preview evidence

**Files:**
- Modify only if verification exposes a defect in files owned by Tasks 1-6.
- Create no new production feature beyond the approved first slice.
- Create/update documentation evidence only if the repository already has a matching preview/readiness evidence convention.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified branch head, draft pull request, Vercel preview evidence, PostHog project/dashboard wiring only after target-project resolution.

- [ ] **Step 1: Run the focused notification suite**

```bash
pnpm vitest run tests/notifications tests/security/notification-endpoint-ownership.test.ts tests/mobile-api-backbone.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run Prisma and migration checks**

```bash
pnpm prisma validate
pnpm prisma generate
pnpm ci:migration-order
pnpm ci:migration-integrity
```

Expected: PASS.

- [ ] **Step 3: Run lint/type checks without hiding pre-existing failures**

```bash
pnpm lint
pnpm type-check
```

Expected: report exact result. If repository-wide type-check/lint has a pre-existing failure, compare against the base SHA and prove whether the notification branch introduced it; do not weaken checks.

- [ ] **Step 4: Run build**

```bash
pnpm build
```

Expected: PASS, or document exact pre-existing blocker with base comparison.

- [ ] **Step 5: Re-run security/privacy targeted tests**

```bash
pnpm vitest run   tests/security/notification-endpoint-ownership.test.ts   tests/notifications/notification-analytics.test.ts   tests/notifications/notification-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify no sensitive values appear in source logging/analytics paths**

Run:

```bash
rg -n 'console\.(log|info|debug)|posthog\.capture|captureNotificationAnalytics'   lib/notifications lib/platform/push lib/analytics/notification-analytics.ts   app/api/notifications app/api/mobile/devices
```

Review every hit. There must be no log/capture of raw endpoint address/token, notification title/body, participant ID, NDIS data, support/health detail, precise location, safeguarding narrative, or Private Storage Blob content.

- [ ] **Step 7: Resolve the connected PostHog target before any PostHog write**

Using the connected PostHog app:
1. list/resolve the organisation and project;
2. confirm it is the MapAble product project;
3. inspect current notification-related event names/flags/dashboards;
4. do not create a duplicate event taxonomy.

If the connector cannot resolve the project or its required product guidance is unavailable, keep code instrumentation complete and report PostHog dashboard wiring as blocked; do not guess project IDs or create resources in an unconfirmed project.

- [ ] **Step 8: Create a PostHog operational dashboard only when the target project is confirmed**

Create a dashboard named:

`MapAble Push Notifications — Pilot`

Add insights using only the approved operational events:
- endpoint registrations by platform/transport;
- provider acceptance vs failure;
- failure class by transport;
- notification opens by category;
- preference changes.

No person-level cohorts, raw content, user identifiers, location, disability/health/support properties, or session replay targeting are part of this dashboard.

- [ ] **Step 9: Push the implementation branch and open a draft GitHub PR**

Use an isolated implementation branch derived from the approved spec/plan branch, for example:

`feat/mapable-push-notifications-foundation`

PR title:

`feat: add MapAble push notification foundation`

The PR body must state:
- external push transports remain disabled;
- no production credentials were added;
- migration is additive;
- current notification/email paths remain supported;
- focused tests and clean-DB migration evidence;
- PostHog event allowlist;
- remaining phases: FCM, APNs, Web Push, WNS, production worker/operations.

- [ ] **Step 10: Verify the Vercel preview deployment**

After GitHub creates the preview deployment, inspect the `mapableau-new` Vercel deployment for the PR head SHA.

Required evidence:
- deployment state is `READY`;
- build is tied to the expected branch/head SHA;
- no production target/promotion occurred;
- preview runtime logs show no notification endpoint token/body leakage;
- authenticated notification APIs return expected 401/403 when unauthenticated rather than data;
- current public site routes still load.

Do not set production environment variables or promote the deployment.

- [ ] **Step 11: Run an accessibility regression on changed user-visible surfaces**

If this slice changes no notification UI, run the existing notification/inbox/settings route accessibility smoke and document that no user-visible UI changed. If any endpoint/settings UI was touched to support this slice, run Playwright/axe plus keyboard and screen-reader checks appropriate to that exact flow.

At minimum:

```bash
pnpm test:a11y
```

Do not claim accessibility from automated checks alone; record manual AT verification as required before production rollout.

- [ ] **Step 12: Request fresh code review**

Request a reviewer focused on:
- cross-user endpoint authorization;
- cryptographic handling;
- migration reversibility/compatibility;
- idempotency/concurrency;
- analytics privacy;
- honest delivery-state language.

Resolve findings through the receiving-code-review workflow rather than blindly applying suggestions.

- [ ] **Step 13: Final verification before any completion claim**

Re-run:

```bash
pnpm vitest run tests/notifications tests/security/notification-endpoint-ownership.test.ts tests/mobile-api-backbone.test.ts
pnpm prisma validate
pnpm ci:migration-order
pnpm ci:migration-integrity
pnpm lint
pnpm type-check
pnpm build
```

Capture exact pass/fail output at the final head SHA. Do not merge, promote, or enable push flags.

- [ ] **Step 14: Final implementation report**

Report:
- branch and final SHA;
- PR number/URL;
- files changed;
- migration name;
- focused/full test results;
- Vercel preview URL/state;
- PostHog project/dashboard outcome;
- any pre-existing repository failures separately;
- all flags still off;
- no production changes performed;
- blockers for Phase 2 Android FCM.

---

## Self-Review

### Spec coverage

- Canonical notification source of truth: Tasks 1 and 4.
- Typed templates/privacy/deep-link allowlist: Task 1.
- Durable endpoint/delivery/outbox state: Task 2.
- Authenticated endpoint ownership and mobile compatibility: Task 3.
- Fail-closed feature flags and idempotent outbox: Task 4.
- Recording provider + honest `provider_accepted` semantics: Task 5.
- Privacy-minimised PostHog telemetry: Task 6.
- Vercel preview and no production promotion: Task 7.
- AusAlert/emergency boundary: Global Constraints and Task 1 priority schema.
- Private Storage Blob non-disclosure: Global Constraints plus Task 7 source review.
- Accessibility/non-AI fallback: preserved in-app path + Task 7 accessibility regression.
- No live FCM/APNs/WNS/Web Push sends: Global Constraints and every task.
- Lost/revoked/invalid endpoint behavior: Tasks 3 and 5.
- Migration proof: Tasks 2 and 7.

### Placeholder scan

The plan contains no implementation placeholders. Platform-provider phases after the first slice are intentionally excluded rather than left incomplete.

### Type consistency

The plan uses the same priority, sensitivity, preview, endpoint, outbox and delivery state names across contracts, Prisma, services, tests and analytics. `provider_accepted` is the only successful external-provider acceptance state in this slice.

### Review-focus test mapping

1. Duplicate event -> Task 4 idempotency tests.
2. Sensitive content -> Task 1 redaction tests.
3. Endpoint ownership -> Task 3 service + route security tests.
4. Revoked/invalid endpoint -> Task 5 selection/invalid-token tests.
5. Analytics leakage -> Task 6 strict allowlist tests.
