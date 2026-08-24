/**
 * @deprecated Compatibility adapter over the canonical MapAble Agentic Nerve Centre.
 * Prefer `selectMapAbleAgents` from `@/lib/ai/platform/agents`.
 * This module preserves the CareOS activation response shape for incremental migration.
 * Do not add new CareOS-only agent IDs or a second authority taxonomy here.
 */
import {
  authorityCeilingToCareOsDisplayLabel,
  selectMapAbleAgents,
  type MapAbleAgentId,
} from "@/lib/ai/platform/agents";

import type { MapAbleModule } from "../types";


import type {
  CareOSAgentActivation,
  CareOSAgentId,
  CareOSAuthorityLevel,
} from "./types";

type CareOSAgentDefinition = {
  id: CareOSAgentId;
  name: string;
  purpose: string;
  modules: MapAbleModule[];
  /** Display label only — derived historically; not an independent policy source. */
  maximumAuthorityLevel: CareOSAuthorityLevel;
  capabilities: string[];
  defaultStatus: CareOSAgentActivation["status"];
  /** Canonical agent this legacy id projects from (null = gate / research-only). */
  canonicalAgentId: MapAbleAgentId | null;
};

const DEFINITIONS: CareOSAgentDefinition[] = [
  {
    id: "manager",
    name: "CareOS Mission Manager",
    purpose: "Own the participant-facing mission and coordinate bounded specialists.",
    modules: ["core"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "interpret participant goals",
      "build mission dependencies",
      "combine specialist findings",
      "surface uncertainty and manual pathways",
    ],
    defaultStatus: "active",
    canonicalAgentId: "mission_orchestrator",
  },
  {
    id: "participant_advocate",
    name: "Participant Advocate",
    purpose: "Keep participant preferences, exclusions and authority visible across the network.",
    modules: ["core"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "protect participant hard constraints",
      "identify missing consent",
      "preserve edit, reject and non-AI pathways",
    ],
    defaultStatus: "active",
    canonicalAgentId: "participant_authority",
  },
  {
    id: "care_coordination",
    name: "Care Coordination Agent",
    purpose: "Analyse care requests, support coverage and continuity without assigning workers.",
    modules: ["care"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "read care request status",
      "identify unconfirmed support coverage",
      "prepare support coordination recommendations",
    ],
    defaultStatus: "available",
    canonicalAgentId: "support_participation",
  },
  {
    id: "transport_coordination",
    name: "Accessible Transport Agent",
    purpose: "Analyse accessible transport dependencies and journey readiness.",
    modules: ["transport"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "read transport status",
      "identify missing linked journeys",
      "route to the governed journey planner",
    ],
    defaultStatus: "available",
    canonicalAgentId: "access_mobility",
  },
  {
    id: "access_evidence",
    name: "Access Evidence Agent",
    purpose: "Surface verified accessibility evidence and evidence gaps.",
    modules: ["access"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "read published access records",
      "label confidence and source limitations",
      "identify when human verification is required",
    ],
    defaultStatus: "available",
    canonicalAgentId: "access_mobility",
  },
  {
    id: "continuity",
    name: "Continuity Radar",
    purpose: "Detect dependencies that may cause a support mission to fail.",
    modules: ["core", "care", "transport", "access"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "detect missing care or transport dependencies",
      "identify linked transport gaps",
      "prepare recovery actions",
    ],
    defaultStatus: "available",
    canonicalAgentId: "continuity_assurance",
  },
  {
    id: "worker_support",
    name: "Worker Support Copilot",
    purpose: "Prepare participant-approved shift information and worker guidance.",
    modules: ["care"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "prepare shift briefs",
      "surface communication requirements",
      "draft handover prompts",
    ],
    defaultStatus: "available",
    canonicalAgentId: "support_participation",
  },
  {
    id: "provider_capacity",
    name: "Provider Capacity Agent",
    purpose: "Represent provider capability and availability evidence without making assignments.",
    modules: ["care", "transport"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "summarise provider capacity evidence",
      "identify thin-market gaps",
      "request human verification of availability",
    ],
    defaultStatus: "available",
    canonicalAgentId: "support_participation",
  },
  {
    id: "rights",
    name: "Rights and Advocacy Agent",
    purpose: "Explain records, agreements and escalation options in participant-controlled language.",
    modules: ["core", "care"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "prepare evidence timelines",
      "draft participant questions",
      "route complaints to independent human processes",
    ],
    defaultStatus: "available",
    canonicalAgentId: "participant_authority",
  },
  {
    id: "safeguarding",
    name: "Safeguarding Gate",
    purpose: "Identify when a concern must leave the agent network and enter a human safeguarding process.",
    modules: ["core", "care"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "identify human-review boundaries",
      "preserve mandatory reporting pathways",
      "prevent autonomous incident conclusions",
    ],
    defaultStatus: "human_only",
    canonicalAgentId: null,
  },
  {
    id: "finance",
    name: "AbilityPay Explanation Agent",
    purpose: "Explain invoice and budget records without approving, denying or paying them.",
    modules: ["payments"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "summarise invoice status",
      "identify records requiring human review",
      "prepare questions for providers or plan managers",
    ],
    defaultStatus: "available",
    canonicalAgentId: "finance_administration",
  },
  {
    id: "robotics",
    name: "CareOS Robotics Coordinator",
    purpose: "Prepare bounded robotics tasks through a future MCP trust gateway.",
    modules: ["core"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "read approved device capabilities",
      "prepare simulation-only task proposals",
      "route physical actions through an independent safety controller",
    ],
    defaultStatus: "research_only",
    canonicalAgentId: null,
  },
];

