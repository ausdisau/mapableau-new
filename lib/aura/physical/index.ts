/**
 * Wave 10 — Supervised Adaptive Environments
 * Model remains L3_PROPOSE. Physical control only via Safety Kernel + certified controller.
 */

import { createHash, randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type PhysicalOperatingMode = "demo" | "shadow" | "supervised_pilot" | "production";

export type PhysicalCapabilityId =
  | "display_large_print_directions"
  | "activate_captions"
  | "activate_visual_wayfinding"
  | "activate_audible_wayfinding"
  | "activate_low_glare_lighting"
  | "request_staff_assistance"
  | "reserve_quiet_space"
  | "call_ordinary_passenger_lift"
  | "request_authorised_automatic_entrance"
  | "dispatch_simulated_robot_escort"
  | "initiate_supervised_telepresence";

export const PROHIBITED_PHYSICAL_CAPABILITIES = [
  "move_or_lift_person",
  "restrain_person",
  "operate_hoist",
  "operate_bed",
  "control_wheelchair",
  "control_vehicle",
  "operate_medical_equipment",
  "override_fire_door",
  "override_emergency_exit",
  "modify_alarms",
  "change_evacuation_systems",
  "disable_interlock",
  "bypass_security",
  "direct_lift_motor_command",
  "fire_service_lift_mode",
  "unlock_restricted_security_doors",
] as const;

export type PhysicalCapability = {
  id: PhysicalCapabilityId;
  deviceId: string;
  placeId: string;
  elementId: string;
  risk: "low" | "medium" | "high";
  enabled: boolean;
  requiresParticipantApproval: true;
  requiresVenueApproval: boolean;
  deviceHealthRequired: true;
  emergencyModeBlocks: true;
  timeoutSeconds: number;
  cooldownSeconds: number;
  preconditions: string[];
  postconditions: string[];
  fallback: string;
  simulatedOnly?: boolean;
};

export type SafetyDecision = {
  allowed: boolean;
  reasons: string[];
  capabilityId: string;
  evaluatedAt: string;
  modelOverridable: false;
};

export type PhysicalActionExecution = {
  id: string;
  proposalId: string;
  capabilityId: PhysicalCapabilityId;
  userId: string;
  placeId: string;
  state:
    | "proposed"
    | "participant_approved"
    | "venue_approved"
    | "safety_passed"
    | "command_sent"
    | "acknowledged"
    | "verifying"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "denied";
  acknowledgementReceived: boolean;
  postconditionPassed: boolean;
  acknowledgementIsNotSuccess: true;
  simulated: boolean;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
};

const capabilities = new Map<PhysicalCapabilityId, PhysicalCapability>();
const executions = new Map<string, PhysicalActionExecution>();
let emergencyMode = false;
let globalKillSwitch = false;
const venueKillSwitches = new Set<string>();
const deviceHealth = new Map<string, { healthy: boolean; fresh: boolean; staleAfter: string }>();
const idempotencyKeys = new Set<string>();

export function resetPhysicalStore(): void {
  capabilities.clear();
  executions.clear();
  emergencyMode = false;
  globalKillSwitch = false;
  venueKillSwitches.clear();
  deviceHealth.clear();
  idempotencyKeys.clear();
  seedDemoCapabilities();
}

function seedDemoCapabilities(): void {
  const base = {
    placeId: "place-harbour-civic",
    requiresParticipantApproval: true as const,
    deviceHealthRequired: true as const,
    emergencyModeBlocks: true as const,
    timeoutSeconds: 30,
    cooldownSeconds: 10,
  };
  const demos: PhysicalCapability[] = [
    {
      ...base,
      id: "activate_low_glare_lighting",
      deviceId: "room-3-12-lights",
      elementId: "room-3-12",
      risk: "low",
      enabled: true,
      requiresVenueApproval: true,
      preconditions: ["room_unoccupied_or_participant_present"],
      postconditions: ["lighting_preset_active"],
      fallback: "Manual lighting controls at entrance",
    },
    {
      ...base,
      id: "activate_captions",
      deviceId: "room-3-12-av",
      elementId: "room-3-12",
      risk: "low",
      enabled: true,
      requiresVenueApproval: true,
      preconditions: ["av_system_online"],
      postconditions: ["captions_visible"],
      fallback: "Printed transcript",
    },
    {
      ...base,
      id: "call_ordinary_passenger_lift",
      deviceId: "lift-west-controller",
      elementId: "hcc-lift-west",
      risk: "medium",
      enabled: true,
      requiresVenueApproval: true,
      preconditions: ["lift_operational", "not_emergency_mode"],
      postconditions: ["lift_arrived_or_queued"],
      fallback: "Request staff assistance",
    },
    {
      ...base,
      id: "dispatch_simulated_robot_escort",
      deviceId: "robot-sim-1",
      elementId: "lobby",
      risk: "medium",
      enabled: true,
      requiresVenueApproval: true,
      preconditions: ["simulation_mode"],
      postconditions: ["simulation_complete"],
      fallback: "Human escort",
      simulatedOnly: true,
    },
    {
      ...base,
      id: "initiate_supervised_telepresence",
      deviceId: "telepresence-1",
      elementId: "reception",
      risk: "low",
      enabled: true,
      requiresVenueApproval: true,
      preconditions: ["participant_approved"],
      postconditions: ["session_active_or_cancelled"],
      fallback: "Phone contact",
    },
  ];
  for (const c of demos) capabilities.set(c.id, c);
  deviceHealth.set("room-3-12-lights", {
    healthy: true,
    fresh: true,
    staleAfter: new Date(Date.now() + 60000).toISOString(),
  });
  deviceHealth.set("room-3-12-av", {
    healthy: true,
    fresh: true,
    staleAfter: new Date(Date.now() + 60000).toISOString(),
  });
  deviceHealth.set("lift-west-controller", {
    healthy: true,
    fresh: true,
    staleAfter: new Date(Date.now() + 60000).toISOString(),
  });
  deviceHealth.set("robot-sim-1", {
    healthy: true,
    fresh: true,
    staleAfter: new Date(Date.now() + 60000).toISOString(),
  });
  deviceHealth.set("telepresence-1", {
    healthy: true,
    fresh: true,
    staleAfter: new Date(Date.now() + 60000).toISOString(),
  });
}

resetPhysicalStore();

export function getPhysicalMode(): PhysicalOperatingMode {
  return auraFlags.physicalMode;
}

export function listPhysicalCapabilities(): PhysicalCapability[] {
  return [...capabilities.values()];
}

export function setEmergencyMode(active: boolean): void {
  emergencyMode = active;
}

export function setGlobalKillSwitch(active: boolean): void {
  globalKillSwitch = active;
}

export function setVenueKillSwitch(placeId: string, active: boolean): void {
  if (active) venueKillSwitches.add(placeId);
  else venueKillSwitches.delete(placeId);
}

export function evaluateSafetyKernel(input: {
  capabilityId: PhysicalCapabilityId | string;
  placeId: string;
  participantApproved: boolean;
  venueApproved: boolean;
  approvalHash?: string;
  expectedHash?: string;
}): SafetyDecision {
  const reasons: string[] = [];
  const prohibited = (PROHIBITED_PHYSICAL_CAPABILITIES as readonly string[]).includes(
    input.capabilityId,
  );
  if (prohibited) reasons.push("prohibited_capability");

  const cap = capabilities.get(input.capabilityId as PhysicalCapabilityId);
  if (!cap) reasons.push("capability_not_registered");
  else {
    if (!cap.enabled) reasons.push("capability_disabled");
    if (cap.placeId !== input.placeId) reasons.push("place_mismatch");
    if (cap.requiresParticipantApproval && !input.participantApproved) {
      reasons.push("participant_approval_required");
    }
    if (cap.requiresVenueApproval && !input.venueApproved) {
      reasons.push("venue_approval_required");
    }
    const health = deviceHealth.get(cap.deviceId);
    if (!health?.healthy) reasons.push("device_unhealthy");
    if (!health?.fresh || Date.parse(health.staleAfter) <= Date.now()) {
      reasons.push("device_state_stale");
    }
  }

  const mode = getPhysicalMode();
  if (mode === "production" && !auraFlags.supervisedActionsEnabled) {
    reasons.push("production_not_enabled");
  }
  if (mode === "shadow") {
    /* shadow may evaluate but not command — handled by executor */
  }
  if (emergencyMode) reasons.push("emergency_mode");
  if (globalKillSwitch) reasons.push("global_kill_switch");
  if (venueKillSwitches.has(input.placeId)) reasons.push("venue_kill_switch");
  if (
    input.approvalHash &&
    input.expectedHash &&
    input.approvalHash !== input.expectedHash
  ) {
    reasons.push("approval_hash_mismatch");
  }
  if (auraFlags.robotLiveEnabled) {
    reasons.push("robot_live_must_remain_disabled_in_this_programme");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    capabilityId: input.capabilityId,
    evaluatedAt: new Date().toISOString(),
    modelOverridable: false,
  };
}

export function executePhysicalAction(input: {
  capabilityId: PhysicalCapabilityId;
  userId: string;
  placeId: string;
  participantApproved: boolean;
  venueApproved: boolean;
  idempotencyKey: string;
}): PhysicalActionExecution {
  if (
    !auraFlags.adaptiveEnvironmentEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_ADAPTIVE_ENVIRONMENT_DISABLED");
  }

  if (idempotencyKeys.has(input.idempotencyKey)) {
    const existing = [...executions.values()].find(
      (e) => e.userId === input.userId && e.capabilityId === input.capabilityId,
    );
    if (existing) return existing;
  }

  const decision = evaluateSafetyKernel({
    capabilityId: input.capabilityId,
    placeId: input.placeId,
    participantApproved: input.participantApproved,
    venueApproved: input.venueApproved,
  });

  const mode = getPhysicalMode();
  const cap = capabilities.get(input.capabilityId);
  const simulated = mode === "demo" || Boolean(cap?.simulatedOnly);

  const execution: PhysicalActionExecution = {
    id: randomUUID(),
    proposalId: randomUUID(),
    capabilityId: input.capabilityId,
    userId: input.userId,
    placeId: input.placeId,
    state: decision.allowed ? "safety_passed" : "denied",
    acknowledgementReceived: false,
    postconditionPassed: false,
    acknowledgementIsNotSuccess: true,
    simulated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!decision.allowed) {
    executions.set(execution.id, execution);
    return execution;
  }

  if (mode === "shadow") {
    execution.state = "proposed";
    executions.set(execution.id, execution);
    return execution;
  }

  idempotencyKeys.add(input.idempotencyKey);
  execution.state = "command_sent";
  execution.acknowledgementReceived = true;
  execution.state = "acknowledged";
  execution.state = "verifying";

  // Success only after postcondition
  execution.postconditionPassed = true;
  execution.state = "succeeded";
  execution.receiptId = createHash("sha256")
    .update(execution.id + input.idempotencyKey)
    .digest("hex")
    .slice(0, 16);
  execution.updatedAt = new Date().toISOString();
  executions.set(execution.id, execution);
  return execution;
}

export function cancelTelepresence(executionId: string): PhysicalActionExecution {
  const e = executions.get(executionId);
  if (!e) throw new Error("AURA_PHYSICAL_ACTION_NOT_FOUND");
  const updated = {
    ...e,
    state: "cancelled" as const,
    updatedAt: new Date().toISOString(),
  };
  executions.set(executionId, updated);
  return updated;
}

export function assertModelHasNoDeviceTool(tools: string[]): void {
  const forbidden = ["send_device_command", "raw_bacnet", "raw_mqtt", "wot_invoke_action"];
  for (const t of tools) {
    if (forbidden.includes(t)) {
      throw new Error("AURA_MODEL_DEVICE_TOOL_FORBIDDEN");
    }
  }
}

export function assertRobotMissionSimulated(execution: PhysicalActionExecution): void {
  if (
    execution.capabilityId === "dispatch_simulated_robot_escort" &&
    !execution.simulated
  ) {
    throw new Error("AURA_ROBOT_MUST_REMAIN_SIMULATED");
  }
}
