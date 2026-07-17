/**
 * Composition adapter for MapAble AURA.
 * AccessibilityOps never bypasses AURA for participant-approved external actions.
 * CareOSMission remains the mission SoT when present on merged branches.
 */

export type AuraComposeStatus =
  | "unavailable_on_main"
  | "available"
  | "execution_guard_active";

export interface AuraBridge {
  careOsMissionAvailable?: boolean;
  proposalsAvailable?: boolean;
  executionGuardActive?: boolean;
  stopProtocolAvailable?: boolean;
  /** Only AURA may perform participant-approved external writes */
  requestProposalReview?: (input: {
    missionId: string;
    correlationId: string;
    purpose: string;
  }) => Promise<{ proposalId: string; futureExecutionEligible: boolean }>;
}

export interface AuraComposeCapabilities {
  status: AuraComposeStatus;
  careOsMissionAvailable: boolean;
  proposalsAvailable: boolean;
  executionGuardActive: boolean;
  stopProtocolAvailable: boolean;
  modulePathHints: string[];
  invariant: string;
}

const MODULE_PATH_HINTS = [
  "lib/aura/",
  "docs/aura/ARCHITECTURE.md",
  "CareOSMission (careos_missions)",
  "AuraMissionExtension",
  "AuraActionProposal",
];

let bridge: AuraBridge | null = null;

export function registerAuraBridge(next: AuraBridge): void {
  bridge = next;
}

export function clearAuraBridge(): void {
  bridge = null;
}

export function probeAuraCompose(): AuraComposeCapabilities {
  if (!bridge) {
    return {
      status: "unavailable_on_main",
      careOsMissionAvailable: false,
      proposalsAvailable: false,
      executionGuardActive: false,
      stopProtocolAvailable: false,
      modulePathHints: MODULE_PATH_HINTS,
      invariant:
        "AccessibilityOps must not invent AuraMission or execute participant-external actions.",
    };
  }
  return {
    status: bridge.executionGuardActive
      ? "execution_guard_active"
      : "available",
    careOsMissionAvailable: Boolean(bridge.careOsMissionAvailable),
    proposalsAvailable: Boolean(bridge.proposalsAvailable),
    executionGuardActive: Boolean(bridge.executionGuardActive),
    stopProtocolAvailable: Boolean(bridge.stopProtocolAvailable),
    modulePathHints: MODULE_PATH_HINTS,
    invariant:
      "Agents interpret; participants decide; deterministic MapAble services execute via AURA only.",
  };
}

export function careOsMissionCanonicalRef(missionId: string): string {
  return `careos_mission:${missionId}`;
}

/**
 * AccessibilityOps may only request proposal review through AURA — never write applications directly.
 */
export async function requestAuraProposalReviewIfAvailable(input: {
  missionId: string;
  correlationId: string;
  purpose: string;
}): Promise<{
  invoked: boolean;
  reason: string;
  proposalId: string | null;
  futureExecutionEligible: boolean;
}> {
  if (!bridge?.requestProposalReview) {
    return {
      invoked: false,
      reason: "aura_unavailable",
      proposalId: null,
      futureExecutionEligible: false,
    };
  }
  const result = await bridge.requestProposalReview(input);
  return {
    invoked: true,
    reason: "delegated_to_aura",
    proposalId: result.proposalId,
    futureExecutionEligible: result.futureExecutionEligible,
  };
}
