/**
 * Encryption policy — WHICH data classes REQUIRE envelope encryption at rest.
 * This is design intent for Wave 8. The presence of a `TenantEncryptionProfile`
 * DOES NOT prove custody or KMS integration.
 */

export type EncryptionRequirement =
  | "mandatory"
  | "recommended"
  | "not_required";

export function encryptionRequirementFor(
  classification:
    | "participant_data"
    | "worker_data"
    | "claim_and_funding_data"
    | "organisation_operational_data"
    | "platform_operational_data"
    | "anonymised_aggregate"
    | "public_reference"
): EncryptionRequirement {
  switch (classification) {
    case "participant_data":
    case "claim_and_funding_data":
      return "mandatory";
    case "worker_data":
      return "mandatory";
    case "organisation_operational_data":
      return "recommended";
    case "platform_operational_data":
      return "recommended";
    case "anonymised_aggregate":
      return "not_required";
    case "public_reference":
      return "not_required";
    default: {
      const _exhaustive: never = classification;
      return _exhaustive;
    }
  }
}
