import assert from "node:assert/strict";
import test from "node:test";
import { hasClerkTenant } from "../lib/clerk-config.ts";
import { serviceFor, serviceEntry } from "../lib/service-directory.ts";
import action from "../integrations/auth0/post-login.cjs";

test("service continuations use only the four registered destinations", () => {
  for (const id of ["ausdis", "mapable", "disapedia", "accessibooks"])
    assert.ok(serviceEntry(serviceFor(id).id).startsWith("https://"));
  assert.equal(serviceFor("https://example.test/"), undefined);
  assert.equal(hasClerkTenant({}), false);
});
test("the broker marks only the configured OIDC connection and scoped applications", async () => {
  const allowed = [],
    denied = [];
  const api = {
    idToken: { setCustomClaim: (...args) => allowed.push(args) },
    access: { deny: (reason) => denied.push(reason) },
  };
  const event = {
    client: { client_id: "reader" },
    secrets: {
      ADID_CLIENT_IDS: "reader,mapable",
      ADID_CLERK_CONNECTION: "clerk-pilot",
    },
    connection: { strategy: "oidc", name: "clerk-pilot" },
  };
  await action.onExecutePostLogin(event, api);
  assert.deepEqual(allowed, [
    ["https://www.ausdis.com.au/adid/connection", "clerk-pilot"],
  ]);
  await action.onExecutePostLogin(
    { ...event, connection: { strategy: "auth0", name: "database" } },
    api,
  );
  await action.onExecutePostLogin(
    { ...event, client: { client_id: "another-app" } },
    api,
  );
  assert.equal(allowed.length, 1);
  assert.equal(denied.length, 1);
});
