# Wave 9 — Access Passport

Status: Wave 9. Functional-language summary of participant preferences.

> The access passport is a **functional** view: "prefers written
> communication", "needs step-free entry", "requires quiet room before a
> meeting". It is not, and must never be, a diagnosis, disability status
> statement or medical record.

## What it is

A read-only, participant-controlled summary compiled from
`ParticipantDataPackage` rows classified as `access_preferences` plus any
`PortableClaim` rows the participant has explicitly promoted. Nothing enters
the passport without the participant choosing it.

## Emergency access

`EmergencyAccessRequest` allows a first-responder or emergency contact to
request time-bounded access to a narrow subset of the passport (e.g. mobility
notes, communication preferences, allergies where the participant opted in).
Every request is human-reviewed. AI cannot approve.

## Prohibited claims

The `PortableClaim` layer refuses claims that make sensitive statements
about diagnosis, NDIS eligibility, medical treatment, or disability status.
See `lib/access-passport/claims.ts`.

## Files

- `lib/access-passport/profile.ts`
- `lib/access-passport/claims.ts`
- `lib/access-passport/presentation.ts`
- `lib/access-passport/emergency.ts`
