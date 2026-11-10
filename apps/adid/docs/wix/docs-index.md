# Wix documentation index (AD.iD integration)

Canonical index used for this work: **Wix Unified API Reference**

- About the Unified API Reference: https://dev.wix.com/docs/api-reference/articles/platform-overview/about-the-unified-api-reference
- API Reference portal: https://dev.wix.com/docs/api-reference.md

## Members & Contacts

- Velo `wix-members-backend` Authentication: https://dev.wix.com/docs/velo/apis/wix-members-backend
- `generateSessionToken(email)`: https://dev.wix.com/docs/velo/api-reference/wix-members-backend/authentication/generate-session-token  
  **Critical:** creates a new member with a random password if the email is unknown. AD.iD therefore forbids browser email and requires an existing linked member before any future call.
- Frontend session apply: `wix-members-frontend` `authentication.applySessionToken(sessionToken)` (paired with backend login / generateSessionToken examples in the same reference family).

## Headless Authentication

- Headless Authentication introduction: https://dev.wix.com/docs/api-reference/business-management/headless/authentication/introduction
- Sign-On (credential-less; may create/update members): https://dev.wix.com/docs/api-reference/business-management/headless/authentication/sign-on  
  **Not assumed** for the existing Wix Editor site at ausdis.com.au without separate eligibility confirmation.
- Headless OAuth / `getMemberTokensForExternalLogin`: administrative, API-key based — server only.

## Secrets

- About the Secrets Manager: https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/secrets-manager/about-the-secrets-manager  
  Store API keys / OAuth material by name; retrieve via Secrets API. Never commit or chat secrets.

## Accessibility

- Operator Wix page checklist (repo asset): `apps/web/attached_assets/mapable_wix_ready_package_…/wix/accessibility/wix_checklist.txt`
- AD.iD portal: keyboard, skip link, screen reader landmarks, zoom/reflow, reduced motion, accessible MFA/passkey recovery via Clerk UserProfile (`/account`).

## Preservation constraints

Do not alter Wix production bookings, memberships, subscriptions, NextAuth, MediaWiki editor identities, CripSquare roles, or AccessiBooks entitlements from this package. Stages 2–3 stay flag-gated and isolated.
