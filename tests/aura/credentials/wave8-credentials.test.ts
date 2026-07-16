import { afterEach, describe, expect, it } from "vitest";

import {
  assertCredentialDoesNotCreateConsent,
  consumePresentation,
  createAccessCapsule,
  createAgentRequest,
  createAndPlanMission,
  createPresentation,
  draftHumanAssistance,
  approveHumanAssistance,
  evaluateWave7ReleaseGate,
  evaluateWave8ReleaseGate,
  issueCredential,
  previewCapsuleDisclosure,
  recoverWallet,
  registerAgent,
  registerIssuer,
  registerSchema,
  registerWalletDevice,
  requireMission,
  resetAccessCapsuleStore,
  resetAgentCoordinationStore,
  resetCredentialStore,
  resetGuardianStore,
  resetHumanAssistanceStore,
  resetLeaseStore,
  resetMissionStore,
  resetProposalStore,
  resetStopRegistry,
  resetWitnessStore,
  resetWorldModelStore,
  respondToAgentRequest,
  revokeCredential,
  setWave6ReleaseGatePassed,
  setWave7ReleaseGatePassed,
  validateAgentResponse,
  verifyCredential,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetWorldModelStore();
  resetGuardianStore();
  resetProposalStore();
  resetStopRegistry();
  resetCredentialStore();
  resetAccessCapsuleStore();
  resetAgentCoordinationStore();
  resetHumanAssistanceStore();
}

afterEach(resetAll);

