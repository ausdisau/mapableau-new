import type { AuraSafetyHoldReason } from "@prisma/client";

/**
 * Safety interlocks. Any of the following pause AURA for a scope:
 *
 *   - Participant explicitly presses pause (`participant_paused`)
 *   - Consent withdrawal detected via Wave 9 (`consent_withdrawn`)
 *   - Global or scoped kill switch flipped (`kill_switch`)
 *   - Safety officer initiates a manual hold (`safety_officer_hold`)
 *   - Incident declared for the participant/agent (`incident_declared`)
 *   - Policy breach detected (`policy_breach`)
 *
 * Kill-switch release requires a human safety officer — AURA cannot lift its
 * own hold, even with an approval envelope.
 */

export interface SafetyHoldQuery {
  agentId?: string | null;
  participantId?: string | null;
}

export interface SafetyHoldRecord {
  id: string;
  reason: AuraSafetyHoldReason;
  status: "active" | "released" | "expired";
  affectsAgentId: string | null;
  affectsParticipantId: string | null;
}

export function isBlockedBySafetyHold(
  holds: SafetyHoldRecord[],
  query: SafetyHoldQuery
): SafetyHoldRecord | null {
  for (const hold of holds) {
    if (hold.status !== "active") continue;
    const agentMatches =
      hold.affectsAgentId === null || hold.affectsAgentId === query.agentId;
    const participantMatches =
      hold.affectsParticipantId === null ||
      hold.affectsParticipantId === query.participantId;
    if (agentMatches && participantMatches) return hold;
  }
  return null;
}

export function canReleaseHold(
  hold: SafetyHoldRecord,
  releaser: { userId: string; isSafetyOfficer: boolean; isAgent: boolean }
): { ok: true } | { ok: false; reason: string } {
  if (releaser.isAgent) {
    return {
      ok: false,
      reason: "AURA agents cannot release their own safety holds.",
    };
  }
  if (hold.reason === "kill_switch" && !releaser.isSafetyOfficer) {
    return {
      ok: false,
      reason: "Only a human safety officer may release a kill-switch hold.",
    };
  }
  if (hold.status !== "active") {
    return { ok: false, reason: `Hold is ${hold.status}, not active.` };
  }
  return { ok: true };
}
