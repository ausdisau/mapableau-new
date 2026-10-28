import {
  projectHopeDclmfInputSchema,
  type DclmfProjectedMemory,
  type ProjectHopeDclmfInput,
} from "@mapable/contracts";

import { compareMemoryAuthority } from "@/lib/dc-lmf/policy";

export type ProjectHopePersonContext = {
  scenarioId: string;
  participantId: string;
  baseline: DclmfProjectedMemory[];
  access: DclmfProjectedMemory[];
  preferences: DclmfProjectedMemory[];
  relational: DclmfProjectedMemory[];
  corrections: DclmfProjectedMemory[];
  evidence: DclmfProjectedMemory[];
  authority: "context_only";
  mayAlterClinicalState: false;
  mayCreateConsent: false;
  mayInferCapacity: false;
};

export function buildProjectHopeSyntheticContext(
  input: ProjectHopeDclmfInput,
): ProjectHopePersonContext {
  const parsed = projectHopeDclmfInputSchema.parse(input);

  const records = parsed.records
    .filter((record) => record.status === "active")
    .sort(compareMemoryAuthority);

  const byCategory = (category: DclmfProjectedMemory["category"]) =>
    records.filter((record) => record.category === category);

  return {
    scenarioId: parsed.scenarioId,
    participantId: parsed.participantId,
    baseline: byCategory("baseline"),
    access: byCategory("access"),
    preferences: byCategory("preference"),
    relational: byCategory("relational"),
    corrections: byCategory("correction"),
    evidence: byCategory("evidence"),
    authority: "context_only",
    mayAlterClinicalState: false,
    mayCreateConsent: false,
    mayInferCapacity: false,
  };
}
