import { auraConfig } from "@/lib/aura/config";

/**
 * A2A (agent-to-agent) is experimental and disabled by default. When enabled,
 * every peer request maps to an internal AURA goal — external peers cannot
 * directly manipulate authority envelopes, execute tools, or read participant
 * data outside `discloseParticipantData`.
 */

export interface A2APeer {
  id: string;
  peerLabel: string;
  entitlementKey: string;
  conformancePassed: boolean;
  enabled: boolean;
}

export type A2AGatewayVerdict =
  | {
      verdict: "allowed";
      peer: A2APeer;
      internalGoalTemplate: string;
    }
  | { verdict: "disabled"; reason: string }
  | { verdict: "denied"; code: A2ADenyCode; reason: string };

export type A2ADenyCode =
  | "peer_not_registered"
  | "peer_not_conformant"
  | "peer_not_enabled"
  | "entitlement_missing";

export interface A2AEvaluationInput {
  peerLabel: string;
  entitlementKeyProvided: string;
  registry: A2APeer[];
}

export function evaluateA2AAccess(input: A2AEvaluationInput): A2AGatewayVerdict {
  if (!auraConfig.a2aExperimentalEnabled) {
    return {
      verdict: "disabled",
      reason: "AURA_A2A_EXPERIMENTAL_ENABLED is false.",
    };
  }
  const peer = input.registry.find((p) => p.peerLabel === input.peerLabel);
  if (!peer) {
    return {
      verdict: "denied",
      code: "peer_not_registered",
      reason: `A2A peer '${input.peerLabel}' is not registered.`,
    };
  }
  if (!peer.conformancePassed) {
    return {
      verdict: "denied",
      code: "peer_not_conformant",
      reason: "Peer has not passed A2A conformance.",
    };
  }
  if (!peer.enabled) {
    return {
      verdict: "denied",
      code: "peer_not_enabled",
      reason: "Peer registration is not enabled.",
    };
  }
  if (peer.entitlementKey !== input.entitlementKeyProvided) {
    return {
      verdict: "denied",
      code: "entitlement_missing",
      reason: "Entitlement key mismatch.",
    };
  }
  return {
    verdict: "allowed",
    peer,
    internalGoalTemplate: `a2a:${peer.peerLabel}:incoming_request`,
  };
}
