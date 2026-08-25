export const STATE_CONFIDENCE_VALUES = [
  "KNOWN",
  "STALE",
  "UNKNOWN",
  "UNAVAILABLE",
] as const;

export type StateConfidence = (typeof STATE_CONFIDENCE_VALUES)[number];

export type CapabilityState = {
  endpointId: string;
  capabilityId: string;
  value: unknown;
  confidence: StateConfidence;
  observedAt: string | null;
  explanation?: string;
};

export type CapabilityEvidence = {
  endpointId: string;
  capabilityId: string;
  source: "SIMULATOR" | "ADAPTER" | "ROUTINE" | "USER";
  confidence: StateConfidence;
  observedAt: string | null;
  notes?: string;
};
