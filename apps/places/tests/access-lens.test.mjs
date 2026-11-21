import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESS_CHECKS,
  DEFAULT_ACCESS_CHECKS,
  evaluatePlaceEvidence,
  makeCommunityReadiness,
  makeVenueQuestionsDraft,
} from "../src/access-lens.ts";

const place = {
  id: "demo:place",
  name: "Example Community Library",
  suburb: "Sydney",
  category: "Library",
  description: "A test fixture, not a certified venue.",
  source: "illustrative",
  sourceLabel: "Example operator page",
  sourceReviewedAt: "2026-10-27",
  sourceUrl: "https://example.org/access",
  stepFree: { status: "documented", detail: "The operator describes a step-free front entrance." },
  accessibleToilet: { status: "conditional", detail: "Toilet access may depend on exhibition hours." },
  caution: "Confirm current conditions.",
};

const everyCheck = {
  stepFree: true,
  accessibleToilet: true,
  communication: true,
  sensory: true,
  transport: true,
};

test("default evidence lens preserves separate feature status and provenance", () => {
  const result = evaluatePlaceEvidence(place, DEFAULT_ACCESS_CHECKS);
  assert.equal(result.length, 2);
  assert.equal(result[0].finding, "source-described");
  assert.equal(result[1].finding, "conditional");
  assert.match(result[0].evidence, /without an independent suitability guarantee/);
  assert.match(result[1].evidence, /conditions or limitations/);
  assert.match(result[0].provenance, /Example operator page/);
  assert.match(result[0].provenance, /2026-10-27/);
  assert.doesNotMatch(JSON.stringify(result), /accredited|certified accessible|overall score/i);
});

test("missing evidence is NOT inferred from place classification or popularity", () => {
  const imported = {
    ...place,
    source: "mapable-directory",
    sourceLabel: "MapAble directory",
    stepFree: { status: "unknown", detail: "" },
    accessibleToilet: { status: "unknown", detail: "" },
    category: "Community access centre",
    confidence: "mapable_verified",
    rating: 4.9,
  };
  const results = evaluatePlaceEvidence(imported, everyCheck);
  assert.equal(results.length, 5);
  for (const item of results) {
    assert.equal(item.finding, "not-assessed");
    assert.match(item.evidence.toLowerCase(), /does not establish|no journey-specific/);
  }
});

test("new communication, quiet-space and transport fields stay unknown when absent", () => {
  const onlyExtra = { stepFree: false, accessibleToilet: false,
    communication: true, sensory: true, transport: true };
  const results = evaluatePlaceEvidence(place, onlyExtra);
  assert.deepEqual(results.map(r=>r.key), ["communication", "sensory", "transport"]);
  assert.ok(results.every(r => r.finding === "not-assessed"));
});

test("question draft contains practical prompts only, not implicit diagnosis or GPS", () => {
  const results = evaluatePlaceEvidence(place, everyCheck);
  const draft = makeVenueQuestionsDraft(place, results);
  assert.match(draft, /I'm considering visiting Example Community Library/);
  assert.match(draft, /Which step-free entrance/);
  assert.match(draft, /written information, communication support/);
  assert.match(draft, /No date, diagnosis, GPS location or check-in is included/);
  assert.ok(!draft.includes("2026-10-27"));
  assert.ok(!draft.includes(place.sourceUrl));
  assert.ok(!draft.includes(place.suburb));
  assert.equal((draft.match(/^\d+\. /gm) || []).length, 5);
});

test("empty selections cannot generate an implied accessibility recommendation", () => {
  const none = { stepFree:false, accessibleToilet:false, communication:false,
    sensory:false, transport:false };
  assert.deepEqual(evaluatePlaceEvidence(place, none), []);
  assert.equal(makeVenueQuestionsDraft(place, []), "");
});

test("community planning never creates a check-in, RSVP or participant invitation", () => {
  const selected = evaluatePlaceEvidence(place, DEFAULT_ACCESS_CHECKS);
  const readiness = makeCommunityReadiness("Book club (illustrative)", place, selected);
  assert.ok(readiness.some(item => item.includes("not a scheduled or confirmed CripSquare event")));
  assert.ok(readiness.some(item => item.includes("human organiser")));
  const draft = makeVenueQuestionsDraft(place, selected,
    { gatheringName: "Book club (illustrative)" });
  assert.match(draft, /possible community gathering/);
  assert.doesNotMatch(draft, /userId|participantId|contact list|invite sent/);
  assert.deepEqual(evaluatePlaceEvidence(place, DEFAULT_ACCESS_CHECKS), selected);
});

test("evidence checks are exposed as concrete, explainable prompts", () => {
  assert.equal(Object.keys(ACCESS_CHECKS).length, 5);
  for (const item of Object.values(ACCESS_CHECKS)) {
    assert.ok(item.label.length > 5);
    assert.ok(item.question.endsWith("?"));
  }
});
