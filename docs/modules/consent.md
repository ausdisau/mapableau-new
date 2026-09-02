# Consent model (Phase 1)

## Scopes

Dot-notation in API (`profile.read`) maps to Prisma enums (`profile_read`). See `lib/consent/scope-map.ts`.

## Service functions

- `grantConsent` — creates record + audit event + consent receipt + purpose-bound disclosure receipt
- `revokeConsent` — immediate status change + audit event + consent receipt + revocation disclosure receipt; invalidates passport projection cache
- `checkConsent` — used before sharing accessibility with organisations
- `listConsentsForParticipant`

## Personal Access Passport disclosure controls

Passport-specific hardening lives in `lib/passport/`:

| Module | Role |
|--------|------|
| `disclosure-policy.ts` | Maps consent scopes → `ACCESS_FIELD_CATEGORIES`; strips employer-forbidden keys and categories |
| `projection-cache.ts` | In-process passport projection cache with sub-60s revocation SLA (`REVOCATION_PROPAGATION_SLA_MS`) |
| `compatibility-projection.ts` | Projects passport requirements vs Access Graph capabilities with explicit met/unmet/uncertain gaps |
| `delegate-scope-validation.ts` | Ensures delegate invitations cannot exceed participant-granted consent scopes |

### Grant flow

1. Participant grants consent via `grantConsent`.
2. `createConsentReceipt` records the grant in the participant consent timeline.
3. `fieldCategoriesForConsentScope` resolves which field categories the scope permits.
4. `filterFieldCategoriesForRecipient` removes forbidden categories for organisation (employer) recipients.
5. `recordDisclosureReceipt` writes a Trust Fabric access receipt (purpose, categories, recipient org, consent link).

### Revoke flow

1. Participant revokes via `revokeConsent`.
2. `invalidatePassportProjectionCache` clears cached passport projections for that participant immediately.
3. Consent and disclosure receipts are recorded with `action: "revoked"` / `purpose: "revoked:…"`.
4. Active sessions must not serve stale projections beyond `REVOCATION_PROPAGATION_SLA_MS` (60 seconds).

### Employer disclosure rules

Organisation recipients (`recipientType: "organisation"`) must never receive:

- Passport payload keys: `diagnosis`, `medicalHistory`, `clinicalNotes`, `ndisPlanDetails`, etc. (see `EMPLOYER_FORBIDDEN_PASSPORT_KEYS`)
- Field categories: `other_support_profile`, `billing_summary`

Use `filterPassportPayloadForRecipient` before serialising passport data for employer-facing APIs.

### Delegate scope rules

Delegate invitations (`lib/delegation/delegate-invitation-service.ts`) call `validateDelegateConsentScopes` at invite and accept time. Proposed scopes must:

- Be in `DELEGATABLE_CONSENT_SCOPES` (billing, location tracking, and clinical scopes are non-delegatable)
- Match an **active** `ConsentRecord` the participant has already granted

## Routes

- `/dashboard/consent`, `/dashboard/consent/new`, `/dashboard/consent/[id]`
- `/admin/consents`
- `POST /api/consents`, `POST /api/consents/:id/revoke`

## Phase 2

Consent templates, expiry automation, and support coordinator delegated grants.
