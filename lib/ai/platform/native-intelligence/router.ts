import {
  getModel,
  isModelAllowedForTask,
  isRndOnlyModel,
  modelAllowsDataClass,
  type NativeIntelligenceTaskKind,
} from "@/lib/ai/platform/models/registry";
import {
  isLocalModelRoutingEnabled,
  isNativeIntelligenceRndEnabled,
} from "@/lib/config/native-intelligence";

import { candidatesForTask, resolveFallbackChain } from "./portfolio";
import type {
  NativeRouteDecision,
  NativeRouteRequest,
} from "./types";

const PRODUCTION_SAFE_EVAL = new Set([
  "approved_for_pilot",
  "approved_for_production",
]);

/**
 * Model router for the MapAble-owned portfolio.
 * Always subordinate to the canonical gateway — never bypasses it.
 * Models cannot self-select broader permissions or execute actions.
 */
export function routeNativeIntelligenceTask(
  request: NativeRouteRequest
): NativeRouteDecision {
  const baseNotes: string[] = [];

  if (!isNativeIntelligenceRndEnabled()) {
    return {
      ok: false,
      routeKind: "deterministic",
      reason: "rnd_disabled",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: ["Native intelligence R&D flag is off (fail-closed)."],
    };
  }

  // Models never gain action / permission authority.
  if (
    request.requestedAuthorityCeiling === "DETERMINISTIC_EXECUTE_VIA_SERVICE"
  ) {
    return {
      ok: false,
      routeKind: "rejected",
      reason: "authority_bypass_attempt",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        "Models cannot request execute authority; mission/action policy stays deterministic.",
      ],
    };
  }

  if (!request.consentGranted) {
    return {
      ok: false,
      routeKind: "deterministic",
      reason: "consent_required",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: ["Consent required before model-assisted native routes."],
    };
  }

  for (const dataClass of request.dataClasses) {
    if (request.requestedModelId) {
      if (!modelAllowsDataClass(request.requestedModelId, dataClass)) {
        return {
          ok: false,
          routeKind: "rejected",
          reason: "prohibited_data_class",
          useDeterministicFallback: true,
          mayExecuteAction: false,
          authorityRaised: false,
          notes: [
            `Model ${request.requestedModelId} prohibits data class ${dataClass}.`,
          ],
        };
      }
    }
  }

  const candidates = candidatesForTask(request.taskKind);
  let selectedId =
    request.requestedModelId ??
    pickCandidate(candidates, request, baseNotes)?.id;

  if (!selectedId) {
    return {
      ok: false,
      routeKind: "deterministic",
      reason: "unapproved_model",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        `No portfolio candidate for task ${request.taskKind}; use deterministic path.`,
      ],
    };
  }

  const primary = getModel(selectedId);
  if (!primary || primary.provider === "disabled") {
    return {
      ok: false,
      routeKind: "rejected",
      reason: "unapproved_model",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [`Model ${selectedId} is not registered or is disabled.`],
    };
  }

  // Production capabilities cannot silently switch to unevaluated / labs models.
  if (
    request.productionCapability &&
    (primary.rndOnly ||
      !PRODUCTION_SAFE_EVAL.has(primary.evaluationStatus ?? "unevaluated"))
  ) {
    return {
      ok: false,
      routeKind: "rejected",
      reason: "production_unevaluated_switch",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        "Production capability cannot silently switch to an unevaluated or R&D-only model.",
      ],
    };
  }

  if (
    primary.evaluationStatus === "unevaluated" ||
    primary.evaluationStatus === "suspended" ||
    primary.evaluationStatus === "retired"
  ) {
    return {
      ok: false,
      routeKind: "rejected",
      reason: "evaluation_incomplete",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        `Model ${selectedId} evaluation status is ${primary.evaluationStatus}.`,
      ],
    };
  }

  for (const dataClass of request.dataClasses) {
    if (!modelAllowsDataClass(selectedId, dataClass)) {
      return {
        ok: false,
        routeKind: "rejected",
        reason: "prohibited_data_class",
        useDeterministicFallback: true,
        mayExecuteAction: false,
        authorityRaised: false,
        notes: [`Prohibited data class ${dataClass} for model ${selectedId}.`],
      };
    }
  }

  if (primary.provider === "local_oss" || primary.deploymentType === "local_oss") {
    if (!isLocalModelRoutingEnabled()) {
      return {
        ok: false,
        routeKind: "deterministic",
        reason: "local_routing_disabled",
        useDeterministicFallback: true,
        mayExecuteAction: false,
        authorityRaised: false,
        notes: ["Local model routing flag is off (fail-closed)."],
      };
    }
    if (!request.cloudAvailable) {
      baseNotes.push("Cloud unavailable — using local/open-weight degraded route.");
    }
    return {
      ok: true,
      routeKind: "local_oss",
      modelId: selectedId,
      evaluationStatus: primary.evaluationStatus ?? "labs_only",
      usedFallback: false,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        ...baseNotes,
        "Local/open-weight route is experimental and Labs-gated.",
        "Canonical gateway must still authorise the capability call.",
      ],
    };
  }

  // Cloud outage → try registry fallbacks, then local task candidates.
  if (!request.cloudAvailable) {
    const outageCandidates = [
      ...resolveFallbackChain(selectedId).slice(1),
      ...candidates
        .filter((c) => c.provider === "local_oss")
        .map((c) => c.id),
    ];
    for (const fallbackId of outageCandidates) {
      const fb = getModel(fallbackId);
      if (!fb || fb.provider === "disabled") continue;
      if (fb.provider !== "local_oss") continue;
      if (!isLocalModelRoutingEnabled()) continue;
      if (request.productionCapability && fb.rndOnly) continue;
      const dataOk = request.dataClasses.every((dc) =>
        modelAllowsDataClass(fallbackId, dc)
      );
      if (!dataOk) continue;
      return {
        ok: true,
        routeKind: "local_oss",
        modelId: fallbackId,
        evaluationStatus: fb.evaluationStatus ?? "labs_only",
        usedFallback: true,
        fallbackFromModelId: selectedId,
        mayExecuteAction: false,
        authorityRaised: false,
        notes: [
          "Primary cloud model unavailable; degraded to local/open-weight assist.",
          "Mission/action policy remains deterministic.",
        ],
      };
    }
    return {
      ok: false,
      routeKind: "deterministic",
      reason: "model_outage",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        "Cloud outage with no eligible local fallback; deterministic path required.",
      ],
    };
  }

  // Gateway allowlist check for non-R&D capability keys.
  const nativeTaskKey = `native.${request.taskKind}` as const;
  const allowlisted =
    isModelAllowedForTask(selectedId, request.capabilityKey) ||
    isModelAllowedForTask(selectedId, nativeTaskKey) ||
    isRndOnlyModel(selectedId);

  if (!allowlisted && !primary.rndOnly) {
    return {
      ok: false,
      routeKind: "rejected",
      reason: "unapproved_model",
      useDeterministicFallback: true,
      mayExecuteAction: false,
      authorityRaised: false,
      notes: [
        `Model ${selectedId} is not allowlisted for capability ${request.capabilityKey}.`,
      ],
    };
  }

  return {
    ok: true,
    routeKind: "cloud_gateway",
    modelId: selectedId,
    evaluationStatus: primary.evaluationStatus ?? "unevaluated",
    usedFallback: false,
    mayExecuteAction: false,
    authorityRaised: false,
    notes: [
      ...baseNotes,
      "Route selected via portfolio policy; must still resolve through canonical gateway.",
    ],
  };
}

