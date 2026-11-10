import assert from "node:assert/strict";
import test from "node:test";

import {
  STAGE1_BUTTON_LABEL,
  attemptIdentityLink,
  authorizeGenerateSessionTokenCall,
  buildVerifiedAdidSignInLink,
  createLinkCeremonyState,
  createMemoryHandoffStore,
  createMemoryLinkStore,
  mintHandoffTicket,
  redeemHandoffTicket,
  validateAuthorizationRequest,
  validateIdTokenClaims,
  verifyLinkCeremonyState,
  wixStageFlags,
} from "../src/index.ts";

function clearFlags() {
  delete process.env.ADID_WIX_PUBLIC_LINK_ENABLED;
  delete process.env.ADID_ACCOUNT_LINKING_ENABLED;
  delete process.env.ADID_WIX_SESSION_BRIDGE_ENABLED;
}

test("stage1: only allowlisted hosts produce AD.iD sign-in links", () => {
  const hosts = [{ hostname: "adid.example.com" }];
  assert.equal(
    buildVerifiedAdidSignInLink({
      approvedHosts: hosts,
      requestedHost: "evil.example",
    }).ok,
    false,
  );
  const ok = buildVerifiedAdidSignInLink({
    approvedHosts: hosts,
    requestedHost: "adid.example.com",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.href, "https://adid.example.com/sign-in");
    assert.equal(ok.openIn, "same-window");
  }
  assert.match(STAGE1_BUTTON_LABEL, /AD\.iD/);
});

test("stage1: tokens cannot be injected via redirect_url", () => {
  const r = buildVerifiedAdidSignInLink({
    approvedHosts: [{ hostname: "adid.example.com" }],
    requestedHost: "adid.example.com",
    afterSignInPath: "/dashboard?access_token=x",
  });
  assert.equal(r.ok, false);
});

test("stage2: linking refused when flag off or email-only", () => {
  clearFlags();
  const store = createMemoryLinkStore();
  assert.equal(
    attemptIdentityLink({
      clerk: {
        issuer: "https://clerk.example",
        subject: "user_1",
        sessionPresent: true,
      },
      wix: { memberId: "wix_1", sessionVerifiedByServer: true },
      matchMethod: "issuer_subject_and_member_id",
      store,
    }).reason,
    "ADID_ACCOUNT_LINKING_ENABLED is false",
  );

  process.env.ADID_ACCOUNT_LINKING_ENABLED = "true";
  assert.equal(
    attemptIdentityLink({
      clerk: {
        issuer: "https://clerk.example",
        subject: "user_1",
        sessionPresent: true,
      },
      wix: { memberId: "wix_1", sessionVerifiedByServer: true },
      matchMethod: "email_only",
      store,
    }).reason,
    "email_only_linking_forbidden",
  );
});

test("stage2: dual-proof link succeeds and ceremony state verifies", () => {
  clearFlags();
  process.env.ADID_ACCOUNT_LINKING_ENABLED = "true";
  const store = createMemoryLinkStore();
  const linked = attemptIdentityLink({
    clerk: {
      issuer: "https://clerk.example",
      subject: "user_1",
      sessionPresent: true,
    },
    wix: { memberId: "wix_1", sessionVerifiedByServer: true },
    matchMethod: "issuer_subject_and_member_id",
    store,
  });
  assert.equal(linked.ok, true);

  const now = Date.now();
  const state = createLinkCeremonyState("test-secret", {
    clerkSubject: "user_1",
    wixMemberId: "wix_1",
    expMs: now + 60_000,
  });
  const verified = verifyLinkCeremonyState("test-secret", state, now);
  assert.equal(verified.ok, true);
  assert.equal(
    verifyLinkCeremonyState("wrong", state, now).ok,
    false,
  );
});

