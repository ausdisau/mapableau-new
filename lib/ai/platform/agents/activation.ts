import type { MapAbleModule } from "@/intelligence/types";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { isCapabilityKilled } from "@/lib/ai/platform/policies/kill-switches";
import { evaluateSafeguardingGate } from "@/lib/ai/platform/policies/safeguarding-gate";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

import { minAuthority } from "./authority";
import { listMapAbleAgents } from "./registry";
import type {
  MapAbleAgentActivationEntry,
  MapAbleAgentManifest,
  MapAbleHumanReviewItem,
  SelectMapAbleAgentsInput,
  SelectMapAbleAgentsResult,
} from "./types";


function isFeatureFlagEnabled(flagName: string): boolean {
  return process.env[flagName] === "true";
}

function moduleRelevant(
  agent: MapAbleAgentManifest,
  domains: MapAbleModule[]
): boolean {
  if (agent.domains.includes("core")) {
    if (
      agent.activation === "always_for_participant_missions" ||
      agent.id === "continuity_assurance" ||
      agent.id === "evidence_intelligence"
    ) {
      return true;
    }
  }
  return agent.domains.some((d) => domains.includes(d));
}

function moduleEnabled(
  agent: MapAbleAgentManifest,
  domains: MapAbleModule[],
  enabledModules?: Partial<Record<MapAbleModule, boolean>>
): boolean {
  if (!enabledModules) return true;
  // core-gated always-on agents need core enabled when map provided
  const checkDomains =
    agent.activation === "always_for_participant_missions"
      ? (["core"] as MapAbleModule[])
      : agent.domains.filter((d) => domains.includes(d) || d === "core");
  if (checkDomains.length === 0) {
    return agent.domains.some((d) => enabledModules[d] !== false);
  }
  return checkDomains.some((d) => enabledModules[d] !== false);
}

function collectCapabilityState(agent: MapAbleAgentManifest): {
  disabledCapabilities: string[];
  killedModelBacked: boolean;
  anyEnabled: boolean;
  humanReviewRequired: boolean;
  missingConsent: string[];
  requiredScopes: string[];
} {
  const disabledCapabilities: string[] = [];
  let killedModelBacked = false;
  let anyEnabled = agent.capabilityKeys.length === 0;
  let humanReviewRequired = false;
  const requiredScopes = new Set<string>(agent.requiredConsentScopes);

  for (const key of agent.capabilityKeys) {
    const cap = getAiCapability(key);
    if (!cap) {
      disabledCapabilities.push(key);
      continue;
    }
    if (!isFeatureFlagEnabled(cap.featureFlag)) {
      disabledCapabilities.push(key);
      continue;
    }
    if (isCapabilityKilled(key) || isCapabilityKilled(cap.killSwitchKey)) {
      if (cap.backend === "model_backed" || cap.backend === "hybrid") {
        killedModelBacked = true;
      }
      disabledCapabilities.push(key);
      continue;
    }
    anyEnabled = true;
    if (cap.humanReviewRequired) humanReviewRequired = true;
    for (const scope of cap.requiredConsentScopes ?? []) {
      requiredScopes.add(scope);
    }
  }

  return {
    disabledCapabilities,
    killedModelBacked,
    anyEnabled: anyEnabled || agent.capabilityKeys.length === 0,
    humanReviewRequired,
    missingConsent: [],
    requiredScopes: [...requiredScopes],
  };
}

function fallbackAvailable(agent: MapAbleAgentManifest): boolean {
  return (
    agent.fallbackAgentId === "human" ||
    agent.fallbackAgentId === "non_ai_path" ||
    Boolean(agent.fallbackAgentId)
  );
}

/**
 * Deterministic agent activation. The LLM must not decide its own permissions.
 */
