import { fingerprintToolCall } from "@/lib/aura-harness/fingerprint";
import { gammaCalculator } from "@/lib/aura-harness/gamma-calculator";
import {
  vectorMemoryStore,
  type MemoryMatch,
} from "@/lib/aura-harness/memory-store";
import {
  applyMitigationLayer,
  defaultMaskPiiStrategy,
  selectMitigationForTool,
} from "@/lib/aura-harness/mitigations";
import {
  policyActionReason,
  resolvePolicyAction,
} from "@/lib/aura-harness/policy-engine";
import {
  extractSemanticScores,
  reScoreAfterMitigation,
} from "@/lib/aura-harness/semantic-judge";
import type {
  HarnessDecision,
  HarnessToolEvaluation,
  MitigationStrategy,
} from "@/lib/aura-harness/types";

function blockedDecision(
  profile: ReturnType<typeof gammaCalculator.calculateProfile>,
  policyAction: HarnessDecision["policyAction"],
  reason: string,
  guardrailIds: string[],
  pendingHitl: boolean,
): HarnessDecision {
  return {
    outcome: pendingHitl ? "HITL_PENDING" : "DENIED",
    policyAction,
    profile: { ...profile, requiresHITL: pendingHitl },
    mitigation: pendingHitl
      ? {
          strategyId: "require_approval",
          actionType: "REQUIRE_APPROVAL",
        }
      : {
          strategyId: "block",
          actionType: "BLOCK",
        },
    reason,
    guardrailIds,
  };
}

async function applyMitigatePath(
  toolName: string,
  payload: unknown,
  _profile: ReturnType<typeof gammaCalculator.calculateProfile>,
  mitigationHint: MitigationStrategy | null,
): Promise<HarnessDecision> {
  // Prefer MASK_PII for concentrated privacy spikes, then REDUCE_SCOPE if needed.
  const primary: MitigationStrategy =
    mitigationHint?.actionType === "MASK_PII"
      ? mitigationHint
      : defaultMaskPiiStrategy(toolName);

  let safeArgs = applyMitigationLayer(payload, primary);
  let effective = primary;
  let rescoredContexts = reScoreAfterMitigation(toolName, safeArgs);
  let rescored = gammaCalculator.calculateProfile(rescoredContexts);
  let rescoredPolicy = resolvePolicyAction(rescored);

  if (rescoredPolicy !== "APPROVE" && rescored.highConcentration) {
    const reduce = selectMitigationForTool(toolName);
    const reduceStrategy: MitigationStrategy =
      reduce.actionType === "REDUCE_SCOPE"
        ? reduce
        : {
            strategyId: `reduce_scope:${toolName}`,
            actionType: "REDUCE_SCOPE",
          };
    safeArgs = applyMitigationLayer(safeArgs, reduceStrategy);
    effective = {
      strategyId: `${primary.strategyId}+${reduceStrategy.strategyId}`,
      actionType: "MASK_PII",
      targetFields: reduceStrategy.targetFields,
    };
    rescoredContexts = reScoreAfterMitigation(toolName, safeArgs);
    rescored = gammaCalculator.calculateProfile(rescoredContexts);
    rescoredPolicy = resolvePolicyAction(rescored);
  }

  if (rescoredPolicy === "APPROVE" || !rescored.highConcentration) {
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      rescored,
      effective,
      "MITIGATED",
      rescoredContexts[0]?.dimensions,
    );
    return {
      outcome: "MITIGATED",
      policyAction: "MITIGATE",
      profile: rescored,
      mitigation: effective,
      reason: `Mitigation ${effective.actionType} reduced concentration (C_conc=${rescored.concentrationCoeff.toFixed(1)}).`,
      guardrailIds: ["aura:mitigate", `aura:mitigate:${effective.actionType}`],
      safeArgs,
    };
  }

  // Fail closed — mitigation did not clear concentrated risk.
  await vectorMemoryStore.commitAction(
    toolName,
    payload,
    rescored,
    effective,
    "DENIED",
    rescoredContexts[0]?.dimensions,
  );
  return blockedDecision(
    rescored,
    "REQUIRE_HITL",
    `Mitigation insufficient; fail-closed HITL (C_conc=${rescored.concentrationCoeff.toFixed(1)}).`,
    ["aura:mitigate_failed", "aura:hitl"],
    true,
  );
}

