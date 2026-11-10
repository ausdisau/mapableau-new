# Wix Editor/Velo integration — external AD.iD identity handoff

**Verified Wix site (2026-11-10):** Australian Disability Ltd, https://www.ausdis.com.au/, Wix Editor, Velo enabled and Wix Members Area installed.

**Docs index:** see [`docs/wix/docs-index.md`](./wix/docs-index.md) (Wix Unified API Reference and Members / Headless / Secrets / Accessibility).

**Package:** `@ausdis/adid-wix-integration` under `packages/wix-integration` — three separately gated stages. Clerk remains the sole AD.iD authentication provider.

**Do not** substitute a Clerk JWT for a Wix Members session or pass Clerk/Wix tokens through URL parameters. Wix Member sessions are issued by Wix. The Wix Headless "bring your own identity provider" / Sign-On flow is documented for headless sites and cannot be assumed to work unchanged with this Editor installation. Custom OIDC support in Wix depends on site/product eligibility. Confirm the supported integration path with Wix before any native member federation.

## Stage 1: verified public AD.iD sign-in link

Flag: `ADID_WIX_PUBLIC_LINK_ENABLED` (optional; link builders still require an allowlisted host).

Add a clearly labelled **Sign in to AD.iD** control pointing to the *verified* AD.iD `/sign-in` URL. Separate from Wix Member login. Same window unless the user explicitly requests a new tab. Do not embed an untrusted sign-in form or iframe.

Conceptual Velo (also in `packages/wix-integration/velo-snippets/stage1-adid-signin.js`):

```js
import wixLocation from "wix-location";
$w.onReady(() => {
  $w("#adidSignInButton").onClick(() => {
    wixLocation.to("https://<approved-adid-host>/sign-in");
  });
});
```

**Replace the placeholder** only after the deploy host is verified; never launch with it.

## Stage 2: identity-linking proof-of-concept (gated)

Flag: `ADID_ACCOUNT_LINKING_ENABLED` — **must remain `false`** until dual-proof ceremony is operator-approved.

1. Require authenticated Clerk session **and** server-verified Wix Members session.
2. Match on Clerk issuer+subject and Wix `memberId` — **never email-only**.
3. CSRF-bound short-lived ceremony state; audit + revoke.
4. Isolated in-memory store in the package for sandbox tests — no neon_auth / production member DB writes.
5. Preserve Wix bookings, memberships, subscriptions and other apps' entitlements independently.

## Stage 3: native Wix session handoff (disabled by default)

Flag: `ADID_WIX_SESSION_BRIDGE_ENABLED` — **must remain `false`**.

Intended ceremony (isolated test only):

1. One-time, replay-resistant ticket minted after an active Stage-2 link + live Clerk session.
2. Ticket secret delivered via POST body / secure channel — **never URL or localStorage**.
3. Redeem once; second redeem fails.
4. Only then may a reviewed Wix backend call `authentication.generateSessionToken` for a **directory-resolved existing member** email. Wix docs state unknown emails **auto-create** members — AD.iD forbids that path (`allowCreateMember: false`).
5. Page code applies the token with `authentication.applySessionToken` from `wix-members-frontend`.
6. Secrets live in Wix Secrets Manager / server env only.
7. Privacy approval, accessibility (keyboard / AAC / SR / MFA recovery), and rollback required before any live enablement.

Snippet `velo-snippets/stage3-handoff-DISABLED.js` throws on purpose so it cannot be pasted live.

## Relying parties (separate work)

MapAble, AccessiBooks, CripSquare and Disapedia each need their own OAuth/OIDC client PR: callback URI, trusted issuer, JWK signature, `aud`, `exp`, `nonce`, state+PKCE, consent and independent local authorization. Do not assert cross-app SSO until each client works. Package helpers: `validateAuthorizationRequest` / `validateIdTokenClaims`.

## Rollback

- Keep Stage 2/3 flags false; revoke Stage-2 links; rotate handoff secrets.
- Remove Stage-1 Wix button or point it only at the approved host.
- Do not modify Wix production domain, bookings, or member data from AD.iD.

Wix site's current content, members, domain and sessions are unchanged by this PR.