export function selectMapAbleAgents(
  input: SelectMapAbleAgentsInput
): SelectMapAbleAgentsResult {
  const domains = Array.from(new Set<MapAbleModule>(["core", ...input.domains]));
  const consentScopes = input.consentScopes ?? [];
  const includeContinuity = input.includeContinuityAnalysis !== false;
  const requested = new Set(input.requestedCapabilities ?? []);

  const activeAgents: MapAbleAgentActivationEntry[] = [];
  const unavailableAgents: MapAbleAgentActivationEntry[] = [];
  const requiredHumanReviews: MapAbleHumanReviewItem[] = [];
  const missingConsentScopes = new Set<string>();
  const disabledCapabilities = new Set<string>();
  const ceilings: AuthorityCeiling[] = [];

  const safeguarding = evaluateSafeguardingGate({
    objective: input.objective,
    domains,
    evidenceRefs: [],
  });
  if (safeguarding.halted) {
    requiredHumanReviews.push(safeguarding.humanReviewItem);
  }

  for (const agent of listMapAbleAgents()) {
    const capState = collectCapabilityState(agent);
    for (const d of capState.disabledCapabilities) {
      disabledCapabilities.add(d);
    }

    for (const scope of capState.requiredScopes) {
      if (!consentScopes.includes(scope)) {
        missingConsentScopes.add(scope);
      }
    }

    let status: MapAbleAgentActivationEntry["status"] = "available";
    let reason = "Available within the selected MapAble mission.";

    const relevant = moduleRelevant(agent, domains);
    const enabled = moduleEnabled(agent, domains, input.enabledModules);

    if (agent.id === "continuity_assurance" && !includeContinuity) {
      status = "disabled";
      reason = "Continuity analysis was not selected for this request.";
    } else if (!relevant) {
      status = "disabled";
      reason = "Its MapAble domain was not selected for this request.";
    } else if (!enabled) {
      status = "disabled";
      reason = "The required MapAble intelligence module is disabled.";
    } else if (safeguarding.halted && agent.id !== "participant_authority") {
      status = "unavailable";
      reason =
        "Safeguarding gate halted AI execution pending authorised human review.";
    } else if (
      agent.capabilityKeys.length > 0 &&
      capState.disabledCapabilities.length === agent.capabilityKeys.length &&
      !input.relaxCapabilityFlags
    ) {
      if (
        agent.activation === "always_for_participant_missions" ||
        agent.id === "mission_orchestrator" ||
        agent.id === "participant_authority"
      ) {
        status = "degraded";
        reason =
          "Core mission agent remains available with non-AI fallback; dependent capabilities are flag-disabled.";
      } else {
        status = "unavailable";
        reason =
          "All dependent capabilities are disabled by feature flags or kill switches.";
      }
    } else if (
      agent.capabilityKeys.length > 0 &&
      capState.disabledCapabilities.length === agent.capabilityKeys.length &&
      input.relaxCapabilityFlags
    ) {
      status = "degraded";
      reason =
        "Capability feature flags are off; agent remains domain-available with non-AI fallback.";
    } else if (
      capState.killedModelBacked &&
      capState.disabledCapabilities.length > 0
    ) {
      status = "degraded";
      reason =
        "Model-backed capabilities are killed; non-AI / deterministic fallback remains available.";
    } else if (
      agent.activation === "always_for_participant_missions" ||
      agent.id === "mission_orchestrator" ||
      agent.id === "participant_authority"
    ) {
      status = "active";
      reason =
        "Always active to coordinate the mission and protect participant authority.";
    } else if (
      requested.size > 0 &&
      !agent.capabilityKeys.some((k) => requested.has(k)) &&
      agent.activation === "request_gated"
    ) {
      status = "available";
      reason = "Not requested for this activation preview.";
    } else {
      status = "active";
      reason = "Domain-relevant specialist activated for this mission.";
    }

    // After base status: if always-on ended as degraded, keep in active list
    if (
      (agent.id === "mission_orchestrator" ||
        agent.id === "participant_authority") &&
      status === "unavailable"
    ) {
      status = "degraded";
      reason =
        "Core mission agent remains available with non-AI fallback.";
    }

    // Missing required consent for work disclosure → degrade work agent
    if (
      agent.id === "work_participation" &&
      status === "active" &&
      agent.requiredConsentScopes.some((s) => !consentScopes.includes(s))
    ) {
      status = "degraded";
      reason =
        "Disability disclosure consent scope is missing; no automatic disclosure is permitted.";
      for (const s of agent.requiredConsentScopes) {
        if (!consentScopes.includes(s)) missingConsentScopes.add(s);
      }
    }

    if (capState.humanReviewRequired || agent.requiredHumanReviewFor.length > 0) {
      for (const category of agent.requiredHumanReviewFor) {
        if (
          status === "active" &&
          (category === "safeguarding" ? safeguarding.halted : true)
        ) {
          // Only enqueue safeguarding review when gate halted; others are boundary markers
          if (category === "safeguarding" && !safeguarding.halted) continue;
          if (category !== "safeguarding") continue;
        }
      }
    }

    const entry: MapAbleAgentActivationEntry = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status,
      authorityCeiling: agent.authorityCeiling,
      capabilityKeys: agent.capabilityKeys,
      reason,
      fallbackAvailable: fallbackAvailable(agent),
    };

    if (status === "active" || status === "degraded") {
      activeAgents.push(entry);
      ceilings.push(agent.authorityCeiling);
    } else if (status === "unavailable" || status === "disabled") {
      unavailableAgents.push(entry);
    } else {
      unavailableAgents.push(entry);
    }
  }

  const authorityCeiling = minAuthority(
    ...ceilings,
    "READ_ONLY_EXPLAIN"
  );

  return {
    activeAgents,
    unavailableAgents,
    requiredHumanReviews,
    missingConsentScopes: [...missingConsentScopes],
    disabledCapabilities: [...disabledCapabilities],
    authorityCeiling,
  };
}
