import { describe, expect, it } from "vitest";

import {
  ASSISTANCE_MODES,
  PARTICIPANT_CONTROLS,
  RELATIONAL_CONSTITUTION_RULES,
  RELATIONAL_CONSTITUTION_VERSION,
  RELATIONAL_CONTRACT_FIXTURES,
  RELATIONAL_POLICY_VERSION,
  applyInterpretationCorrection,
  assertConsentPurposeUsable,
  canConfirmInterpretation,
  communicationPreferenceSchema,
  decideImmediateControl,
  decisionPassportSchema,
  explicitSelfReportSchema,
  isCommunicationPreferenceExpired,
  isImmediateStopControl,
  policyForLongPause,
  structuredInterpretationSchema,
} from "@/lib/ai/relational";

describe("Relational Intelligence Prompt 02 — constitution", () => {
  it("ships a versioned constitution with required rule coverage", () => {
    expect(RELATIONAL_CONSTITUTION_VERSION).toBe("relational-constitution.v0.1");
    expect(RELATIONAL_CONSTITUTION_RULES.length).toBeGreaterThanOrEqual(12);
    const keys = RELATIONAL_CONSTITUTION_RULES.map((r) => r.ruleKey);
    expect(keys).toEqual(
      expect.arrayContaining(["RC-005", "RC-008", "RC-012"]),
    );
  });
});

describe("Relational Intelligence Prompt 02 — enums", () => {
  it("rejects unknown assistance modes and controls", () => {
    expect(ASSISTANCE_MODES).toContain("LISTEN");
    expect(PARTICIPANT_CONTROLS).toContain("STOP");
    expect(() =>
      decisionPassportSchema.parse({
        ...RELATIONAL_CONTRACT_FIXTURES.validDecisionPassport,
        assistanceMode: "HUG",
      }),
    ).toThrow();
  });
});

describe("Relational Intelligence Prompt 02 — confirmation and correction", () => {
  it("cannot confirm interpretation without participant or authorised-human evidence", () => {
    const interp = structuredInterpretationSchema.parse(
      RELATIONAL_CONTRACT_FIXTURES.validInterpretationUnconfirmed,
    );
    expect(canConfirmInterpretation(interp, {})).toBe(false);
    expect(
      canConfirmInterpretation(interp, { participantConfirmed: true }),
    ).toBe(true);
  });

  it("creates an auditable correction revision without erasing history", () => {
    const current = structuredInterpretationSchema.parse(
      RELATIONAL_CONTRACT_FIXTURES.validInterpretationUnconfirmed,
    );
    const next = applyInterpretationCorrection({
      current,
      correctionNote: "Suburb is wrong",
      nextFields: { helpWanted: "explain_options", suburb: "Brunswick" },
    });
    expect(next.revision).toBe(current.revision + 1);
    expect(next.previousRevisionRef).toBe(`rev:${current.revision}`);
    expect(next.confirmationState).toBe("corrected");
  });
});

describe("Relational Intelligence Prompt 02 — consent purposes", () => {
  it("rejects withdrawn and wrong-purpose consent reuse", () => {
    expect(
      assertConsentPurposeUsable(
        RELATIONAL_CONTRACT_FIXTURES.withdrawnConsentGrant,
      ),
    ).toEqual({ ok: false, reason: "withdrawn" });
    expect(
      assertConsentPurposeUsable(
        RELATIONAL_CONTRACT_FIXTURES.serviceDoesNotImplyTraining,
      ),
    ).toEqual({ ok: false, reason: "wrong_purpose" });
  });

  it("allows matching service purpose when granted", () => {
    expect(
      assertConsentPurposeUsable({
        grantedPurposes: ["relational.service_assistance"],
        requiredPurpose: "relational.service_assistance",
      }),
    ).toEqual({ ok: true });
  });
});

describe("Relational Intelligence Prompt 02 — prohibited fields", () => {
  it("rejects derived labels on explicit self-report", () => {
    expect(() =>
      explicitSelfReportSchema.parse(
        RELATIONAL_CONTRACT_FIXTURES.invalidSelfReportWithDerivedLabel,
      ),
    ).toThrow();
    expect(
      explicitSelfReportSchema.parse(
        RELATIONAL_CONTRACT_FIXTURES.validSelfReport,
      ).labels,
    ).toEqual([]);
  });

  it("rejects prohibited inference fields on structured interpretation", () => {
    expect(() =>
      structuredInterpretationSchema.parse(
        RELATIONAL_CONTRACT_FIXTURES.invalidInterpretationWithEmotionField,
      ),
    ).toThrow(/Prohibited inference field/);
  });
});

describe("Relational Intelligence Prompt 02 — control and pause", () => {
  it("honours STOP immediately without negative inference", () => {
    expect(isImmediateStopControl("STOP")).toBe(true);
    const decision = decideImmediateControl("STOP");
    expect(decision.allowedResponseClass).toBe("stop");
    expect(decision.fallbackRoute).toBe("stop");
    expect(decision.policyVersion).toBe(RELATIONAL_POLICY_VERSION);
  });

  it("does not treat long pause as refusal or incapacity", () => {
    const decision = policyForLongPause();
    expect(decision.prohibitedInferenceIndicators).toEqual(
      expect.arrayContaining([
        "timeout_as_refusal",
        "pause_as_incapacity",
        "pause_as_emotion",
      ]),
    );
    expect(decision.allowedResponseClass).toBe("listen");
  });
});

describe("Relational Intelligence Prompt 02 — passport and preferences", () => {
  it("accepts purpose-minimised decision passport", () => {
    const passport = decisionPassportSchema.parse(
      RELATIONAL_CONTRACT_FIXTURES.validDecisionPassport,
    );
    expect(passport.constitutionVersion).toBe(RELATIONAL_CONSTITUTION_VERSION);
    expect(passport.consentPurpose).toBe("relational.service_assistance");
  });

  it("tracks communication preference expiry without inference", () => {
    const pref = communicationPreferenceSchema.parse(
      RELATIONAL_CONTRACT_FIXTURES.validCommunicationPreference,
    );
    expect(isCommunicationPreferenceExpired(pref, "2026-08-25T00:00:00.000Z")).toBe(
      false,
    );
    const expired = communicationPreferenceSchema.parse(
      RELATIONAL_CONTRACT_FIXTURES.expiredCommunicationPreference,
    );
    expect(
      isCommunicationPreferenceExpired(expired, "2026-08-25T00:00:00.000Z"),
    ).toBe(true);
  });
});
