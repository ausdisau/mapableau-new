import { randomUUID } from "crypto";

import {
  getAccessibilityOpsMode,
  isAccessibilityOpsFlagEnabled,
} from "../feature-flags";
import {
  memoryCurrentRuleVersion,
  memoryGetAsset,
  memoryListRules,
  memorySaveEvaluation,
  type StoredRule,
} from "../memory-store";
import type {
  AccessibilityOutcome,
  ShadowEvaluationInput,
  ShadowEvaluationResult,
  ShadowEvaluationResultItem,
} from "../types";

function ruleAppliesToAsset(
  rule: StoredRule,
  assetClass: string,
  assetType: string
): boolean {
  if (rule.applicability.length === 0) return true;
  return rule.applicability.some((a) => {
    const classOk = !a.assetClass || a.assetClass === assetClass;
    const typeOk = !a.assetType || a.assetType === assetType;
    return classOk && typeOk;
  });
}

/**
 * Shadow evaluation: records outcomes with reason codes.
 * Never blocks releases. Commercial plan must not alter outcomes or severity.
 */
export function evaluateShadowRules(
  input: ShadowEvaluationInput
): ShadowEvaluationResult {
  if (!isAccessibilityOpsFlagEnabled("opsEnabled")) {
    throw new Error("ACCESSIBILITY_OPS_DISABLED");
  }
  if (!isAccessibilityOpsFlagEnabled("ruleRegistry")) {
    throw new Error("ACCESSIBILITY_OPS_DISABLED");
  }

  // Invariant: commercial plan is ignored for severity/outcome.
  void input.commercialPlan;

  const asset = memoryGetAsset(input.assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");

  const observationByKey = new Map(
    (input.observations ?? []).map((o) => [o.ruleStableKey, o])
  );

  let rules = memoryListRules();
  if (input.ruleIds?.length) {
    const allowed = new Set(input.ruleIds);
    rules = rules.filter((r) => allowed.has(r.id));
  }

  const results: ShadowEvaluationResultItem[] = [];
  for (const rule of rules) {
    if (!ruleAppliesToAsset(rule, asset.assetClass, asset.assetType)) {
      continue;
    }
    const version = memoryCurrentRuleVersion(rule);
    if (!version) continue;

    const observation = observationByKey.get(rule.stableKey);
    let outcome: AccessibilityOutcome;
    let reasonCodes: string[];
    let notes: string | undefined;
    let evidenceRefs: string[] = [];

    if (observation) {
      outcome = observation.outcome;
      reasonCodes = [...observation.reasonCodes];
      notes = observation.notes;
      evidenceRefs = observation.evidenceRefs ?? [];
    } else if (rule.automation === "automated") {
      outcome = "cannot_tell";
      reasonCodes = ["NO_RUNNER_EVIDENCE", "SHADOW_MODE"];
      notes =
        "Automated rule eligible but no signed runner evidence was supplied.";
    } else if (rule.automation === "lived_experience") {
      outcome = "lived_experience_review_required";
      reasonCodes = ["LIVED_EXPERIENCE_REQUIRED"];
    } else {
      outcome = "manual_review_required";
      reasonCodes = ["MANUAL_REVIEW_REQUIRED", "SHADOW_MODE"];
    }

    results.push({
      ruleId: rule.id,
      ruleStableKey: rule.stableKey,
      ruleVersionId: version.id,
      outcome,
      reasonCodes,
      severityDefault: rule.severityDefault,
      notes,
      evidenceRefs,
    });
  }

  const correlationId = input.correlationId ?? randomUUID();
  const evaluationId = randomUUID();
  const mode = getAccessibilityOpsMode();

  memorySaveEvaluation({
    id: evaluationId,
    assetId: asset.id,
    assetVersionId: input.assetVersionId ?? null,
    mode,
    correlationId,
    commercialPlanIgnored: true,
    resultsJson: results,
    createdAt: new Date(),
  });

  return {
    evaluationId,
    assetId: asset.id,
    assetVersionId: input.assetVersionId ?? null,
    mode,
    results,
    blocking: false,
    correlationId,
    createdAt: new Date().toISOString(),
  };
}

/** Paid-plan neutrality helper used by tests and future Prisma path. */
export function assertPaidPlanNeutrality(
  withPlan: ShadowEvaluationResult,
  withoutPlan: ShadowEvaluationResult
): void {
  const normalize = (r: ShadowEvaluationResult) =>
    r.results.map((x) => ({
      key: x.ruleStableKey,
      outcome: x.outcome,
      severity: x.severityDefault,
      reasons: [...x.reasonCodes].sort().join(","),
    }));
  expectEqual(normalize(withPlan), normalize(withoutPlan));
}

function expectEqual(a: unknown, b: unknown): void {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error("PAID_PLAN_INFLUENCE_DETECTED");
  }
}
