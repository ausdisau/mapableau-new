import type { AuraHandoffKind } from "@prisma/client";

/**
 * Handoff service. Handoffs (agent->agent, agent->human) carry an explicit
 * reason and structured context so the receiving side can consent to picking
 * up the work. Handoffs never elevate authority.
 */

export interface HandoffRequest {
  kind: AuraHandoffKind;
  fromAgentId?: string | null;
  toAgentId?: string | null;
  toHumanUserId?: string | null;
  contextJson: Record<string, unknown>;
  reason: string;
}

export type HandoffValidation =
  | { ok: true }
  | { ok: false; reason: string; code: HandoffDenyCode };

export type HandoffDenyCode =
  | "reason_missing"
  | "target_missing"
  | "self_handoff"
  | "authority_elevation_attempt";

export function validateHandoff(input: HandoffRequest): HandoffValidation {
  if (!input.reason || input.reason.trim().length === 0) {
    return { ok: false, reason: "handoff requires an explicit reason", code: "reason_missing" };
  }
  if (input.kind === "agent_to_agent" && !input.toAgentId) {
    return { ok: false, reason: "agent_to_agent handoff needs toAgentId", code: "target_missing" };
  }
  if (input.kind === "agent_to_human" && !input.toHumanUserId) {
    return { ok: false, reason: "agent_to_human handoff needs toHumanUserId", code: "target_missing" };
  }
  if (
    input.kind === "agent_to_agent" &&
    input.fromAgentId &&
    input.toAgentId &&
    input.fromAgentId === input.toAgentId
  ) {
    return { ok: false, reason: "cannot handoff to self", code: "self_handoff" };
  }
  const ctxJson = JSON.stringify(input.contextJson).toLowerCase();
  if (
    ctxJson.includes("grantauthority") ||
    ctxJson.includes("elevate_permissions") ||
    ctxJson.includes("release_killswitch")
  ) {
    return {
      ok: false,
      reason: "handoff context attempted to elevate authority",
      code: "authority_elevation_attempt",
    };
  }
  return { ok: true };
}
