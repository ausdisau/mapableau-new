import { createNavigatorEscalation } from "@/lib/ai/navigator/escalation/service";
import {
  assertRelationalCapability,
  RELATIONAL_AUDIT,
} from "@/lib/ai/relational/gates";
import {
  relationalTurnInputSchema,
  type AssistanceMode,
  type ParticipantControl,
  type RelationalTurnInput,
  type RelationalTurnResult,
} from "@/lib/ai/relational/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isRelationalIntelligenceEnabled } from "@/lib/config/relational-intelligence";

function resolveCapabilityForMode(
  mode: AssistanceMode,
  requestedKey: string,
): string {
  if (mode === "opt_out_ai" || mode === "human_only") {
    return "human.help.request";
  }
  if (requestedKey.startsWith("relational.")) {
    return requestedKey;
  }
  return requestedKey;
}

/**
 * Single relational handler entry — routes through capability gate before orchestrator work.
 */
export async function handleRelationalTurn(
  raw: RelationalTurnInput,
): Promise<RelationalTurnResult> {
  const input = relationalTurnInputSchema.parse(raw);
  const control: ParticipantControl = input.control;

  // Gap-closure: when relational pilot is off, defer to existing Navigator gates.
  if (!isRelationalIntelligenceEnabled()) {
    if (control.humanHelpRequested) {
      return {
        status: "escalate",
        reason: "human_help_requested_navigator_path",
        capabilityKey: "navigator.provider_search.escalate",
      };
    }
    return {
      status: "allowed",
      capabilityKey: input.capabilityKey,
      assistanceMode: control.assistanceMode,
    };
  }

  if (control.humanHelpRequested) {
    const helpGate = await assertRelationalCapability({
      capabilityKey: "human.help.request",
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      silent: input.silent,
    });
    if (!helpGate.allowed) {
      return {
        status: "blocked",
        reason: helpGate.reason,
        capabilityKey: "human.help.request",
      };
    }
    if (!input.silent) {
      await createAuditEvent({
        actorUserId: input.actorUserId,
        participantId: input.participantId,
        action: RELATIONAL_AUDIT.humanHelpRequested,
        entityType: "RelationalTurn",
        entityId: input.sessionId ?? input.participantId,
        metadata: { assistanceMode: control.assistanceMode },
      });
    }
    if (input.sessionId) {
      try {
        await createNavigatorEscalation({
          tenantId: input.tenantId,
          participantId: input.participantId,
          actorUserId: input.actorUserId,
          sessionId: input.sessionId,
          reason: "participant_request",
          note: (input.goalText ?? "Human help requested").slice(0, 500),
        });
      } catch {
        // Escalation requires Navigator pilot; audit already recorded.
      }
    }
    return {
      status: "escalate",
      reason: "human_help_requested",
      capabilityKey: "human.help.request",
    };
  }

  if (control.aiOptedOut || control.assistanceMode === "opt_out_ai") {
    return {
      status: "allowed",
      capabilityKey: "relational.explain",
      assistanceMode: "opt_out_ai",
    };
  }

  const capabilityKey = resolveCapabilityForMode(
    control.assistanceMode,
    input.capabilityKey,
  );

  const gate = await assertRelationalCapability({
    capabilityKey,
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    silent: input.silent,
  });

  if (!gate.allowed) {
    return { status: "blocked", reason: gate.reason, capabilityKey };
  }

  return {
    status: "allowed",
    capabilityKey,
    assistanceMode: control.assistanceMode,
  };
}
