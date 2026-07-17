import type {
  ParticipantServiceStandard,
  ServiceStandardFieldKey,
} from "./types";

/**
 * Field-level selective disclosure — never dumps the full standard by default.
 */
export function selectShareableFields(
  standard: ParticipantServiceStandard,
  audience: "worker" | "provider" | "navigator",
): Array<{ key: ServiceStandardFieldKey; value: string; requirementLevel: string }> {
  return standard.fields
    .filter((field) => field.shareWith.includes(audience))
    .filter((field) => field.effectiveTo == null)
    .map((field) => ({
      key: field.key,
      value: field.value,
      requirementLevel: field.requirementLevel,
    }));
}

export function hardRequirements(
  standard: ParticipantServiceStandard,
): ServiceStandardFieldKey[] {
  return standard.fields
    .filter((f) => f.requirementLevel === "hard_requirement")
    .map((f) => f.key);
}