/**
 * Hard rule: R&D / portfolio models cannot execute Action Kernel actions.
 */
export function assertNativeModelCannotExecuteAction(modelId: string): {
  allowed: false;
  reason: "action_execution_forbidden";
} {
  void modelId;
  return { allowed: false, reason: "action_execution_forbidden" };
}

/**
 * Hard rule: portfolio routing cannot bypass the canonical gateway.
 */
export function assertMustUseCanonicalGateway(capabilityKey: string): {
  bypassAllowed: false;
  capabilityKey: string;
  message: string;
} {
  return {
    bypassAllowed: false,
    capabilityKey,
    message:
      "No capability may bypass the canonical model gateway. Native intelligence routes propose models only.",
  };
}

function pickCandidate(
  candidates: ReturnType<typeof candidatesForTask>,
  request: NativeRouteRequest,
  notes: string[]
) {
  if (candidates.length === 0) return undefined;

  // Prefer evaluated cloud models when cloud is available; local when not.
  const ranked = [...candidates].sort((a, b) => {
    const score = (m: (typeof candidates)[number]) => {
      let s = 0;
      if (request.cloudAvailable && m.provider === "ai_gateway") s += 10;
      if (!request.cloudAvailable && m.provider === "local_oss") s += 10;
      if (m.evaluationStatus === "approved_for_production") s += 5;
      if (m.evaluationStatus === "approved_for_pilot") s += 4;
      if (m.evaluationStatus === "eval_gated") s += 2;
      if (m.evaluationStatus === "labs_only") s += 1;
      if (
        request.preferredCostClass &&
        m.costClass === request.preferredCostClass
      ) {
        s += 1;
      }
      if (
        request.preferredLatencyClass &&
        m.latencyClass === request.preferredLatencyClass
      ) {
        s += 1;
      }
      // Never treat rnd-only as preferred for production capabilities.
      if (request.productionCapability && m.rndOnly) s -= 100;
      return s;
    };
    return score(b) - score(a);
  });

  notes.push(
    `Ranked ${ranked.length} candidates for ${request.taskKind as NativeIntelligenceTaskKind}; no hardcoded "best model".`
  );
  return ranked[0];
}
