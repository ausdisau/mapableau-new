import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { hasClerkTenant } from "../lib/clerk-config.ts";
import { checkIssuer } from "../scripts/check-clerk-issuer.mjs";

const host = "clerk.tenant.example";
const origin = "https://" + host;
const pub = (mode) =>
  "pk_" + mode + "_" + Buffer.from(host + "$").toString("base64url");
const env = {
  CLERK_FRONTEND_API_URL: origin,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pub("live"),
};
const metadata = {
  issuer: origin,
  authorization_endpoint: origin + "/oauth/authorize",
  token_endpoint: origin + "/oauth/token",
  jwks_uri: origin + "/.well-known/jwks.json",
  response_types_supported: ["code"],
};
const key = {
  ...generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey.export({
    format: "jwk",
  }),
  kid: "fixture",
  use: "sig",
};

function fixtureFetch(discovery = metadata, keys = [key]) {
  return async (url, options) => {
    assert.equal(options.redirect, "error");
    if (url === origin + "/.well-known/openid-configuration")
      return Response.json(discovery);
    assert.equal(url, metadata.jwks_uri);
    return Response.json({ keys });
  };
}

test("a public key alone keeps authentication unavailable", () => {
  assert.equal(hasClerkTenant(env), false);
});

test("the runtime requires one host and the same production or development key mode", () => {
  const settings = { ...env, CLERK_SECRET_KEY: "sk_live_fixture" };
  assert.equal(hasClerkTenant(settings), true);
  assert.equal(
    hasClerkTenant({ ...settings, CLERK_FRONTEND_API_URL: origin + "/" }),
    true,
  );
  for (const configured of [
    "",
    "https://elsewhere.example",
    "http://" + host,
    origin + "/path",
  ])
    assert.equal(
      hasClerkTenant({ ...settings, CLERK_FRONTEND_API_URL: configured }),
      false,
    );
  assert.equal(
    hasClerkTenant({ ...env, CLERK_SECRET_KEY: "sk_test_fixture" }),
    false,
  );
  assert.equal(
    hasClerkTenant({
      ...env,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pub("test"),
      CLERK_SECRET_KEY: "sk_test_fixture",
    }),
    true,
  );
});

test("public readiness follows discovery and verifies a usable signing key without a secret", async () => {
  assert.equal(await checkIssuer(env, fixtureFetch()), origin);
  await assert.rejects(
    checkIssuer(
      env,
      fixtureFetch({ ...metadata, issuer: "https://other.example" }),
    ),
    /issuer must match/,
  );
  await assert.rejects(
    checkIssuer(
      env,
      fixtureFetch({ ...metadata, token_endpoint: "http://invalid.example" }),
    ),
    /HTTPS endpoints/,
  );
  await assert.rejects(
    checkIssuer(
      env,
      fixtureFetch({ ...metadata, response_types_supported: ["token"] }),
    ),
    /authorization-code/,
  );
  await assert.rejects(
    checkIssuer(env, fixtureFetch(metadata, [{ ...key, use: "enc" }])),
    /no usable public key/,
  );
});

test("a wrong tenant fails before discovery and a failed dependency gives an operational reason", async () => {
  await assert.rejects(
    checkIssuer(
      { ...env, CLERK_FRONTEND_API_URL: "https://elsewhere.example" },
      () => assert.fail("no request expected"),
    ),
    /publishable key/,
  );
  await assert.rejects(
    checkIssuer(env, async () => {
      throw new Error("DNS failure");
    }),
    /Check DNS and TLS/,
  );
  await assert.rejects(
    checkIssuer(env, async () => new Response("", { status: 503 })),
    /HTTP 503/,
  );
});
