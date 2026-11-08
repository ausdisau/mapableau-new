# ADR — MapAbleID v0.3 identity authority

**Status:** Accepted for the read-only vertical slice  
**Date:** 9 November 2026 (Australia/Sydney)  
**Canonical repository:** https://github.com/ausdisau/MapAble

## Context

MapAble needs a participant-controlled identity dashboard (MapAbleID) with AD.iD as a proposed federation umbrella. Historical Neon inspection found Managed Better Auth configurations on MapAble (Sydney), AD.iD (US East), and AccessiBooks (Sydney), with zero Managed Auth users on MapAble and 19 legacy application users. The MapAble application codebase signs sessions with **NextAuth v4 (JWT strategy)** and already implements passkeys (SimpleWebAuthn), Twilio Verify MFA, step-up challenges, consent, and participant authority grants.

Neon Managed Better Auth does not currently expose the full application passkey/MFA plugin set required for MapAbleID. Running a second live issuer would risk dual sessions, ambiguous account linking, and lockouts.

## Decision

1. **Retain NextAuth (Auth.js v4) as the sole live MapAble session issuer for v0.3.**
2. Ship MapAbleID as a **flag-gated, read-only** dashboard (`MAPABLE_ID_DASHBOARD_ENABLED`, default `false`) and `GET /api/identity/me` over existing Prisma identity data.
3. Keep **AD.iD OIDC federation**, **Google Identity Platform MFA**, and **WebAuthn enrolment mutations via MapAbleID adapters** disabled until residency, recovery, and threat-model gates pass.
4. Do **not** migrate, merge, or email-link accounts; do **not** modify `neon_auth` tables; do **not** apply the proposed MapAbleID schema to production.
5. Keep identity reads on the existing **Australian (Sydney) Neon** application database. Do not adopt AD.iD US East as a production authority.

## Consequences

- Positive: no competing issuers; reuses passkeys/MFA/delegation already in production code paths; smallest testable slice.
- Trade-off: federation catalogue services remain `planned` until entitlements exist.
- Follow-up (NO-GO until approved): production migration apply, AD.iD cutover, MFA enforcement, account linking, WCAG conformance claims without disability-led testing.

## YubiKey / WebAuthn note

Server-verified WebAuthn already lives under `/api/passkeys`. The supplied YubiKey Minidriver MSI is a **Windows client OS driver** for smart-card use; it must not be installed in CI or treated as a substitute for MapAble’s authentication server. Hardware acceptance tests remain manual.

## Rollback

1. Set `MAPABLE_ID_DASHBOARD_ENABLED=false` (or unset).
2. Remove or hide `/dashboard/identity` nav (flag already hides it).
3. No database migration is applied in this slice — no schema rollback required.
4. Revert the feature branch / close the draft PR if needed.
