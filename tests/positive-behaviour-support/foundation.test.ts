import { afterEach, describe, expect, it } from "vitest";

import {
  PBS_FLAG_ENV_VARS,
  PbsDisabledError,
  pbsConfig,
  requirePbsEnabled,
  requirePbsExternalModelEnabled,
} from "@/lib/config/positive-behaviour-support";
import {
  activatePbsPlan,
  assertAssistanceActionAllowed,
  assertModelCannotWriteCanonicalPlan,
  assertNoAiRestrictivePracticeAction,
  assertNoCapacityInferenceFromCommunicationStyle,
  assertPlanVersionMutable,
  assertQuestionnaireIsNotFba,
  assertUnknownRemainsUnknown,
  canTransitionPbsPlanStatus,
  containsForbiddenPublicClaim,
  defaultPbsAssistanceEngine,
  evaluateExternalModelPayload,
  evaluateFinalisationGates,
  evaluatePbsAccess,
  evaluateRestrictivePracticeGate,
  finalisePbsPlan,
  generatePbsExport,
  isPbsPlanVersionImmutable,
  questionnaireCannotFinaliseAssessment,
  sanitisePbsAuditMetadata,
  toImplementingProviderView,
  unansweredSections,
  validateExternalModelOutput,
  PBS_POSITIONING,
  PBS_SOURCE_DESCRIPTORS,
} from "@/lib/positive-behaviour-support";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  for (const key of PBS_FLAG_ENV_VARS) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = ORIGINAL_ENV[key];
  }
});

