/**
 * Physical Systems safety kernel — fail closed (brief §18).
 */
import {
  canActuate,
  getPhysicalMode,
  isGlobalKillSwitchOn,
  isLiveEnabled,
  isShadowOnly,
} from "../configuration";
import { isProhibitedAction } from "../prohibited";
import type {
  ApprovalRecord,
  DeviceCapability,
  DeviceState,
  EmergencyModeState,
  PhysicalActionProposal,
  SafetyDecision,
} from "../schemas";

export type SafetySnapshot = {
  proposal?: PhysicalActionProposal;
  capability?: DeviceCapability;
  device?: DeviceState;
  emergency: EmergencyModeState;
  approvals?: ApprovalRecord[];
  /** When true, skip approval presence checks (proposal-time evaluation). */
  forProposal?: boolean;
  /** Device currently locked by another execution. */
  deviceLockedBy?: string | null;
  now?: Date;
};

function deny(
  code: string,
  reasons: string[],
  extra?: Partial<SafetyDecision>,
): SafetyDecision {
  return {
    allowed: false,
    code,
    reasons,
    requireUserApproval: extra?.requireUserApproval ?? true,
    requireVenueApproval: extra?.requireVenueApproval ?? false,
    fallbackSuggested: extra?.fallbackSuggested ?? true,
  };
}

/**
 * Evaluate whether a physical action may proceed.
 * Fail closed: any unmet check returns allowed=false.
 */
