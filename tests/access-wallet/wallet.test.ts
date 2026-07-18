import { afterEach, describe, expect, it } from "vitest";

import {
  accessWalletConfig,
  createPresentationRequest,
  issueSyntheticCommunicationPassportCredential,
  listStandardsAdapterStatuses,
  presentCredential,
  recordPresentationConsent,
  renderPrintablePassportPresentation,
} from "@/lib/access-wallet";
import type { CommunicationPassport } from "@/lib/communication-passport/types";

const samplePassport: CommunicationPassport = {
  participantId: "p1",
  version: 2,
  updatedAt: "2026-07-18T00:00:00.000Z",
  instructions: [
    {
      id: "i1",
      mode: "plain_language",
      participantWording: "Please use plain language",
      workerFacingWording: "Use plain language",
      required: true,
      sortOrder: 0,
    },
    {
      id: "i2",
      mode: "extra_response_time",
      participantWording: "I need extra time",
      workerFacingWording: "Allow extra response time",
      required: false,
      sortOrder: 1,
    },
  ],
  disclosableFieldKeys: ["plain_language", "extra_response_time"],
};

describe("Portable Access Wallet", () => {
  afterEach(() => {
    delete process.env.MAPABLE_ACCESS_WALLET_ENABLED;
    delete process.env.MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED;
    delete process.env.MAPABLE_OPENID4VCI_ENABLED;
    delete process.env.MAPABLE_OPENID4VP_ENABLED;
    delete process.env.MAPABLE_WALLET_PRODUCTION_ISSUANCE_ENABLED;
  });

  it("defaults fail-closed with no endorsement claim", () => {
    expect(accessWalletConfig.enabled).toBe(false);
    expect(accessWalletConfig.productionIssuanceEnabled).toBe(false);
    expect(accessWalletConfig.endorsementClaim).toBe("none");
    expect(accessWalletConfig.productionClaimStatus).toBe("not_claimable");
  });

  it("refuses prohibited diagnosis claims in presentation requests", () => {
    process.env.MAPABLE_ACCESS_WALLET_ENABLED = "true";
    expect(() =>
      createPresentationRequest({
        id: "req-bad",
        recipientId: "worker-1",
        requestingOrganisationId: "org-a",
        purpose: "visit_prep",
        exactRequestedClaims: ["communicationMode", "diagnosis"],
        mandatoryClaims: ["communicationMode"],
        optionalClaims: ["diagnosis"],
        expiresAtIso: "2026-07-19T00:00:00.000Z",
        onwardSharingRule: "prohibited",
        legalOrContractualBasis: "service_agreement",
        participantExplanation: "Worker wants diagnosis",
      })
    ).toThrow(/prohibited claims/);
  });

  it("issues synthetic passport credential and presents approved claims only", () => {
    process.env.MAPABLE_ACCESS_WALLET_ENABLED = "true";
    process.env.MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED = "true";

    const credential = issueSyntheticCommunicationPassportCredential({
      credentialId: "cred-1",
      passport: samplePassport,
      tenantId: "org1",
      issuerId: "mapable-synthetic",
      nowIso: "2026-07-18T00:00:00.000Z",
    });
    expect(credential.status).toBe("issued_synthetic");
    expect(credential.endorsementClaim).toBe("none");
    expect(credential.suitabilityEvaluated).toBe(false);
    expect(credential.claims).not.toHaveProperty("diagnosis");
    expect(credential.claims).not.toHaveProperty("homeAddress");

    const request = createPresentationRequest({
      id: "req-1",
      recipientId: "worker-1",
      requestingOrganisationId: "org-a",
      purpose: "visit_prep",
      exactRequestedClaims: [
        "communicationMode",
        "processingTime",
        "aacRequirement",
        "selectedAssistanceInstructions",
        "expiry",
      ],
      mandatoryClaims: ["communicationMode", "processingTime"],
      optionalClaims: [
        "aacRequirement",
        "selectedAssistanceInstructions",
        "expiry",
      ],
      expiresAtIso: "2026-07-19T00:00:00.000Z",
      onwardSharingRule: "purpose_bound",
      legalOrContractualBasis: "service_agreement",
      participantExplanation:
        "Share how you communicate for this visit only.",
    });

    const consent = recordPresentationConsent({
      id: "consent-1",
      request,
      participantId: "p1",
      approvedClaims: ["communicationMode", "processingTime", "aacRequirement"],
      rejectedClaims: ["selectedAssistanceInstructions", "expiry"],
    });

    const receipt = presentCredential({
      credential,
      consent,
      request,
      nowIso: "2026-07-18T01:00:00.000Z",
    });
    expect(receipt.verifierResult).toBe("accepted_synthetic");
    expect(receipt.fieldsShared).toEqual([
      "communicationMode",
      "processingTime",
      "aacRequirement",
    ]);
    expect(receipt.nonWalletAlternativeProvided).toBe(true);

    const printable = renderPrintablePassportPresentation({
      credential,
      fieldsShared: receipt.fieldsShared,
    });
    expect(printable).toMatch(/Not a government or NDIS/);
  });

  it("marks valid-but-unsuitable credentials without treating validity as suitability", () => {
    process.env.MAPABLE_ACCESS_WALLET_ENABLED = "true";
    process.env.MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED = "true";
    const credential = issueSyntheticCommunicationPassportCredential({
      credentialId: "cred-2",
      passport: samplePassport,
      tenantId: "org1",
      issuerId: "mapable-synthetic",
      nowIso: "2026-07-18T00:00:00.000Z",
    });
    const request = createPresentationRequest({
      id: "req-2",
      recipientId: "clinic-1",
      requestingOrganisationId: "org-clinic",
      purpose: "role_check",
      exactRequestedClaims: ["communicationMode"],
      mandatoryClaims: ["communicationMode"],
      optionalClaims: [],
      expiresAtIso: "2026-07-19T00:00:00.000Z",
      onwardSharingRule: "prohibited",
      legalOrContractualBasis: "none",
      participantExplanation: "Role suitability is separate.",
    });
    const consent = recordPresentationConsent({
      id: "consent-2",
      request,
      participantId: "p1",
      approvedClaims: ["communicationMode"],
      rejectedClaims: [],
    });
    const receipt = presentCredential({
      credential,
      consent,
      request,
      nowIso: "2026-07-18T01:00:00.000Z",
      roleContext: "clinical_decision_maker",
    });
    expect(receipt.verifierResult).toBe("unsuitable");
    expect(receipt.fieldsShared).toEqual([]);
  });

  it("lists standards adapters as non-production", () => {
    const adapters = listStandardsAdapterStatuses();
    expect(adapters.every((a) => a.productionReady === false)).toBe(true);
  });
});
