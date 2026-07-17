import {
  isAccessibilityOpsFlagEnabled,
  getAccessibilityOpsMode,
} from "../feature-flags";
import { evaluateShadowRules } from "../shadow/evaluate";
import {
  consumeRunnerNonce,
  verifySignedTestResult,
  type SignedTestResultPayload,
} from "./signing";

export interface IngestTestResultsInput {
  assetId: string;
  assetVersionId?: string | null;
  results: SignedTestResultPayload[];
  correlationId?: string;
}

/**
 * Internal runner ingest — shadow mode only in Wave 2.
 * Never blocks releases. Never closes lived-experience findings.
 */
export function ingestSignedTestResults(input: IngestTestResultsInput) {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("testLab")
  ) {
    throw new Error("ACCESSIBILITY_OPS_DISABLED");
  }

  const mode = getAccessibilityOpsMode();
  if (mode === "production" && !isAccessibilityOpsFlagEnabled("releaseGates")) {
    // Production ingest allowed for recording only when gates remain off.
  }

  const accepted: SignedTestResultPayload[] = [];
  const rejected: Array<{ resultHash: string; reason: string }> = [];

  for (const result of input.results) {
    const verified = verifySignedTestResult(result);
    if (!verified.ok) {
      rejected.push({ resultHash: result.resultHash, reason: verified.reason });
      continue;
    }
    if (!consumeRunnerNonce(result.nonce)) {
      rejected.push({ resultHash: result.resultHash, reason: "REPLAYED_NONCE" });
      continue;
    }
    if (
      input.assetVersionId &&
      result.assetVersionId !== input.assetVersionId
    ) {
      rejected.push({
        resultHash: result.resultHash,
        reason: "ASSET_VERSION_MISMATCH",
      });
      continue;
    }
    accepted.push(result);
  }

  const evaluation = evaluateShadowRules({
    assetId: input.assetId,
    assetVersionId: input.assetVersionId,
    correlationId: input.correlationId,
    observations: accepted.map((r) => ({
      ruleStableKey: r.ruleStableKey,
      outcome: r.outcome as
        | "passed"
        | "failed"
        | "inapplicable"
        | "cannot_tell"
        | "manual_review_required"
        | "lived_experience_review_required"
        | "evidence_expired"
        | "disputed",
      reasonCodes: r.reasonCodes,
      notes: r.limitations,
      evidenceRefs: r.evidenceRefs,
    })),
  });

  return {
    mode,
    blocking: false as const,
    acceptedCount: accepted.length,
    rejected,
    evaluation,
  };
}
