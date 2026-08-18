# MapAble ↔ access-media SSO / deep-link contract

**Platform SoR:** `ausdisau/mapableau-new`  
**Media SoR:** `ausdisau/access-media`  
**Status:** Contract v0.1 (deep links first; SSO later)

## Principles

1. MapAble does **not** host DisabilityFour+ or AccessiBooks catalogues.
2. Independence Suite and web hub may **deep-link** to media hosts with public URLs.
3. Authenticated cross-app access requires an explicit consent scope and token
   exchange — not embedding media session cookies in MapAble.

## Deep links (shipped)

| Client | Env var | Target |
| --- | --- | --- |
| `apps/independence` | `EXPO_PUBLIC_ACCESSIBOOKS_URL` | `apps/accessibooks` origin |
| `apps/independence` | `EXPO_PUBLIC_DISABILITYFOUR_URL` | `apps/disabilityfour` origin |

Implementation: `apps/independence/src/runtime/mediaDeepLink.ts`.

Suggested paths (media apps should honour or 302):

- AccessiBooks continue: `{ACCESSIBOOKS}/`
- DisabilityFour browse: `{DISABILITYFOUR}/browse`

## SSO (planned)

| Scope | Purpose | Owner approval |
| --- | --- | --- |
| `media:read_profile` | Display name / accessibility prefs for player UI | Participant |
| `media:library_read` | Continue-listening state | Participant |
| `media:purchase` | Paid tier (DisabilityFour+/AccessiBooks) | Participant + billing |

Flow sketch:

1. User is signed into MapAble (next-auth / Keycloak).
2. User taps “Open AccessiBooks” → MapAble authorization endpoint issues a
   short-lived audience-bound token for `access-media`.
3. Media app validates token, creates local session, never receives MapAble
   refresh tokens.

Do **not** implement SSO until both SoRs have reviewed threat model and consent UX.

## CORS / Expo web

Native apps are not CORS-bound. Expo web on a different origin needs an approved
proxy or CORS policy before live MapAble API search works there
(see `docs/amalgamation/INDEPENDENCE_SUITE_API.md`).
