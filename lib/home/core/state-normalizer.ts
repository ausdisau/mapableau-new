import type { CapabilityState, StateConfidence } from "../contracts/state";

/** Preserve UNKNOWN / UNAVAILABLE — never invent boolean false or availability. */
export function normalizeCapabilityState(input: {
  endpointId: string;
  capabilityId: string;
  value: unknown;
  confidence: StateConfidence;
  observedAt: string | null;
  explanation?: string;
}): CapabilityState {
  if (input.confidence === "UNKNOWN" || input.confidence === "UNAVAILABLE") {
    return {
      endpointId: input.endpointId,
      capabilityId: input.capabilityId,
      value: null,
      confidence: input.confidence,
      observedAt: input.observedAt,
      explanation:
        input.explanation ??
        `State is ${input.confidence}; MapAble will not invent a value.`,
    };
  }

  return {
    endpointId: input.endpointId,
    capabilityId: input.capabilityId,
    value: input.value,
    confidence: input.confidence,
    observedAt: input.observedAt,
    explanation: input.explanation,
  };
}

export function isUsableKnownState(state: CapabilityState): boolean {
  return state.confidence === "KNOWN" || state.confidence === "STALE";
}
