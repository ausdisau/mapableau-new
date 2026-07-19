export { accessWalletConfig } from "@/lib/config/access-wallet";

export * from "./types";
export {
  COMMUNICATION_PASSPORT_PRESENTATION_DEFINITION,
  getCredentialDefinition,
} from "./definitions";
export {
  AccessWalletError,
  assertProductionIssuanceDisabled,
  assertWalletEnabled,
  createPresentationRequest,
  presentCredential,
  recordPresentationConsent,
  revokePresentationConsent,
} from "./presentation";
export {
  issueSyntheticCommunicationPassportCredential,
  listStandardsAdapterStatuses,
  renderPrintablePassportPresentation,
} from "./synthetic-passport";