function fromMemoryMatch(
  match: MemoryMatch,
  payload: unknown,
): HarnessDecision | null {
  if (match.isExpired()) return null;

  if (match.isSafe && match.decision === "APPROVED") {
    return {
      outcome: "APPROVED",
      policyAction: "APPROVE",
      profile: {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: false,
        highGamma: false,
        highConcentration: false,
      },
      mitigation: null,
      reason: "Memory precedent: historically safe.",
      guardrailIds: ["aura:memory:safe"],
      safeArgs: payload,
    };
  }

  if (match.isSafe && match.mitigation) {
    const safeArgs = applyMitigationLayer(payload, match.mitigation);
    return {
      outcome: "MITIGATED",
      policyAction: "MITIGATE",
      profile: {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: false,
        highGamma: false,
        highConcentration: false,
      },
      mitigation: match.mitigation,
      reason: "Memory precedent: replaying successful mitigation.",
      guardrailIds: ["aura:memory:mitigation"],
      safeArgs,
    };
  }

  if (match.isDangerous) {
    return blockedDecision(
      {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: match.decision === "HITL_REJECTED",
        highGamma: true,
        highConcentration: true,
      },
      match.decision === "HITL_REJECTED" ? "REQUIRE_HITL" : "DENY",
      "Memory precedent: historically dangerous; fail-closed.",
      ["aura:memory:dangerous"],
      match.decision === "HITL_REJECTED",
    );
  }

  return null;
}

/**
 * Full AURA evaluation pipeline for a single tools/call equivalent.
 */
export async function evaluateToolAction(
  toolName: string,
  payload: unknown,
): Promise<HarnessToolEvaluation> {
  const fingerprint = fingerprintToolCall(toolName, payload);

  const memoryMatch = await vectorMemoryStore.querySimilarAction(
    toolName,
    payload,
  );
  if (memoryMatch) {
    const fromMem = fromMemoryMatch(memoryMatch, payload);
    if (fromMem) {
      return { toolName, decision: fromMem, fingerprint };
    }
  }

  const contexts = extractSemanticScores(toolName, payload);
  const profile = gammaCalculator.calculateProfile(contexts);
  const policyAction = resolvePolicyAction(profile);
  const reason = policyActionReason(policyAction, profile);

  if (policyAction === "APPROVE") {
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      profile,
      null,
      "APPROVED",
      contexts[0]?.dimensions,
    );
    return {
      toolName,
      fingerprint,
      decision: {
        outcome: "APPROVED",
        policyAction,
        profile,
        mitigation: null,
        reason,
        guardrailIds: ["aura:approve"],
        safeArgs: payload,
      },
    };
  }

  if (policyAction === "MITIGATE") {
    const known = await vectorMemoryStore.findMitigation(toolName);
    const decision = await applyMitigatePath(
      toolName,
      payload,
      profile,
      known,
    );
    return { toolName, fingerprint, decision };
  }

  if (policyAction === "DENY") {
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      profile,
      null,
      "DENIED",
      contexts[0]?.dimensions,
    );
    return {
      toolName,
      fingerprint,
      decision: blockedDecision(profile, "DENY", reason, ["aura:deny"], false),
    };
  }

  // REQUIRE_HITL — fail closed
  await vectorMemoryStore.commitAction(
    toolName,
    payload,
    profile,
    null,
    "DENIED",
    contexts[0]?.dimensions,
  );
  return {
    toolName,
    fingerprint,
    decision: blockedDecision(
      profile,
      "REQUIRE_HITL",
      reason,
      ["aura:hitl"],
      true,
    ),
  };
}

export function buildAuraBlockedToolResult(decision: HarnessDecision): {
  aura: {
    blocked: true;
    pendingHumanReview?: boolean;
    reason: string;
    outcome: HarnessDecision["outcome"];
    profile: {
      normalizedGamma: number;
      concentrationCoeff: number;
      variance: number;
    };
  };
} {
  return {
    aura: {
      blocked: true,
      pendingHumanReview: decision.outcome === "HITL_PENDING",
      reason: decision.reason,
      outcome: decision.outcome,
      profile: {
        normalizedGamma: decision.profile.normalizedGamma,
        concentrationCoeff: decision.profile.concentrationCoeff,
        variance: decision.profile.variance,
      },
    },
  };
}
