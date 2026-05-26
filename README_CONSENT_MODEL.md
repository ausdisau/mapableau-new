# Consent model (Phase 1)

## Scopes

Dot-notation in API (`profile.read`) maps to Prisma enums (`profile_read`). See `lib/consent/scope-map.ts`.

## Service functions

- `grantConsent` — creates record + audit event
- `revokeConsent` — immediate status change + audit event
- `checkConsent` — used before sharing accessibility with organisations
- `listConsentsForParticipant`

## Routes

- `/dashboard/consent`, `/dashboard/consent/new`, `/dashboard/consent/[id]`
- `/admin/consents`
- `POST /api/consents`, `POST /api/consents/:id/revoke`

## Care & support coordinator scopes

When a participant approves coordinator access (`SupportCoordinatorRelationship`), scopes in `scopesJson` gate the super-app. If empty, defaults apply (see `lib/support-coordinator/consent-gate.ts`):

- `care_support.assessment_share` — read assessment rollup / triage
- `care_support.referral_manage` — list and update referrals, coordination timeline
- `care_support.assessment_detail` — optional full `sectionsJson` (otherwise rollup only)

Participant UI: `/support-coordinator/access`. See `docs/care-support-super-app.md`.

## Phase 2

Consent templates, expiry automation, and support coordinator delegated grants.
