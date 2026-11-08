# ACS Stage 0 — reviewable Stage 1 diff proposal

**Status:** design only. **Not authorised to implement or merge.**  
**Preview waiver:** W-ACS-1 (not issued).  
**SoT rule:** deepen [`ConsentRecord`](../../../lib/consent/consent-service.ts); never add a second consent table.

This proposal is the reviewable increment for a future Stage 1 PR after human envelope signature and W-ACS-1.

## Recommended shape

1. Promote `verifyPurposeConsent` out of Navigator into `lib/consent/protected-access.ts` as the required PEP for **all** AI/tool/private retrieval.
2. Leave boolean `checkConsent` for existing booking/share call sites until those sites are migrated (list below).
3. Protected-path rules: exact `purpose`, required recipient, required non-empty `dataScope` (no `*` on AI paths), `sourceAction` allowlist, live Stop, participant/tenant bind. Recheck on every tool call and after retries.
4. Durable Stop: additive DB row (not Redis, not Temporal history). Process flag becomes a cache of that row. Companion device-local Stop remains UX, not server SoT.
5. L2 capability manifest type, server-held.
6. AURA fingerprint includes participant, tenant, and policy/consent revision. Memory cannot APPROVE.
7. **Non-diff:** no RAG, no Temporal worker hosting, no authority-writer merge, no `ConsentRecord.tenantId` migration in Stage 0. Stage 1 may add a tenant bind without a second ledger under W-ACS-1.

## Proposed signatures (Stage 1, not in this PR)

```ts
// lib/consent/protected-access.ts
export type ProtectedAccessInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  scope: ConsentScope;
  purpose: string;
  recipient: { userId: string } | { organisationId: string };
  requestedFields: string[]; // required, non-empty
  action: string;
  consentRevision?: string;
  now?: Date;
};

export type ProtectedAccessResult =
  | { ok: true; consentRecordId: string; consentReceiptId: string | null }
  | {
      ok: false;
      reason:
        | "consent_missing"
        | "consent_expired"
        | "consent_withdrawn"
        | "consent_superseded"
        | "purpose_mismatch"
        | "fields_insufficient"
        | "action_not_permitted"
        | "recipient_required"
        | "recipient_mismatch"
        | "tenant_mismatch"
        | "stop_active"
        | "delegation_invalid"
        | "capability_mismatch";
    };

export async function assertProtectedAccess(
  input: ProtectedAccessInput,
): Promise<ProtectedAccessResult>;
```

Navigator `verifyPurposeConsent` becomes a thin wrapper that **must not** treat empty `dataScope` as unrestricted.

```ts
// lib/programmes/aura/durable-stop.ts (Stage 1)
export async function setProgrammeStop(input: {
  participantId: string;
  tenantId: string;
  programme: "aura" | "acs";
  actorUserId: string;
  reason: string;
}): Promise<void>;

export async function isProgrammeStopped(input: {
  participantId: string;
  tenantId: string;
  programme: "aura" | "acs";
}): Promise<boolean>;
```

Process-local `programmeAuraStopped` may cache the durable row for the current isolate only; a miss must read the DB. Redis may fan out a cache-bust, never store the grant.

```ts
// lib/ai/platform/capabilities/acs-manifest.ts (Stage 1 types only)
export type AcsCapabilityManifestV1 = {
  manifestId: string;
  revision: string;
  actorUserId: string;
  participantId: string;
  tenantId: string;
  allowedTool: string;
  purpose: string;
  dataFields: string[];
  costCeilingMinor?: number;
  contactCeiling: number;
  scheduleWindow?: { start: string; end: string };
  geoDeviceBounds?: string;
  consentRecordId: string;
  consentRevision: string;
  expiresAt: string;
  maxRetries: number;
  reversible: true;
  auditCorrelationId: string;
  fallback: "participant_review" | "named_human" | "non_ai";
  exclusions: string[]; // e.g. "contact.family"
};
```

Client-supplied role, tenant, or ceiling is ignored.

## AURA memory (C5)

