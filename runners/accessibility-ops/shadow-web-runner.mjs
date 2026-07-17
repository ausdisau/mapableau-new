#!/usr/bin/env node
/**
 * AccessibilityOps shadow web runner (Wave 2).
 * Produces signed hashed results for ingest. Does not block releases.
 *
 * Usage:
 *   node runners/accessibility-ops/shadow-web-runner.mjs \
 *     --asset-version-id=... \
 *     --rule-stable-key=mapable.ds.visible_focus \
 *     --rule-version-id=... \
 *     --outcome=cannot_tell \
 *     --reason=NO_DOM_SNAPSHOT
 *
 * Optional: --post-url=http://localhost:3000/api/internal/accessibility-ops/test-results
 *           --asset-id=...
 * Requires MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET (or NEXTAUTH_SECRET).
 */

import { createHmac, createHash, randomUUID } from "crypto";

function arg(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const runnerId = arg("runner-id", "mapable-shadow-web");
const runnerVersion = arg("runner-version", "0.1.0");
const ruleStableKey = arg("rule-stable-key", "mapable.ds.visible_focus");
const ruleVersionId = arg("rule-version-id", "unspecified");
const assetVersionId = arg("asset-version-id", "unspecified");
const assetId = arg("asset-id");
const outcome = arg("outcome", "cannot_tell");
const reason = arg("reason", "SHADOW_RUNNER_NO_BROWSER");
const environment = arg("environment", "ci");
const postUrl = arg("post-url");

const secret =
  process.env.MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  "dev-only-accessibility-ops-runner-secret";

const nonce = randomUUID();
const testedAt = new Date().toISOString();
const reasonCodes = [reason, "SHADOW_MODE"];

const canonical = JSON.stringify({
  runnerId,
  runnerVersion,
  ruleStableKey,
  ruleVersionId,
  assetVersionId,
  environment,
  browserOrDevice: "none",
  assistiveTechnology: null,
  testedAt,
  outcome,
  reasonCodes: [...reasonCodes].sort(),
  evidenceRefs: [],
  limitations: "No browser attached in shadow stub runner.",
  confidence: "low",
  nonce,
});

const resultHash = createHash("sha256").update(canonical).digest("hex");
const signature = createHmac("sha256", secret)
  .update(`${runnerId}:${resultHash}`)
  .digest("hex");

const payload = {
  runnerId,
  runnerVersion,
  ruleStableKey,
  ruleVersionId,
  assetVersionId,
  environment,
  browserOrDevice: "none",
  testedAt,
  outcome,
  reasonCodes,
  evidenceRefs: [],
  limitations: "No browser attached in shadow stub runner.",
  confidence: "low",
  nonce,
  resultHash,
  signature,
};

if (!postUrl) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(0);
}

if (!assetId) {
  console.error("--asset-id required when using --post-url");
  process.exit(1);
}

const res = await fetch(postUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-mapable-runner-secret": secret,
  },
  body: JSON.stringify({
    assetId,
    assetVersionId,
    results: [payload],
  }),
});

const body = await res.text();
process.stdout.write(body + "\n");
process.exit(res.ok ? 0 : 1);
