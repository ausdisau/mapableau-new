import type { AuraMemoryClass, AuraMemoryScope } from "@prisma/client";

/**
 * Memory policy. AURA never auto-saves memory items from model output. Every
 * persistent memory row is written by an explicit participant action and
 * classified into one of the allow-listed classes. Prohibited classes are
 * rejected outright.
 */

export interface MemoryWriteRequest {
  participantId: string;
  scope: AuraMemoryScope;
  memoryClass: AuraMemoryClass;
  key: string;
  valueJson: Record<string, unknown>;
  writtenByModel: boolean;
  participantConfirmed: boolean;
}

export type MemoryDecision =
  | { verdict: "allowed"; sanitisedValue: Record<string, unknown> }
  | { verdict: "denied"; reason: string; code: MemoryDenyCode };

export type MemoryDenyCode =
  | "auto_save_from_model_output"
  | "prohibited_memory_class"
  | "not_participant_confirmed"
  | "value_missing"
  | "key_missing";

const PROHIBITED_KEY_PATTERNS: RegExp[] = [
  /medical_diagnosis/i,
  /legal_advice/i,
  /kill_switch/i,
  /permission_grant/i,
  /credentials?/i,
  /password/i,
];

export function assessMemoryWrite(input: MemoryWriteRequest): MemoryDecision {
  if (!input.key) {
    return { verdict: "denied", reason: "memory key missing", code: "key_missing" };
  }
  if (!input.valueJson || typeof input.valueJson !== "object") {
    return { verdict: "denied", reason: "memory value missing", code: "value_missing" };
  }
  if (input.memoryClass === "prohibited") {
    return {
      verdict: "denied",
      reason: "prohibited memory class cannot be persisted",
      code: "prohibited_memory_class",
    };
  }
  if (PROHIBITED_KEY_PATTERNS.some((r) => r.test(input.key))) {
    return {
      verdict: "denied",
      reason: `memory key '${input.key}' looks like a prohibited class`,
      code: "prohibited_memory_class",
    };
  }
  if (input.writtenByModel) {
    return {
      verdict: "denied",
      reason:
        "AURA does not auto-save memory produced by the model. A participant confirmation is required.",
      code: "auto_save_from_model_output",
    };
  }
  if (input.scope === "participant_persistent" && !input.participantConfirmed) {
    return {
      verdict: "denied",
      reason:
        "Participant-persistent memory requires an explicit participant confirmation.",
      code: "not_participant_confirmed",
    };
  }
  return { verdict: "allowed", sanitisedValue: input.valueJson };
}