export function evaluateSafety(snapshot: SafetySnapshot): SafetyDecision {
  const reasons: string[] = [];
  const mode = getPhysicalMode();
  const capability = snapshot.capability;
  const proposal = snapshot.proposal;
  const actionType = proposal?.actionType ?? capability?.actionType ?? "";
  const requireUser =
    proposal?.requireUserApproval ?? capability?.requireUserApproval ?? true;
  const requireVenue =
    proposal?.requireVenueApproval ?? capability?.requireVenueApproval ?? false;
  const requireEmergencyOff =
    proposal?.requireEmergencyModeOff ??
    capability?.requireEmergencyModeOff ??
    true;

  // 1. Global kill switch
  if (isGlobalKillSwitchOn()) {
    return deny("KILL_SWITCH_ACTIVE", [
      "Global physical kill switch is active.",
    ]);
  }

  // 2. Prohibited action types (immutable)
  if (actionType && isProhibitedAction(actionType)) {
    return deny(
      "PROHIBITED_ACTION",
      [`Action type "${actionType}" is permanently prohibited.`],
      { fallbackSuggested: true },
    );
  }
  if (capability?.risk === "prohibited") {
    return deny("PROHIBITED_ACTION", [
      "Capability risk class is prohibited.",
    ]);
  }

  // 3. Emergency mode
  if (snapshot.emergency.active && requireEmergencyOff) {
    return deny("EMERGENCY_MODE_ACTIVE", [
      snapshot.emergency.reason ??
        "Emergency mode is active; actuations requiring emergency-off are blocked.",
    ]);
  }

  // 4. Mode / live / shadow clamps
  if (mode === "shadow" || isShadowOnly()) {
    if (!snapshot.forProposal) {
      return deny("SHADOW_ONLY", [
        "Shadow-only mode blocks physical actuation (observation permitted).",
      ]);
    }
  }
  if (mode === "live") {
    if (!isLiveEnabled()) {
      return deny("LIVE_DISABLED", [
        "LIVE mode requested but ACCESS_PHYSICAL_LIVE_ENABLED is false.",
      ]);
    }
    if (capability?.simulatedOnly || proposal?.simulatedOnly) {
      // Live hardware path would reject sim-only; for Harbour all are simulated.
      reasons.push(
        "Capability is simulation-only; live hardware path unavailable — use supervised/demo.",
      );
      return deny("SIMULATOR_ONLY", reasons);
    }
  }
  if (!snapshot.forProposal && !canActuate() && mode !== "demo") {
    // demo/supervised may actuate via simulators; shadow/kill already handled
    if (mode === "shadow") {
      return deny("MODE_NOT_ALLOWED", [
        `Operational mode ${mode} does not allow actuation.`,
      ]);
    }
  }

  // 5. Capability must exist and be enabled
  if (!capability) {
    return deny("CAPABILITY_NOT_FOUND", ["Capability missing from safety snapshot."]);
  }
  if (!capability.enabled) {
    return deny(
      "CAPABILITY_DISABLED",
      [
        capability.disabledReason ??
          `Capability ${capability.id} is currently disabled.`,
      ],
      { fallbackSuggested: true },
    );
  }

  // 6. Device health / online
  const device = snapshot.device;
  if (!device) {
    return deny("UNKNOWN_DEVICE", ["Device state missing from safety snapshot."]);
  }
  if (!device.online || device.health === "offline") {
    return deny("DEVICE_OFFLINE", [
      `Device ${device.deviceId} is offline.`,
    ]);
  }
  if (device.health === "unhealthy" || device.condition === "fault") {
    return deny("DEVICE_UNHEALTHY", [
      `Device ${device.deviceId} health=${device.health} condition=${device.condition}.`,
    ]);
  }
  if (device.condition === "outage" || device.condition === "emergency") {
    return deny("UNSAFE_STATE", [
      `Device ${device.deviceId} is in ${device.condition} condition.`,
    ]);
  }

  // 7. Device lock contention
  if (
    snapshot.deviceLockedBy &&
    proposal &&
    snapshot.deviceLockedBy !== proposal.id
  ) {
    return deny("LOCK_CONTENTION", [
      `Device ${device.deviceId} locked by ${snapshot.deviceLockedBy}.`,
    ]);
  }
  if (device.condition === "obstructed") {
    return deny(
      "FALLBACK_REQUIRED",
      [`Device area obstructed (${device.deviceId}).`],
      { fallbackSuggested: true },
    );
  }

  // 8. Approvals (execution-time)
  if (!snapshot.forProposal) {
    const approvals = snapshot.approvals ?? [];
    const now = (snapshot.now ?? new Date()).toISOString();
    const valid = (kind: ApprovalRecord["kind"]) =>
      approvals.some(
        (a) =>
          a.kind === kind && (!a.expiresAt || a.expiresAt > now),
      );

    if (requireUser && !valid("user")) {
      return deny(
        "APPROVAL_REQUIRED",
        ["User approval is required before execution."],
        { requireUserApproval: true, requireVenueApproval: requireVenue },
      );
    }
    if (requireVenue && !valid("venue")) {
      return deny(
        "VENUE_APPROVAL_REQUIRED",
        ["Venue approval is required before execution."],
        { requireUserApproval: requireUser, requireVenueApproval: true },
      );
    }
  }

  // 9. Proposal integrity / expiry
  if (proposal && !snapshot.forProposal) {
    const now = (snapshot.now ?? new Date()).toISOString();
    if (proposal.expiresAt < now) {
      return deny("ACTION_EXPIRED", ["Proposal has expired."]);
    }
    if (proposal.capabilityId !== capability.id) {
      return deny("PROPOSAL_TAMPERED", [
        "Proposal capability id does not match capability snapshot.",
      ]);
    }
    if (proposal.deviceId !== device.deviceId) {
      return deny("PROPOSAL_TAMPERED", [
        "Proposal device id does not match device snapshot.",
      ]);
    }
  }

  // 10. High-risk requires venue even if flag omitted
  if (capability.risk === "high_risk_actuation" && !requireVenue) {
    return deny("VENUE_APPROVAL_REQUIRED", [
      "High-risk actuation always requires venue approval.",
    ]);
  }

  reasons.push("Safety kernel checks passed.");
  return {
    allowed: true,
    reasons,
    requireUserApproval: requireUser,
    requireVenueApproval: requireVenue,
    fallbackSuggested: false,
  };
}
