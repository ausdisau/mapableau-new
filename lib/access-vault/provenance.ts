import type {
  PortableClaimCategory,
  PortableClaimProvenance,
} from "@prisma/client";

/**
 * Provenance model utilities.
 *
 * A `self_asserted` claim is a lived-experience statement. It never carries
 * the weight of a regulator-issued attestation. A `provider_asserted`
 * statement is signed by a specific organisation and is scoped to their
 * observation. `externally_verified` is reserved for content backed by a
 * third-party trust registry entry.
 *
 * The functions below apply defensive labels so participant-facing UI
 * cannot confuse the audience about the provenance strength.
 */

export function isVerifiedProvenance(p: PortableClaimProvenance): boolean {
  return p === "externally_verified" || p === "third_party_asserted";
}

export function provenanceStrength(p: PortableClaimProvenance): number {
  switch (p) {
    case "externally_verified":
      return 5;
    case "third_party_asserted":
      return 4;
    case "provider_asserted":
      return 3;
    case "platform_asserted":
      return 2;
    case "self_asserted":
      return 1;
    default: {
      const _exhaustive: never = p;
      return 0;
    }
  }
}

export function provenanceDisclaimer(
  p: PortableClaimProvenance,
  category: PortableClaimCategory
): string {
  const base = {
    self_asserted:
      "This is a lived-experience statement made by the participant. It is not verified by any third party.",
    platform_asserted:
      "This is a summary MapAble produced from platform activity. It is not a regulator attestation.",
    provider_asserted:
      "This was recorded by a MapAble-registered provider. Its scope is limited to that provider's observation.",
    third_party_asserted:
      "This was attested by a third party. Verify the attester before relying on it.",
    externally_verified:
      "This claim is backed by an external verifier in MapAble's trust registry. Confirm the verifier's scope in the trust registry.",
  } as const;
  const cat =
    category === "accessibility_preference"
      ? " Accessibility preferences describe functional need, not clinical diagnosis."
      : "";
  return base[p] + cat;
}
