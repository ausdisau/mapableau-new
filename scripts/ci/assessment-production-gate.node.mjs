import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assessChecks,
  assessEvidence,
  REQUIRED_CHECKS,
  REQUIRED_SIGNOFFS,
} from "./assessment-production-gate.mjs";

const sha = "a".repeat(40);
const date = "2026-10-30T00:00:00.000Z";
const now = new Date("2026-10-31T00:00:00.000Z");

function validEvidence() {
  return {
    schemaVersion: 1,
    releaseSha: sha,
    preview: {
      commitSha: sha,
      url: "https://preview.example.org",
      protected: true,
      syntheticOnly: true,
    },
    signoffs: Object.fromEntries(
      REQUIRED_SIGNOFFS.map((k) => [
        k,
        {
          status: "PASS",
          reviewer: "Independent reviewer",
          evidenceUrl: "https://example.org/evidence",
          reviewedAt: date,
        },
      ]),
    ),
    rollback: {
      status: "PASS",
      evidenceUrl: "https://example.org/rollback",
    },
    privacyLifecycle: {
      status: "PASS",
      evidenceUrl: "https://example.org/privacy",
    },
  };
}

test("rejects missing release evidence rather than assuming approval", () => {
  assert.ok(assessEvidence(null, sha).length);
  assert.ok(assessEvidence({}, sha).length);
});

test("a complete synthetic valid fixture has no schema errors", () => {
  assert.deepEqual(assessEvidence(validEvidence(), sha, now), []);
});

test("requires an exact commit SHA and protected preview", () => {
  const e = validEvidence();
  e.releaseSha = "b".repeat(40);
  e.preview.protected = false;
  assert.ok(assessEvidence(e, sha, now).length >= 2);
});

test("requires participant accessibility and privacy approval", () => {
  const e = validEvidence();
  e.signoffs.participantAccessibility.status = "NOT_RUN";
  delete e.signoffs.privacy;
  assert.ok(assessEvidence(e, sha, now).length >= 2);
});

test("rejects stale independent reviews", () => {
  const e = validEvidence();
  e.signoffs.security.reviewedAt = "2025-01-01T00:00:00.000Z";
  assert.ok(assessEvidence(e, sha, now).some((x) => x.includes("stale")));
});

test("requires every current GitHub Actions check", () => {
  const checkRuns = REQUIRED_CHECKS.map((name) => ({
    name,
    app: { slug: "github-actions" },
    status: "completed",
    conclusion: "success",
    started_at: date,
  }));
  assert.deepEqual(assessChecks(checkRuns), []);
  checkRuns[0].conclusion = "failure";
  assert.ok(assessChecks(checkRuns).includes("Required check not successful: CI"));
  assert.ok(assessChecks([]).length > 0);
});