describe("Wave 8 — credentials and Access Capsules", () => {
  it("issuer trust is separate from signature; revoked fails", () => {
    setWave6ReleaseGatePassed(true);
    setWave7ReleaseGatePassed(true);
    const schema = registerSchema({
      schemaId: "access-requirement-v1",
      version: "1.0",
      name: "Access requirement presentation",
      claimTypes: ["step_free", "min_clear_width_mm", "written_directions"],
    });
    const issuer = registerIssuer({
      did: "did:mapable:issuer-demo",
      name: "MapAble Demo Issuer",
      trustState: "trusted",
      publicKeyRef: "key-demo",
    });
    const credential = issueCredential({
      schemaId: schema.id,
      issuerId: issuer.id,
      holderUserId: "taylor",
      claims: {
        step_free: true,
        min_clear_width_mm: 850,
        written_directions: true,
        diagnosis: "must-not-be-disclosed-in-capsule",
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(verifyCredential(credential.id).valid).toBe(true);
    expect(verifyCredential(credential.id).createsConsent).toBe(false);

    revokeCredential(credential.id);
    expect(verifyCredential(credential.id).valid).toBe(false);
    expect(verifyCredential(credential.id).reasons).toContain("revoked");
  });

  it("Access Capsule is field-specific and omits diagnosis", () => {
    setWave7ReleaseGatePassed(true);
    const schema = registerSchema({
      schemaId: "access-requirement-v1",
      version: "1.0",
      name: "Access requirement",
      claimTypes: ["step_free", "min_clear_width_mm"],
    });
    const issuer = registerIssuer({
      did: "did:mapable:issuer-demo",
      name: "Issuer",
      trustState: "trusted",
      publicKeyRef: "key-demo",
    });
    const credential = issueCredential({
      schemaId: schema.id,
      issuerId: issuer.id,
      holderUserId: "taylor",
      claims: {
        step_free: true,
        min_clear_width_mm: 850,
        written_directions: true,
        assistance_at_reception: true,
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const capsule = createAccessCapsule({
      userId: "taylor",
      recipient: "Harbour Civic Centre",
      verifierIdentity: "venue-verifier-1",
      purpose: "Interview arrival assistance",
      credentialId: credential.id,
      claimsDisclosed: [
        "step_free",
        "min_clear_width_mm",
        "written_directions",
        "assistance_at_reception",
      ],
    });
    const preview = previewCapsuleDisclosure(capsule);
    expect(preview.shared).toContain("step_free");
    expect(preview.omitted).toContain("diagnosis");
    expect(capsule.createsConsent).toBe(false);
    assertCredentialDoesNotCreateConsent({
      ...capsule,
      credentialId: credential.id,
      disclosedClaims: capsule.claimsDisclosed,
      omittedClaims: capsule.claimsOmitted,
      issuedAt: capsule.issueTime,
      expiresAt: capsule.expiry,
      oneTime: true,
      used: false,
      revoked: false,
      verifierChallenge: capsule.verifierChallenge,
      consentCreated: false,
      id: capsule.presentationId,
      recipient: capsule.recipient,
      purpose: capsule.purpose,
    });
  });

  it("presentation replay is prevented", () => {
    setWave7ReleaseGatePassed(true);
    const schema = registerSchema({
      schemaId: "s",
      version: "1",
      name: "s",
      claimTypes: ["step_free"],
    });
    const issuer = registerIssuer({
      did: "did:x",
      name: "x",
      trustState: "trusted",
      publicKeyRef: "k",
    });
    const credential = issueCredential({
      schemaId: schema.id,
      issuerId: issuer.id,
      holderUserId: "u",
      claims: { step_free: true },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const presentation = createPresentation({
      credentialId: credential.id,
      holderUserId: "u",
      disclosedClaims: ["step_free"],
      recipient: "venue",
      purpose: "arrival",
      oneTime: true,
    });
    const first = consumePresentation({
      presentationId: presentation.id,
      challenge: presentation.verifierChallenge,
      verifierId: "v1",
    });
    expect(first.accepted).toBe(true);
    const second = consumePresentation({
      presentationId: presentation.id,
      challenge: presentation.verifierChallenge,
      verifierId: "v1",
    });
    expect(second.accepted).toBe(false);
    expect(second.reasons).toContain("replay");
  });

  it("wallet recovery and non-wallet fallback", () => {
    registerWalletDevice({
      userId: "taylor",
      deviceId: "device-1",
      recoveryMethod: "passphrase",
    });
    expect(recoverWallet("taylor").recovered).toBe(true);
    expect(recoverWallet("unknown").nonWalletFallbackAvailable).toBe(true);
  });

  it("agent coordination is typed, signed, and non-executing", () => {
    setWave7ReleaseGatePassed(true);
    registerAgent({
      agentId: "participant-aura",
      organisationId: "org-p",
      role: "participant_aura",
      trustState: "trusted",
      publicKeyRef: "pk-p",
    });
    registerAgent({
      agentId: "venue-hcc",
      organisationId: "org-v",
      role: "venue_agent",
      trustState: "trusted",
      publicKeyRef: "pk-v",
    });
    const request = createAgentRequest({
      requesterAgentId: "participant-aura",
      recipientAgentId: "venue-hcc",
      participantMandateReference: "mandate-1",
      purposeCode: "access.venue_status",
      allowedQuestionTypes: ["lift_status", "entrance_status"],
      requestedClaims: ["entrance_b", "lift_west", "reception_assistance"],
    });
    respondToAgentRequest({
      requestId: request.id,
      responderAgentId: "venue-hcc",
      status: "partially_answered",
      claims: [
        {
          claimType: "entrance_b",
          value: "available",
          evidenceReferences: ["ev-1"],
          confidence: 0.9,
        },
        {
          claimType: "lift_west",
          value: "unavailable",
          evidenceReferences: ["obs-1"],
          confidence: 0.95,
        },
      ],
      unknowns: ["alternative_lift"],
    });
    const validated = validateAgentResponse({ requestId: request.id });
    expect(validated.accepted).toBe(true);
    expect(validated.executesAutomatically).toBe(false);
    expect(validated.response?.unknowns).toContain("alternative_lift");
  });

  it("human assistance requires participant approval", () => {
    const draft = draftHumanAssistance({
      userId: "taylor",
      role: "accessibility_officer",
      recipientLabel: "Harbour accessibility officer",
      purpose: "Confirm alternative route during lift outage",
      fieldsShared: ["step_free_required", "arrival_time"],
      expectedResponse: "Route confirmation or staff meet",
      fallback: "Call venue reception",
    });
    expect(draft.participantApproved).toBe(false);
    expect(draft.diagnosisDisclosed).toBe(false);
    const approved = approveHumanAssistance({
      requestId: draft.id,
      userId: "taylor",
    });
    expect(approved.participantApproved).toBe(true);
    expect(approved.queueState).toBe("queued");
  });

  it("Wave 7 and Wave 8 gates pass in test", () => {
    setWave6ReleaseGatePassed(true);
    setWave7ReleaseGatePassed(true);
    expect(evaluateWave7ReleaseGate().passed).toBe(true);
    expect(evaluateWave8ReleaseGate().passed).toBe(true);
  });
});
