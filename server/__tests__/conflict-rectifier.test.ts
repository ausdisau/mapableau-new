import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { rectifyConflictText } from "../../scripts/ci/rectify-merge-conflicts";

const LEFT = "<".repeat(7);
const BASE = "|".repeat(7);
const SEPARATOR = "=".repeat(7);
const RIGHT = ">".repeat(7);

describe("merge conflict rectifier", () => {
  test("removes a duplicate two-way conflict without changing content", () => {
    const input = [
      "before\n",
      `${LEFT} ours\n`,
      "same line\n",
      `${SEPARATOR}\n`,
      "same line\n",
      `${RIGHT} theirs\n`,
      "after\n",
    ].join("");

    const result = rectifyConflictText(input);
    assert.equal(result.text, "before\nsame line\nafter\n");
    assert.equal(result.resolved, 1);
    assert.deepEqual(result.unresolved, []);
  });

  test("handles an identical diff3 conflict", () => {
    const input = [
      `${LEFT} ours\n`,
      "kept\n",
      `${BASE} base\n`,
      "old\n",
      `${SEPARATOR}\n`,
      "kept\n",
      `${RIGHT} theirs\n`,
    ].join("");

    const result = rectifyConflictText(input);
    assert.equal(result.text, "kept\n");
    assert.equal(result.resolved, 1);
    assert.deepEqual(result.unresolved, []);
  });

  test("never chooses a side when content differs", () => {
    const input = [
      `${LEFT} ours\n`,
      "ours\n",
      `${SEPARATOR}\n`,
      "theirs\n",
      `${RIGHT} theirs\n`,
    ].join("");

    const result = rectifyConflictText(input);
    assert.equal(result.text, input);
    assert.equal(result.resolved, 0);
    assert.deepEqual(result.unresolved, [{ line: 1, reason: "content-differs" }]);
  });

  test("reports malformed markers and preserves the source", () => {
    const input = `${LEFT} ours\nunterminated\n`;
    const result = rectifyConflictText(input);
    assert.equal(result.text, input);
    assert.equal(result.resolved, 0);
    assert.deepEqual(result.unresolved, [{ line: 1, reason: "malformed" }]);
  });
});
