import type {
  DclmfDataClass,
  DclmfProjectedMemory,
  DclmfSourceType,
} from "@mapable/contracts";

const SOURCE_AUTHORITY: Record<DclmfSourceType, number> = {
  self_report: 100,
  aac: 100,
  simulation_author: 80,
  clinician: 65,
  record: 60,
  sensor: 55,
  supporter: 50,
  system: 40,
  model_inference: 10,
};

const DATA_CLASS_RANK: Record<DclmfDataClass, number> = {
  public: 0,
  project_internal: 1,
  person_private: 2,
  sensitive_personal: 3,
  health_related: 4,
  emergency_only: 5,
  local_only: 6,
};

const INLINE_PERSISTENCE_ALLOWED = new Set<DclmfDataClass>([
  "public",
  "project_internal",
  "person_private",
]);

export function sourceAuthorityRank(sourceType: DclmfSourceType): number {
  return SOURCE_AUTHORITY[sourceType];
}

export function dataClassRank(dataClass: DclmfDataClass): number {
  return DATA_CLASS_RANK[dataClass];
}

export function mayInlinePersist(dataClass: DclmfDataClass): boolean {
  return INLINE_PERSISTENCE_ALLOWED.has(dataClass);
}

export function isWithinDataClass(
  candidate: DclmfDataClass,
  maximum: DclmfDataClass,
): boolean {
  return dataClassRank(candidate) <= dataClassRank(maximum);
}

export function compareMemoryAuthority(
  left: Pick<DclmfProjectedMemory, "sourceType" | "observedAt">,
  right: Pick<DclmfProjectedMemory, "sourceType" | "observedAt">,
): number {
  const rankDelta =
    sourceAuthorityRank(right.sourceType) - sourceAuthorityRank(left.sourceType);
  if (rankDelta !== 0) return rankDelta;

  const leftTime = left.observedAt ? Date.parse(left.observedAt) : 0;
  const rightTime = right.observedAt ? Date.parse(right.observedAt) : 0;
  return rightTime - leftTime;
}

/**
 * Communication invariant: no response carries no semantic meaning unless an
 * explicit communication contract assigns one.
 */
export function interpretNoResponse(input: {
  communicationContractMeaning?: string | null;
}): { status: "known" | "unknown"; meaning: string | null } {
  if (input.communicationContractMeaning?.trim()) {
    return {
      status: "known",
      meaning: input.communicationContractMeaning.trim(),
    };
  }
  return { status: "unknown", meaning: null };
}

export function assertPersistableMemory(input: {
  dataClass: DclmfDataClass;
  payload: unknown;
  payloadRef?: string | null;
  sourceType: DclmfSourceType;
  scope: string;
}): void {
  if (!mayInlinePersist(input.dataClass) && input.payload != null) {
    throw new Error("DC_LMF_VAULT_REFERENCE_REQUIRED");
  }
  if (!mayInlinePersist(input.dataClass) && !input.payloadRef) {
    throw new Error("DC_LMF_VAULT_REFERENCE_REQUIRED");
  }
  if (input.sourceType === "model_inference" && input.scope === "persistent") {
    throw new Error("DC_LMF_MODEL_INFERENCE_NOT_PERSISTENT_AUTHORITY");
  }
}