test("stage3: handoff disabled by default; browser email mint forbidden", () => {
  clearFlags();
  assert.equal(wixStageFlags.sessionHandoffEnabled(), false);
  const links = createMemoryLinkStore();
  const handoffs = createMemoryHandoffStore();
  assert.equal(
    mintHandoffTicket({
      store: handoffs,
      links,
      clerkIssuer: "https://clerk.example",
      clerkSubject: "user_1",
      clerkSessionPresent: true,
    }).reason,
    "ADID_WIX_SESSION_BRIDGE_ENABLED is false",
  );

  process.env.ADID_WIX_SESSION_BRIDGE_ENABLED = "true";
  process.env.ADID_ACCOUNT_LINKING_ENABLED = "true";
  const linked = attemptIdentityLink({
    clerk: {
      issuer: "https://clerk.example",
      subject: "user_1",
      sessionPresent: true,
    },
    wix: { memberId: "wix_1", sessionVerifiedByServer: true },
    matchMethod: "issuer_subject_and_member_id",
    store: links,
  });
  assert.equal(linked.ok, true);

  assert.equal(
    mintHandoffTicket({
      store: handoffs,
      links,
      clerkIssuer: "https://clerk.example",
      clerkSubject: "user_1",
      clerkSessionPresent: true,
      browserSuppliedEmail: "person@example.com",
    }).reason,
    "browser_email_session_mint_forbidden",
  );

  const minted = mintHandoffTicket({
    store: handoffs,
    links,
    clerkIssuer: "https://clerk.example",
    clerkSubject: "user_1",
    clerkSessionPresent: true,
  });
  assert.equal(minted.ok, true);
  if (!minted.ok) return;

  const first = redeemHandoffTicket({
    store: handoffs,
    links,
    ticketId: minted.ticketId,
    secret: minted.secret,
  });
  assert.equal(first.ok, true);
  if (first.ok) {
    assert.equal(first.allowCreateMember, false);
    assert.equal(first.delivery, "server_post_body_only");
  }

  const replay = redeemHandoffTicket({
    store: handoffs,
    links,
    ticketId: minted.ticketId,
    secret: minted.secret,
  });
  assert.equal(replay.ok, false);
});

test("stage3: generateSessionToken guard blocks auto-create and browser email", () => {
  assert.equal(
    authorizeGenerateSessionTokenCall({
      handoffEnabled: true,
      emailSource: "browser",
      memberExists: true,
      allowCreateMember: false,
      ticketRedeemed: true,
    }).allowed,
    false,
  );
  assert.equal(
    authorizeGenerateSessionTokenCall({
      handoffEnabled: true,
      emailSource: "linked_member_directory",
      memberExists: false,
      allowCreateMember: false,
      ticketRedeemed: true,
    }).reason,
    "existing_wix_member_required_generateSessionToken_would_auto_create",
  );
  assert.equal(
    authorizeGenerateSessionTokenCall({
      handoffEnabled: true,
      emailSource: "linked_member_directory",
      memberExists: true,
      allowCreateMember: false,
      ticketRedeemed: true,
    }).allowed,
    true,
  );
});

test("OIDC RP: PKCE, state, nonce, redirect and audience enforced", () => {
  const rps = [
    {
      id: "mapable",
      clientId: "mapable-dev",
      redirectUris: ["https://mapable.com.au/oauth/callback"],
      audience: "mapable-api",
      scopes: ["openid", "profile"],
    },
  ];
  assert.equal(
    validateAuthorizationRequest(rps, {
      clientId: "mapable-dev",
      redirectUri: "https://evil.example/cb",
      responseType: "code",
      state: "abcdefghijklmnopqrstuvwxyz",
      codeChallenge: "a".repeat(43),
      codeChallengeMethod: "S256",
      nonce: "nonce-value",
      scope: "openid profile",
    }).ok,
    false,
  );
  assert.equal(
    validateAuthorizationRequest(rps, {
      clientId: "mapable-dev",
      redirectUri: "https://mapable.com.au/oauth/callback",
      responseType: "code",
      state: "abcdefghijklmnopqrstuvwxyz",
      codeChallenge: "a".repeat(43),
      codeChallengeMethod: "S256",
      nonce: "nonce-value",
      scope: "openid profile",
    }).ok,
    true,
  );

  const now = 1_700_000_000;
  assert.equal(
    validateIdTokenClaims(
      {
        iss: "https://clerk.example",
        sub: "user_1",
        aud: "mapable-api",
        exp: now + 100,
        nonce: "nonce-value",
      },
      {
        issuer: "https://clerk.example",
        audience: "mapable-api",
        nonce: "nonce-value",
        nowSeconds: now,
      },
    ).ok,
    true,
  );
  assert.equal(
    validateIdTokenClaims(
      {
        iss: "https://clerk.example",
        sub: "user_1",
        aud: "mapable-api",
        exp: now + 100,
        nonce: "wrong",
      },
      {
        issuer: "https://clerk.example",
        audience: "mapable-api",
        nonce: "nonce-value",
        nowSeconds: now,
      },
    ).reason,
    "nonce_mismatch",
  );
});
