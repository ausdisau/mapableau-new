import { createHash, randomUUID } from "node:crypto";

import { PhysicalSystemsError } from "../errors";
import { isProhibitedAction } from "../prohibited";
import type { DeviceCapability, FallbackPlan, PhysicalActionProposal } from "../schemas";

export type CreateProposalInput = {
  placeId: string;
  userId: string;
  capability: DeviceCapability;
  rationale: string;
  parameters?: Record<string, unknown>;
  fallback?: FallbackPlan;
  ttlMs?: number;
  now?: Date;
};

/** Stable JSON stringify with sorted object keys. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortValue(obj[key]);
  }
  return sorted;
}

export function hashProposal(
  proposal: Omit<PhysicalActionProposal, "proposalHash"> | PhysicalActionProposal,
): string {
  const { proposalHash: _ignored, ...rest } = proposal as PhysicalActionProposal & {
    proposalHash?: string;
  };
  const digest = createHash("sha256").update(stableStringify(rest)).digest("hex");
  return digest.slice(0, 32);
}

export function createPhysicalActionProposal(
  input: CreateProposalInput,
): PhysicalActionProposal {
  if (isProhibitedAction(input.capability.actionType)) {
    throw new PhysicalSystemsError(
      "PROHIBITED_ACTION",
      `Cannot propose prohibited action type ${input.capability.actionType}.`,
      undefined,
      { actionType: input.capability.actionType },
    );
  }

  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? 15 * 60 * 1000;
  const base: Omit<PhysicalActionProposal, "proposalHash"> = {
    id: `prop-${randomUUID()}`,
    placeId: input.placeId,
    userId: input.userId,
    capabilityId: input.capability.id,
    deviceId: input.capability.deviceId,
    actionType: input.capability.actionType,
    risk: input.capability.risk,
    rationale: input.rationale,
    parameters: input.parameters ?? {},
    requireUserApproval: input.capability.requireUserApproval,
    requireVenueApproval: input.capability.requireVenueApproval,
    requireEmergencyModeOff: input.capability.requireEmergencyModeOff,
    simulatedOnly: input.capability.simulatedOnly,
    clearlySimulated: input.capability.clearlySimulated,
    fallback: input.fallback,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    fictionalNotice:
      input.capability.fictionalNotice ??
      "Fictional / simulated physical action for Access Intelligence demonstration.",
  };

  const proposalHash = hashProposal(base);
  return { ...base, proposalHash };
}
