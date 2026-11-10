import assert from "node:assert/strict";
import test from "node:test";

import {
  accountLinkAttemptAllowed,
  safeRedirectTarget,
  urlContainsCredentialLeak,
  validateOidcClaims,
} from "../lib/security.ts";
import { adidFlags } from "../lib/feature-flags.ts";

test("open redirects are rejected", () => {
  assert.equal(safeRedirectTarget("https://evil.example/phish"), null);
  assert.equal(safeRedirectTarget("//evil.example"), null);
  assert.equal(safeRedirectTarget("javascript:alert(1)"), null);
  assert.equal(safeRedirectTarget("/dashboard"), "/dashboard");
  assert.equal(safeRedirectTarget("/account"), "/account");
  assert.equal(safeRedirectTarget("/sign-in"), "/sign-in");
  assert.equal(safeRedirectTarget("https://mapable.com.au/"), "https://mapable.com.au/");
});

test("credential leaks in URL are detected", () => {
  assert.equal(urlContainsCredentialLeak("https://adid.local/callback?code=abc"), false);
  assert.equal(
    urlContainsCredentialLeak("https://adid.local/x?access_token=secret"),
    true,
  );
  assert.equal(urlContainsCredentialLeak("https://adid.local/#id_token=x"), true);
});

test("OIDC claims require issuer, audience and unexpired exp", () => {
  const now = 1_700_000_000;
  assert.deepEqual(
    validateOidcClaims(
      {
        iss: "https://clerk.example",
        sub: "user_1",
        aud: "adid-portal",
        exp: now + 3600,
      },
      { issuer: "https://clerk.example", audience: "adid-portal", nowSeconds: now },
    ),
    { ok: true },
  );
  assert.equal(
    validateOidcClaims(
      { iss: "https://other", sub: "user_1", aud: "adid-portal", exp: now + 3600 },
      { issuer: "https://clerk.example", audience: "adid-portal", nowSeconds: now },
    ).ok,
    false,
  );
  assert.equal(
    validateOidcClaims(
      {
        iss: "https://clerk.example",
        sub: "user_1",
        aud: "wrong",
        exp: now + 3600,
      },
      { issuer: "https://clerk.example", audience: "adid-portal", nowSeconds: now },
    ).reason,
    "audience_mismatch",
  );
  assert.equal(
    validateOidcClaims(
      {
        iss: "https://clerk.example",
        sub: "user_1",
        aud: "adid-portal",
        exp: now - 10,
      },
      { issuer: "https://clerk.example", audience: "adid-portal", nowSeconds: now },
    ).reason,
    "expired",
  );
});

test("invalid account-link attempts are refused", () => {
  assert.deepEqual(
    accountLinkAttemptAllowed({
      linkingFlagEnabled: false,
      proofOfBothAccounts: true,
      matchMethod: "issuer_subject",
    }),
    { allowed: false, reason: "ADID_ACCOUNT_LINKING_ENABLED is false" },
  );
  assert.equal(
    accountLinkAttemptAllowed({
      linkingFlagEnabled: true,
      proofOfBothAccounts: true,
      matchMethod: "email_only",
    }).allowed,
    false,
  );
});

test("federation and linking flags default false", () => {
  delete process.env.ADID_ACCOUNT_LINKING_ENABLED;
  delete process.env.ADID_WIX_SESSION_BRIDGE_ENABLED;
  delete process.env.ADID_WIX_PUBLIC_LINK_ENABLED;
  delete process.env.ADID_CROSS_APP_FEDERATION_ENABLED;
  delete process.env.ADID_DIRECTORY_ENABLED;
  delete process.env.ADID_NEON_DIRECTORY_ENABLED;
  assert.equal(adidFlags.accountLinkingEnabled(), false);
  assert.equal(adidFlags.wixSessionBridgeEnabled(), false);
  assert.equal(adidFlags.wixPublicLinkEnabled(), false);
  assert.equal(adidFlags.crossAppFederationEnabled(), false);
  assert.equal(adidFlags.directoryEnabled(), false);
});