function mapCanonicalStatusToCareOs(input: {
  definition: CareOSAgentDefinition;
  canonicalStatus: string | undefined;
  relevant: boolean;
  moduleEnabled: boolean;
  includeContinuityAnalysis: boolean;
}): { status: CareOSAgentActivation["status"]; reason: string } {
  const { definition } = input;

  if (definition.defaultStatus === "research_only") {
    return {
      status: "research_only",
      reason:
        "Robotics remains simulation-only and is not connected to physical actuation.",
    };
  }

  if (definition.defaultStatus === "human_only") {
    return {
      status: "human_only",
      reason: "Safeguarding conclusions and actions remain with authorised humans.",
    };
  }

  if (definition.id === "continuity" && !input.includeContinuityAnalysis) {
    return {
      status: "disabled",
      reason: "Continuity analysis was not selected for this request.",
    };
  }

  if (!input.relevant) {
    return {
      status: "disabled",
      reason: "Its MapAble module was not selected for this request.",
    };
  }

  if (!input.moduleEnabled) {
    return {
      status: "disabled",
      reason: "The required MapAble intelligence module is disabled.",
    };
  }

  if (
    input.canonicalStatus === "unavailable" ||
    input.canonicalStatus === "disabled"
  ) {
    return {
      status: "disabled",
      reason:
        input.canonicalStatus === "unavailable"
          ? "Canonical agent unavailable (flags, kill switches, or safeguarding halt)."
          : "Canonical agent disabled for this mission.",
    };
  }

  if (
    definition.id === "manager" ||
    definition.id === "participant_advocate"
  ) {
    return {
      status: "active",
      reason:
        "Always active to coordinate the mission and protect participant authority.",
    };
  }

  if (input.canonicalStatus === "degraded") {
    return {
      status: "active",
      reason:
        "Active via canonical agent with degraded model-backed capabilities; non-AI fallback remains.",
    };
  }

  if (input.canonicalStatus === "active" || input.canonicalStatus === "available") {
    return {
      status: "active",
      reason: "Available within the selected CareOS mission.",
    };
  }

  return {
    status: "active",
    reason: "Available within the selected CareOS mission.",
  };
}

/**
 * @deprecated Use `selectMapAbleAgents` for new call sites.
 * Preserves CareOS response shape by projecting the canonical registry.
 */
export function selectCareOSAgentNetwork(params: {
  modules: MapAbleModule[];
  enabledModules: Record<MapAbleModule, boolean>;
  includeContinuityAnalysis: boolean;
}): CareOSAgentActivation[] {
  const selected = new Set<MapAbleModule>(["core", ...params.modules]);

  const canonical = selectMapAbleAgents({
    objective: "CareOS network activation",
    domains: params.modules,
    actor: { actorId: "careos-network", actorType: "system" },
    consentScopes: [],
    includeContinuityAnalysis: params.includeContinuityAnalysis,
    enabledModules: params.enabledModules,
    // Preserve historical CareOS module-gated activation; capability flags degrade only.
    relaxCapabilityFlags: true,
  });

  const byCanonical = new Map(
    [...canonical.activeAgents, ...canonical.unavailableAgents].map((a) => [
      a.id,
      a,
    ])
  );

  return DEFINITIONS.map((definition) => {
    const relevant = definition.modules.some((module) => selected.has(module));
    const moduleEnabled = definition.modules.some(
      (module) => selected.has(module) && params.enabledModules[module]
    );

    const canonicalEntry = definition.canonicalAgentId
      ? byCanonical.get(definition.canonicalAgentId)
      : undefined;

    const { status, reason } = mapCanonicalStatusToCareOs({
      definition,
      canonicalStatus: canonicalEntry?.status,
      relevant,
      moduleEnabled,
      includeContinuityAnalysis: params.includeContinuityAnalysis,
    });

    // Display label stays on the legacy CareOS definition (not inverted from labels).
    // When a canonical ceiling exists, display label remains the historical CareOS level
    // unless we need to prove derivation — keep legacy L* for API compatibility.
    void authorityCeilingToCareOsDisplayLabel;
    const maximumAuthorityLevel = definition.maximumAuthorityLevel;

    return {
      id: definition.id,
      name: definition.name,
      purpose: definition.purpose,
      status,
      maximumAuthorityLevel,
      capabilities: definition.capabilities,
      reason,
    };
  });
}
