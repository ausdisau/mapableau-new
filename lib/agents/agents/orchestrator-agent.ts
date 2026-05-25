import { z } from "zod";

import type { MapAbleAgentId } from "../agent-types";

export const orchestratorRoutingSchema = z.object({
  chosenAgentId: z.enum([
    "participant_support",
    "provider_operations",
    "quality_safeguards",
    "billing_pricing",
    "provider_finder",
    "transport_dispatch",
    "telehealth_intake",
    "evidence_pack",
    "support_desk",
    "privacy_consent",
    "admin_copilot",
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  safeFallback: z.string(),
});

export type OrchestratorRouting = z.infer<typeof orchestratorRoutingSchema>;

export function routeOrchestrator(message: string): OrchestratorRouting {
  const lower = message.toLowerCase();

  if (/invoice|bill|payment|ndis line|claim|pricing/.test(lower)) {
    return {
      chosenAgentId: "billing_pricing",
      confidence: 0.9,
      reason: "Message relates to invoices or pricing.",
      safeFallback: "participant_support",
    };
  }
  if (/complain|safeguard|incident|report concern|worker did not/.test(lower)) {
    return {
      chosenAgentId: "quality_safeguards",
      confidence: 0.85,
      reason: "Safeguarding or complaint topic detected.",
      safeFallback: "support_desk",
    };
  }
  if (/find provider|support worker|who can help|near me/.test(lower)) {
    return {
      chosenAgentId: "provider_finder",
      confidence: 0.88,
      reason: "Provider search intent.",
      safeFallback: "participant_support",
    };
  }
  if (/telehealth|ot |occupational|practitioner|intake/.test(lower)) {
    return {
      chosenAgentId: "telehealth_intake",
      confidence: 0.82,
      reason: "Telehealth intake intent.",
      safeFallback: "participant_support",
    };
  }
  if (/evidence pack|plan review|ndis review/.test(lower)) {
    return {
      chosenAgentId: "evidence_pack",
      confidence: 0.8,
      reason: "Evidence pack request.",
      safeFallback: "participant_support",
    };
  }
  if (/consent|privacy|who can see|share my data/.test(lower)) {
    return {
      chosenAgentId: "privacy_consent",
      confidence: 0.9,
      reason: "Consent or privacy question.",
      safeFallback: "participant_support",
    };
  }
  if (/roster|workforce|service log|provider admin/.test(lower)) {
    return {
      chosenAgentId: "provider_operations",
      confidence: 0.8,
      reason: "Provider operations topic.",
      safeFallback: "provider_operations",
    };
  }
  if (/transport|pickup|driver|trip/.test(lower)) {
    return {
      chosenAgentId: "transport_dispatch",
      confidence: 0.75,
      reason: "Transport topic.",
      safeFallback: "participant_support",
    };
  }
  if (/support ticket|help desk|service recovery/.test(lower)) {
    return {
      chosenAgentId: "support_desk",
      confidence: 0.78,
      reason: "General support desk topic.",
      safeFallback: "participant_support",
    };
  }

  return {
    chosenAgentId: "participant_support",
    confidence: 0.6,
    reason: "Default participant support routing.",
    safeFallback: "participant_support",
  };
}

export function resolveAgentId(
  requestedId: MapAbleAgentId | undefined,
  message: string
): MapAbleAgentId {
  if (requestedId && requestedId !== "orchestrator") {
    return requestedId;
  }
  return routeOrchestrator(message).chosenAgentId;
}