[`fingerprintToolCall`](../../../lib/aura-harness/fingerprint.ts) today hashes `toolName` + payload. Stage 1 must include `participantId`, `tenantId`, and `consentRevision` (or policy version). `evaluateToolAction` must call `assertProtectedAccess` **after** any memory hit and must not return APPROVE from memory alone.

## Durable Stop schema sketch (not applied)

Additive only, under W-ACS-1:

```text
model ProgrammeStop {
  id             String   @id @default(cuid())
  participantId  String
  tenantId       String
  programme      String
  active         Boolean  @default(true)
  reason         String
  actorUserId    String
  createdAt      DateTime @default(now())
  releasedAt     DateTime?
  @@unique([participantId, tenantId, programme])
}
```

No consent columns. Redis/Temporal are not this table.

## Call-site migration list (`checkConsent` remains until migrated)

Protected/AI paths must move to `assertProtectedAccess` in Stage 1. Booking/share paths may keep `checkConsent` until a later hardening PR.

| Caller                               | Path                                                      | Stage 1 action                                                   |
| ------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------- |
| PRMS check API                       | `app/api/prms/consent/check/route.ts`                     | Keep boolean **or** expose purpose params; do not silently widen |
| Care request GET                     | `app/api/care/requests/[careRequestId]/route.ts`          | Stay on `checkConsent` until care-share purpose UX exists        |
| Communication passport               | `app/api/communication-passport/acknowledge/route.ts`     | Stay                                                             |
| CareOS delegate                      | `lib/intelligence/careos/authority/delegate-authority.ts` | **Move** if used for AI/tool reads                               |
| CareOS consent wrapper               | `lib/intelligence/careos/consent/consent-service.ts`      | **Move** for tool execution                                      |
| Micro-consent                        | `lib/consent/micro-consent-service.ts`                    | Keep mapping; protected AI must not use empty fields             |
| `requireConsent`                     | `lib/consent/require-consent.ts`                          | Add protected overload; do not break share flows                 |
| Engagement                           | `lib/engagement/engagement-access.ts`                     | Stay until engagement purpose UX                                 |
| Care request service                 | `lib/care/care-request-service.ts`                        | Stay                                                             |
| ADTUnis adapter                      | `lib/adtunis/consent-adapter.ts`                          | Stay                                                             |
| Transport prefill / policy / booking | `lib/transport/*`                                         | Stay (share scopes)                                              |
| Provider care booking page           | `app/provider/(console)/care/bookings/[id]/page.tsx`      | Stay                                                             |
| Support profile                      | `lib/support/profile/support-profile-service.ts`          | Stay unless AI retrieval                                         |
| Research co-design / separation      | `lib/research/*`                                          | Stay (orthogonal research lane)                                  |
| PRMS participant access              | `lib/prms/participant-access.ts`                          | Stay                                                             |
| Navigator                            | `lib/ai/navigator/consent-gate.ts`                        | Wrap promoted helper; fail closed on empty dataScope             |
| AURA wrap-tools                      | `lib/aura-harness/wrap-tools.ts`                          | **Must** call protected access + Stop                            |
| Action kernel                        | `lib/ai/platform/actions/policy.ts`                       | Join ConsentRecord; stop trusting caller scope strings for ACS   |

## W-ACS-1 preview (not issued)

| Field        | Proposed value                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID           | W-ACS-1                                                                                                                                                             |
| Domain       | Deterministic trust: protected-access PEP + durable Stop                                                                                                            |
| Paths        | `lib/consent/protected-access.ts`, `lib/programmes/aura/durable-stop.ts`, `lib/aura-harness/fingerprint.ts` / `evaluate-action.ts`, additive `ProgrammeStop`, tests |
| Schema       | Additive `ProgrammeStop` only; **no** second consent table                                                                                                          |
| Flags        | Default false                                                                                                                                                       |
| Still frozen | RAG, Temporal enable, physical/clinical, model-written grants                                                                                                       |
| Prerequisite | Human signature of the L2 envelope in the evidence map                                                                                                              |

## Explicit non-diff

- MapAble PR #22 ParticipantRAG/ProviderRAG
- Temporal production worker / `@temporalio` dependency
- Merging dual authority writers
- `ConsentRecord.tenantId` in this Stage 0 PR
- Production flag enablement
- Live data or production migrations
