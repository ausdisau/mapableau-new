import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyAction,
  checks,
  decodeShift,
  detailsVisible,
  initialShift,
  jobs,
  primaryJob,
  stages,
} from "../../../lib/transport/driver-practice/journey.ts";
const id = jobs[0].id;
test("offer, pre-start, boarding, handover and completion require their own transitions", () => {
  let s = initialShift();
  assert.equal(detailsVisible(s.runs[id]), false);
  const advance = (confirmed = false, values = []) => {
    s = applyAction(s, id, {
      kind: "advance",
      expected: s.runs[id].step,
      confirmed,
      checks: values,
    });
  };
  advance();
  assert.equal(detailsVisible(s.runs[id]), true);
  advance();
  assert.throws(() => advance(), /three checks/);
  advance(
    false,
    checks.map(() => true),
  );
  advance();
  assert.throws(() => advance(), /rider/);
  advance(true);
  advance();
  advance();
  assert.throws(() => advance(), /rider/);
  advance(true);
  advance();
  assert.equal(s.runs[id].step, stages.length - 1);
  assert.equal(detailsVisible(s.runs[id]), false);
  assert.equal(primaryJob(s).id, jobs[1].id);
  assert.throws(() => advance(), /closed/);
});
test("pause, resumption and withdrawal protect rider choice", () => {
  let s = applyAction(initialShift(), id, { kind: "advance", expected: 0 });
  s = applyAction(s, id, { kind: "pause", reason: "Pickup access blocked" });
  assert.throws(
    () => applyAction(s, id, { kind: "advance", expected: 1 }),
    /Resolve/,
  );
  s = applyAction(s, id, { kind: "withdraw" });
  assert.equal(s.runs[id].shared, false);
  assert.equal(decodeShift(JSON.stringify(s)).runs[id].shared, false);
  s = applyAction(s, id, { kind: "resume" });
  assert.equal(s.runs[id].hold, null);
});
test("double tap, competing trip and declining an accepted job leave the previous state intact", () => {
  const s = applyAction(initialShift(), id, { kind: "advance", expected: 0 });
  assert.throws(
    () => applyAction(s, id, { kind: "advance", expected: 0 }),
    /changed/,
  );
  assert.throws(
    () => applyAction(s, jobs[1].id, { kind: "advance", expected: 0 }),
    /current trip/,
  );
  assert.throws(() => applyAction(s, id, { kind: "decline" }), /open offer/);
  assert.equal(s.runs[id].events.length, 1);
});
test("returned offers close and missing, old or corrupt device data is recoverable", () => {
  const s = applyAction(initialShift(), id, { kind: "decline" });
  assert.equal(primaryJob(s).id, jobs[1].id);
  for (const bad of [
    null,
    "{",
    '{"version":99}',
    JSON.stringify({ version: 1, runs: {} }),
  ])
    assert.deepEqual(decodeShift(bad), initialShift());
  const altered = initialShift();
  altered.runs[jobs[1].id].shared = true;
  assert.equal(
    decodeShift(JSON.stringify(altered)).runs[jobs[1].id].shared,
    false,
  );
});
