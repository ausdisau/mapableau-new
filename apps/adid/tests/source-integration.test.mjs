import assert from "node:assert/strict";
import { test } from "node:test";
import { clerkEntryDestination } from "../lib/legacy-entry.ts";
import {
  reviewerServices,
  selectedServices,
  reviewRequest,
  submitRequests,
} from "../lib/access-requests.ts";

test("the uploaded portal's login and signup bookmarks resolve to distinct Clerk routes", () => {
  assert.equal(
    clerkEntryDestination("https://id.example/auth/login").href,
    "https://id.example/sign-in",
  );
  assert.equal(
    clerkEntryDestination(
      "https://id.example/api/auth/login?screen_hint=signup&service=mapable&returnTo=x",
    ).href,
    "https://id.example/sign-up?service=mapable",
  );
  assert.equal(
    clerkEntryDestination("https://id.example/auth/login?service=unknown")
      .search,
    "",
  );
});
test("service requests and reviewer assignments use only registered service IDs", () => {
  assert.deepEqual(selectedServices(["mapable", "mapable", "custom", null]), [
    "mapable",
  ]);
  assert.deepEqual(
    reviewerServices("reader", '{"reader":["accessibooks","unknown"]}'),
    ["accessibooks"],
  );
  assert.deepEqual(reviewerServices("reader", '{"someone":["mapable"]}'), []);
  assert.deepEqual(reviewerServices("reader", "broken"), []);
});
test("a request cannot grant membership or apply a decision from an unrecognised action", async () => {
  const who = { issuer: "https://clerk.example", subject: "fixture" };
  const neverWrite = () => assert.fail("No database operation expected");
  await assert.rejects(submitRequests(neverWrite, who, ["unknown"]), /Choose/);
  assert.equal(
    await reviewRequest(neverWrite, who, ["mapable"], "wrong-id", "closed"),
    false,
  );
  assert.equal(
    await reviewRequest(
      neverWrite,
      who,
      ["mapable"],
      "aa64db04-555d-44b8-88e8-1bb821e531c2",
      "grant-admin",
    ),
    false,
  );
});
