export type DataClassificationLevel =
  | "identity_data"
  | "personal_information"
  | "sensitive_information"
  | "health_information"
  | "ephi_possible";

export function isEphiPossible(
  classification: DataClassificationLevel
): boolean {
  return (
    classification === "health_information" ||
    classification === "ephi_possible"
  );
}