describe("PBS feature flags", () => {
  it("defaults all flags to false", () => {
    for (const key of PBS_FLAG_ENV_VARS) delete process.env[key];
    expect(pbsConfig.enabled).toBe(false);
    expect(pbsConfig.aiAssistanceEnabled).toBe(false);
    expect(pbsConfig.externalModelEnabled).toBe(false);
    expect(pbsConfig.publicClaimEnabled).toBe(false);
    expect(pbsConfig.publicClaimAllowed).toBe(false);
    expect(pbsConfig.authorityCeiling).toBe("DRAFT_ONLY");
  });

  it("refuses when disabled", () => {
    delete process.env.MAPABLE_PBS_ENABLED;
    expect(() => requirePbsEnabled()).toThrow(PbsDisabledError);
  });

  it("does not use NEXT_PUBLIC_ flag names", () => {
    for (const key of PBS_FLAG_ENV_VARS) {
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });

  it("keeps external model separately disabled", () => {
    process.env.MAPABLE_PBS_ENABLED = "true";
    process.env.MAPABLE_PBS_AI_ASSISTANCE_ENABLED = "true";
    delete process.env.MAPABLE_PBS_EXTERNAL_MODEL_ENABLED;
    expect(() => requirePbsExternalModelEnabled()).toThrow(PbsDisabledError);
  });
});

describe("PBS access control", () => {
  const baseCtx = {
    participantUserId: "part-1",
    organisationId: "org-a",
    assignedPractitionerUserId: "prac-1",
    implementingOrganisationId: "org-impl",
  };

  it("allows participant self access", () => {
    const d = evaluatePbsAccess(
      {
        userId: "part-1",
        role: "participant",
        organisationIds: [],
        isPlatformAdmin: false,
      },
      baseCtx,
      { needsClinical: true, action: "plan.read" },
    );
    expect(d.allowed).toBe(true);
    expect(d.fieldScope).toBe("full");
  });

  it("allows assigned practitioner within organisation only", () => {
    const ok = evaluatePbsAccess(
      {
        userId: "prac-1",
        role: "support_coordinator",
        organisationIds: ["org-a"],
        isPlatformAdmin: false,
      },
      baseCtx,
      { needsClinical: true, action: "plan.read" },
    );
    expect(ok.allowed).toBe(true);

    const denied = evaluatePbsAccess(
      {
        userId: "prac-1",
        role: "support_coordinator",
        organisationIds: ["org-other"],
        isPlatformAdmin: false,
      },
      { ...baseCtx, assignedPractitionerUserId: "prac-1" },
      { needsClinical: true, action: "plan.read" },
    );
    expect(denied.allowed).toBe(false);
  });

  it("requires valid ParticipantAuthorityGrant for delegates", () => {
    const expired = evaluatePbsAccess(
      {
        userId: "delegate-1",
        role: "family_member",
        organisationIds: [],
        isPlatformAdmin: false,
      },
      {
        ...baseCtx,
        grant: {
          granteeUserId: "delegate-1",
          granteeOrganisationId: null,
          status: "expired",
          expiresAt: new Date(Date.now() - 1000),
          allowedActions: ["plan.read"],
          purpose: "support",
        },
      },
      { needsClinical: true, action: "plan.read" },
    );
    expect(expired.allowed).toBe(false);

    const revoked = evaluatePbsAccess(
      {
        userId: "delegate-1",
        role: "family_member",
        organisationIds: [],
        isPlatformAdmin: false,
      },
      {
        ...baseCtx,
        grant: {
          granteeUserId: "delegate-1",
          granteeOrganisationId: null,
          status: "revoked",
          expiresAt: null,
          allowedActions: ["plan.read"],
          purpose: "support",
        },
      },
      { needsClinical: true, action: "plan.read" },
    );
    expect(revoked.allowed).toBe(false);

    const active = evaluatePbsAccess(
      {
        userId: "delegate-1",
        role: "family_member",
        organisationIds: [],
        isPlatformAdmin: false,
      },
      {
        ...baseCtx,
        grant: {
          granteeUserId: "delegate-1",
          granteeOrganisationId: null,
          status: "active",
          expiresAt: new Date(Date.now() + 60_000),
          allowedActions: ["plan.read"],
          purpose: "support",
        },
      },
      { needsClinical: true, action: "plan.read" },
    );
    expect(active.allowed).toBe(true);
    expect(active.purpose).toBe("delegate_grant");
  });

  it("limits implementing providers to implementation fields", () => {
    const d = evaluatePbsAccess(
      {
        userId: "worker-1",
        role: "support_worker",
        organisationIds: ["org-impl"],
        isPlatformAdmin: false,
      },
      baseCtx,
      { needsClinical: true, action: "implementation.read" },
    );
    expect(d.allowed).toBe(true);
    expect(d.fieldScope).toBe("implementation");
    expect(d.clinicalContentAllowed).toBe(false);

    const view = toImplementingProviderView({
      id: "a1",
      planId: "p1",
      status: "assigned",
      clinicalNotes: "SECRET",
      diagnosis: "SECRET",
      implementationInstructions: "Follow plan",
    });
    expect(view.clinicalNotes).toBeUndefined();
    expect(view.diagnosis).toBeUndefined();
    expect(view.implementationInstructions).toBe("Follow plan");
  });

  it("denies unrelated provider organisations", () => {
    const d = evaluatePbsAccess(
      {
        userId: "other",
        role: "provider_admin",
        organisationIds: ["org-x"],
        isPlatformAdmin: false,
      },
      baseCtx,
      { needsClinical: true, action: "plan.read" },
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/Unrelated|No assignment/);
  });

  it("denies ambient admin clinical content without break-glass", () => {
    const d = evaluatePbsAccess(
      {
        userId: "admin-1",
        role: "mapable_admin",
        organisationIds: [],
        isPlatformAdmin: true,
      },
      baseCtx,
      { needsClinical: true, action: "plan.read" },
    );
    expect(d.allowed).toBe(false);
    expect(d.clinicalContentAllowed).toBe(false);
  });

  it("allows break-glass clinical access", () => {
    const d = evaluatePbsAccess(
      {
        userId: "admin-1",
        role: "mapable_admin",
        organisationIds: [],
        isPlatformAdmin: true,
      },
      { ...baseCtx, breakGlassActive: true },
      { needsClinical: true, action: "plan.read" },
    );
    expect(d.allowed).toBe(true);
    expect(d.purpose).toBe("break_glass");
  });
});

describe("PBS plan lifecycle", () => {
  it("allows draft → assessment_in_progress → consultation → practitioner_review → finalised → active", () => {
    expect(canTransitionPbsPlanStatus("draft", "assessment_in_progress")).toBe(
      true,
    );
    expect(
      canTransitionPbsPlanStatus("assessment_in_progress", "consultation"),
    ).toBe(true);
    expect(canTransitionPbsPlanStatus("consultation", "practitioner_review")).toBe(
      true,
    );
    expect(canTransitionPbsPlanStatus("practitioner_review", "finalised")).toBe(
      true,
    );
    expect(canTransitionPbsPlanStatus("finalised", "active")).toBe(true);
  });

  it("rejects client-style illegal transitions", () => {
    expect(canTransitionPbsPlanStatus("draft", "active")).toBe(false);
    expect(canTransitionPbsPlanStatus("draft", "finalised")).toBe(false);
  });

  it("makes finalised versions immutable", () => {
    expect(isPbsPlanVersionImmutable("finalised")).toBe(true);
    expect(() => assertPlanVersionMutable("finalised")).toThrow(/immutable/);
  });

  it("enforces finalisation gates", () => {
    const incomplete = evaluateFinalisationGates({
      engagementActive: true,
      assignedPractitioner: true,
      verifiedSuitability: false,
      requiredAssessmentSections: true,
      consultationEvidence: true,
      participantFeedbackOrDocumentedReason: true,
      unresolvedConflictAcknowledged: true,
      practitionerDeclaration: true,
      currentSourceChecklistVersion: true,
      restrictivePracticeGatePassed: true,
    });
    expect(incomplete.ok).toBe(false);
    expect(incomplete.failures).toContain("verifiedSuitability");

    expect(() =>
      finalisePbsPlan({
        current: {
          status: "practitioner_review",
          planType: "interim",
          versionNumber: 1,
          finalisedAt: null,
        },
        checklist: {
          engagementActive: true,
          assignedPractitioner: true,
          verifiedSuitability: true,
          requiredAssessmentSections: true,
          consultationEvidence: true,
          participantFeedbackOrDocumentedReason: true,
          unresolvedConflictAcknowledged: true,
          practitionerDeclaration: true,
          currentSourceChecklistVersion: true,
          restrictivePracticeGatePassed: true,
        },
        finalisationFlagEnabled: false,
      }),
    ).toThrow(/disabled/);
  });

  it("blocks activation when RP authorisation gaps exist", () => {
    const gate = evaluateRestrictivePracticeGate({
      classification: "regulated_restrictive",
      jurisdiction: null,
      authorisationStatus: "gap_blocks_activation",
      consultationAccessibleFormatRecorded: false,
      leastRestrictiveChecked: false,
      lastResortChecked: false,
      proportionalityChecked: false,
      shortestDurationChecked: false,
      reductionEliminationPlanRecorded: false,
      monitoringReviewArrangementsRecorded: false,
      manualClassificationByPractitioner: false,
      aiDraftingSuspendedForSection: true,
    });
    expect(gate.activationBlocked).toBe(true);
    expect(gate.highPriorityPractitionerReview).toBe(true);
    expect(gate.aiDraftingSuspended).toBe(true);

    expect(() =>
      activatePbsPlan({
        current: {
          status: "finalised",
          planType: "comprehensive",
          versionNumber: 1,
          finalisedAt: new Date(),
        },
        rpGate: gate,
      }),
    ).toThrow(/block activation/);
  });
});

describe("PBS questionnaire and unknowns", () => {
  it("keeps unknown answers unknown", () => {
    expect(() => assertUnknownRemainsUnknown("unknown", "guessed")).toThrow(
      /unknown/,
    );
    expect(() => assertUnknownRemainsUnknown("unknown", null)).not.toThrow();
  });

  it("questionnaire alone cannot finalise assessment", () => {
    expect(questionnaireCannotFinaliseAssessment()).toBe(true);
  });

  it("rejects FBA claims from questionnaire", () => {
    expect(() =>
      assertQuestionnaireIsNotFba("functional behaviour assessment complete"),
    ).toThrow();
  });

  it("lists unanswered sections", () => {
    const missing = unansweredSections(["good_life"]);
    expect(missing).toContain("communication_decision_making");
    expect(missing).not.toContain("good_life");
  });
});

describe("PBS AI assistance boundary", () => {
  it("prohibits determining behaviour function and RP actions", () => {
    expect(() =>
      assertAssistanceActionAllowed("determine_behaviour_function"),
    ).toThrow();
    expect(() =>
      assertNoAiRestrictivePracticeAction("approve_restrictive_practice"),
    ).toThrow();
    expect(() =>
      assertNoAiRestrictivePracticeAction("recommend_restrictive_practice"),
    ).toThrow();
  });

  it("runs deterministic DRAFT_ONLY engine when flags on", async () => {
    process.env.MAPABLE_PBS_ENABLED = "true";
    process.env.MAPABLE_PBS_AI_ASSISTANCE_ENABLED = "true";
    const result = await defaultPbsAssistanceEngine.run({
      action: "identify_unanswered_sections",
      engagementId: "eng-1",
      knownSectionKeys: ["good_life"],
    });
    expect(result.authorityCeiling).toBe("DRAFT_ONLY");
    expect(result.externalModelUsed).toBe(false);
    expect(result.provider).toBe("deterministic_local");
    expect(result.proposals.length).toBeGreaterThan(0);
  });

  it("rejects raw personal information at external boundary", () => {
    process.env.MAPABLE_PBS_ENABLED = "true";
    process.env.MAPABLE_PBS_EXTERNAL_MODEL_ENABLED = "true";
    const denied = evaluateExternalModelPayload({
      placeholders: {},
      fields: [{ key: "ndisNumber", value: "430000000", allowlisted: false }],
    });
    expect(denied.allowed).toBe(false);
  });

  it("rejects free text without de-identification approval", () => {
    process.env.MAPABLE_PBS_ENABLED = "true";
    process.env.MAPABLE_PBS_EXTERNAL_MODEL_ENABLED = "true";
    const denied = evaluateExternalModelPayload({
      placeholders: { "{{PARTICIPANT}}": "P1" },
      fields: [{ key: "section_key", value: "good_life", allowlisted: true }],
      freeTextApprovedExact: "About {{PARTICIPANT}}",
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toMatch(/de-identification approval/);
  });

  it("rejects outputs that drop placeholders or include RP instructions", () => {
    expect(() =>
      validateExternalModelOutput({
        outputText: "The person likes gardening",
        requiredPlaceholders: ["{{PARTICIPANT}}"],
        containsRestrictivePracticeInstruction: false,
        introducesUnsupportedFacts: false,
      }),
    ).toThrow(/placeholder/);

    expect(() =>
      validateExternalModelOutput({
        outputText: "{{PARTICIPANT}} should be restrained",
        requiredPlaceholders: ["{{PARTICIPANT}}"],
        containsRestrictivePracticeInstruction: true,
        introducesUnsupportedFacts: false,
      }),
    ).toThrow(/restrictive/);
  });

  it("prevents model writes to final/active plans", () => {
    expect(() => assertModelCannotWriteCanonicalPlan("active")).toThrow();
    expect(() => assertModelCannotWriteCanonicalPlan("finalised")).toThrow();
  });
});

describe("PBS privacy and claims", () => {
  it("strips sensitive keys from audit metadata", () => {
    const clean = sanitisePbsAuditMetadata({
      correlationId: "c1",
      clinicalNotes: "secret",
      behaviourDescription: "secret",
      status: "draft",
    });
    expect(clean.clinicalNotes).toBeUndefined();
    expect(clean.behaviourDescription).toBeUndefined();
    expect(clean.status).toBe("draft");
  });

  it("forbids public capability claims in controlled pilot wording", () => {
    expect(containsForbiddenPublicClaim("Commission-approved PBS")).toBe(true);
    expect(PBS_POSITIONING).toMatch(/controlled-pilot/);
    expect(pbsConfig.publicClaimAllowed).toBe(false);
  });

  it("never infers capacity from communication style", () => {
    expect(() =>
      assertNoCapacityInferenceFromCommunicationStyle(true),
    ).toThrow();
  });

  it("exports include status and non-lodgement notice", () => {
    const exp = generatePbsExport({
      view: "participant_plain_language",
      planId: "p1",
      planType: "interim",
      status: "draft",
      versionNumber: 1,
      authoringPractitionerDisplay: "Practitioner",
      consultationStatus: "pending",
      reviewDate: null,
      aiAssisted: true,
      unresolvedInformation: ["sleep patterns"],
      restrictivePracticeStatus: null,
      bodySections: [{ title: "Good life", body: "Gardening" }],
      provenanceCount: 2,
    });
    expect(exp.html).toMatch(/not lodged with or approved by the NDIS Commission/i);
    expect(exp.structured.commissionLodgementClaim).toBe(false);
  });

  it("records regulatory sources without inventing hashes", () => {
    expect(PBS_SOURCE_DESCRIPTORS.length).toBeGreaterThanOrEqual(6);
    for (const s of PBS_SOURCE_DESCRIPTORS) {
      expect(s.sourceHash).toBeNull();
    }
  });
});
