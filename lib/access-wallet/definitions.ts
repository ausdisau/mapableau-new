import type { WalletCredentialDefinition } from "./types";

export const COMMUNICATION_PASSPORT_PRESENTATION_DEFINITION: WalletCredentialDefinition =
  {
    type: "communication_passport_presentation",
    issuerType: "mapable_synthetic",
    schemaId: "mapable.wallet.communication_passport_presentation.v1",
    requiredClaims: [
      "communicationMode",
      "processingTime",
      "aacRequirement",
      "selectedAssistanceInstructions",
      "expiry",
    ],
    optionalClaims: ["preferredLanguage"],
    prohibitedClaims: [
      "diagnosis",
      "homeAddress",
      "fullSupportHistory",
      "unrelatedAppointments",
    ],
    validityHours: 72,
    revocationMethod: "local_revoke",
    assuranceLevel: "synthetic",
    publicClaimState: "not_claimable",
  };

export function getCredentialDefinition(
  type: WalletCredentialDefinition["type"]
): WalletCredentialDefinition | null {
  if (type === "communication_passport_presentation") {
    return COMMUNICATION_PASSPORT_PRESENTATION_DEFINITION;
  }
  return null;
}
