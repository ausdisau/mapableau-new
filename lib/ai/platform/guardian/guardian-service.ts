import type {
  GuardianDecision,
  GuardianEvaluateRequest,
  GuardianModelSignal,
} from "./contracts";
import { auditGuardianDecision } from "./audit";
import { evaluateGuardianPolicy } from "./guardian-policy";

export type GuardianServiceEvaluateInput = GuardianEvaluateRequest & {
  requestId?: string;
  traceId?: string;
  /** Optional pre-computed signals (Phase 6 adapters). Must be model_inference. */
  modelSignals?: GuardianModelSignal[];
  /** When true, write AuditEvent (default true in API path). */
  writeAudit?: boolean;
};

export type GuardianServiceResult = {
  decision: GuardianDecision;
  continuation: {
    humanSupportAvailable: boolean;
    nonAiPathAvailable: boolean;
    message: string;
  };
  auditRef?: string;
};

function assertSignalsAreInferences(signals: GuardianModelSignal[]): void {
  for (const s of signals) {
    if (s.provenance !== "model_inference") {
      throw new Error("GUARDIAN_SIGNAL_PROVENANCE_INVALID");
    }
    if (
      /^(ALLOW|BLOCK|REPORTABLE|ABUSE_CONFIRMED|CAPACITY_LACKING)$/i.test(
        s.signalType
      ) ||
      s.signalType === "abuse_detected"
    ) {
      throw new Error("GUARDIAN_SIGNAL_TYPE_FORBIDDEN");
    }
  }
}

/**
 * Orchestrates Guardian evaluation. Callers must resolve actor/tenant/authority
 * server-side before invoking — never trust client authority claims alone.
 */
export async function evaluateGuardian(
  input: GuardianServiceEvaluateInput
): Promise<GuardianServiceResult> {
  const signals = input.modelSignals ?? [];
  assertSignalsAreInferences(signals);

  const decision = evaluateGuardianPolicy(input, signals);

  if (input.writeAudit !== false) {
    try {
      await auditGuardianDecision({
        decision,
        actorId: input.actorId,
        tenantId: input.tenantId,
        participantId: input.participantId,
        requestId: input.requestId,
        traceId: input.traceId,
        capabilityKey: input.capabilityKey,
      });
    } catch {
      // Audit failure must not raise AI authority; decision still returned.
    }
  }

  return {
    decision,
    continuation: {
      humanSupportAvailable: decision.explanation.humanSupportAvailable,
      nonAiPathAvailable: decision.explanation.nonAiPathAvailable,
      message: decision.explanation.plainLanguage,
    },
    auditRef: input.requestId ?? input.traceId,
  };
}
