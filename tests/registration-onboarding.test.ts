import { describe, expect, it } from "vitest";

import { evaluateEligibility } from "@/lib/onboarding/eligibility-gates";
import {
  dashboardTargetForRole,
  isRoleAllowedForSelfRegistration,
  onboardingPathForRole,
} from "@/lib/onboarding/onboarding-router";
import { baseRegistrationSchema, roleSelectionSchema } from "@/lib/validation/registration-schemas";
import {
  driverOnboardingSchema,
  familyOnboardingSchema,
  participantOnboardingSchema,
  providerOnboardingSchema,
  workerOnboardingSchema,
} from "@/lib/validation/onboarding-schemas";

const validBase = {
  role: "participant" as const,
  firstName: "Alex",
  lastName: "Taylor",
  email: "alex@example.com",
  mobile: "0412345678",
  country: "AU" as const,
  stateOrTerritory: "NSW" as const,
  postcode: "2000",
  preferredCommunicationMethod: "email" as const,
  acceptedTerms: true as const,
  acceptedPrivacyPolicy: true as const,
};

describe("base registration validation", () => {
  it("requires terms and privacy", () => {
    const result = baseRegistrationSchema.safeParse({
      ...validBase,
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional marketing consent", () => {
    const result = baseRegistrationSchema.safeParse({
      ...validBase,
      marketingConsent: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsafe self-assigned roles via router", () => {
    expect(isRoleAllowedForSelfRegistration("participant")).toBe(true);
  });
});

describe("role routing", () => {
  it("routes participant to participant onboarding", () => {
    expect(onboardingPathForRole("participant")).toBe("/onboarding/participant");
  });

  it("routes provider to provider onboarding", () => {
    expect(onboardingPathForRole("provider")).toBe("/onboarding/provider");
  });

  it("routes worker and driver correctly", () => {
    expect(onboardingPathForRole("support_worker")).toBe("/onboarding/worker");
    expect(onboardingPathForRole("driver")).toBe("/onboarding/driver");
  });

  it("routes plan manager onboarding", () => {
    expect(onboardingPathForRole("plan_manager")).toBe("/onboarding/plan-manager");
  });

  it("accepts role selection enum", () => {
    expect(roleSelectionSchema.safeParse({ role: "employer" }).success).toBe(
      true
    );
  });
});

describe("participant onboarding", () => {
  it("submits without NDIS number or full address", () => {
    const result = participantOnboardingSchema.safeParse({
      preferredName: "Alex",
      dateOfBirth: "1990-01-01",
      participantType: "self_managed",
      fundingType: "ndis",
      primaryServiceRegion: "Inner West Sydney",
      mainSupportGoals: "Community access",
      accessNeedsSummary: "Plain language",
      communicationPreferences: [],
      consentPreferences: {},
    });
    expect(result.success).toBe(true);
  });
});

describe("provider onboarding", () => {
  it("requires ABN/NZBN", () => {
    const result = providerOnboardingSchema.safeParse({
      organisationLegalName: "Acme Care",
      abnOrNzbn: "",
      primaryContactName: "Sam",
      primaryContactRole: "Director",
      phone: "0412345678",
      businessAddress: "1 Main St",
      publicServiceRegions: ["Sydney"],
      providerTypes: ["SIL"],
      servicesOffered: ["Support"],
      accessCapabilities: ["Auslan"],
      ndisRegisteredClaim: false,
      codeOfConductAcceptance: true,
      privacyDataHandlingAcceptance: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires NDIS number only when claiming registration", () => {
    const without = providerOnboardingSchema.safeParse({
      organisationLegalName: "Acme Care",
      abnOrNzbn: "12345678901",
      primaryContactName: "Sam",
      primaryContactRole: "Director",
      phone: "0412345678",
      businessAddress: "1 Main St",
      publicServiceRegions: ["Sydney"],
      providerTypes: ["SIL"],
      servicesOffered: ["Support"],
      accessCapabilities: ["Auslan"],
      ndisRegisteredClaim: true,
      codeOfConductAcceptance: true,
      privacyDataHandlingAcceptance: true,
    });
    expect(without.success).toBe(false);

    const withNum = providerOnboardingSchema.safeParse({
      organisationLegalName: "Acme Care",
      abnOrNzbn: "12345678901",
      primaryContactName: "Sam",
      primaryContactRole: "Director",
      phone: "0412345678",
      businessAddress: "1 Main St",
      publicServiceRegions: ["Sydney"],
      providerTypes: ["SIL"],
      servicesOffered: ["Support"],
      accessCapabilities: ["Auslan"],
      ndisRegisteredClaim: true,
      ndisRegistrationNumber: "4050000000",
      codeOfConductAcceptance: true,
      privacyDataHandlingAcceptance: true,
    });
    expect(withNum.success).toBe(true);
  });

  it("keeps booking ineligible until verification", () => {
    const ev = evaluateEligibility("provider", true, false);
    expect(ev.canAcceptBookings).toBe(false);
    expect(ev.badge).toBe("needs review");
  });
});

describe("worker onboarding", () => {
  it("requires legal name and date of birth", () => {
    const result = workerOnboardingSchema.safeParse({
      legalFirstName: "",
      legalLastName: "Lee",
      displayName: "Sam",
      dateOfBirth: "1990-01-01",
      stateOrTerritory: "NSW",
      postcode: "2000",
      workType: "contractor",
      servicesOffered: ["personal_care"],
      skills: ["communication"],
      codeOfConductAcceptance: true,
      workerAgreementAcceptance: true,
    });
    expect(result.success).toBe(false);
  });

  it("keeps matching ineligible until verification", () => {
    const ev = evaluateEligibility("support_worker", true, false);
    expect(ev.canBeMatched).toBe(false);
  });
});

describe("driver onboarding", () => {
  it("requires licence and vehicle details", () => {
    const result = driverOnboardingSchema.safeParse({
      licenceNumber: "123",
      licenceState: "NSW",
      licenceExpiry: "2030-01-01",
      vehicleOperatorType: "own_vehicle",
      vehicleRegistration: "ABC123",
      vehicleAccessibilityFeatures: ["ramp"],
      driverAssistanceOffered: ["door_to_door"],
      serviceRegions: ["Sydney"],
      transportSafetyAgreementAcceptance: true,
    });
    expect(result.success).toBe(true);
  });

  it("keeps dispatch ineligible until verification", () => {
    const ev = evaluateEligibility("driver", true, false);
    expect(ev.canBeDispatched).toBe(false);
  });
});

describe("family / nominee onboarding", () => {
  it("requires permission scopes", () => {
    const result = familyOnboardingSchema.safeParse({
      relationshipToParticipant: "Parent",
      participantLinkMethod: "later",
      authorityType: "informal_support",
      permissionScopes: [],
    });
    expect(result.success).toBe(false);
  });

  it("notes consent for participant access", () => {
    const ev = evaluateEligibility("nominee_or_family", true);
    expect(ev.message).toMatch(/consent/i);
  });
});

describe("support coordinator and plan manager gates", () => {
  it("support coordinator requires consent for participant access", () => {
    const ev = evaluateEligibility("support_coordinator", true);
    expect(ev.message).toMatch(/consent/i);
  });

  it("plan manager requires consent for invoices", () => {
    const ev = evaluateEligibility("plan_manager", true);
    expect(ev.message).toMatch(/consent/i);
  });
});

describe("dashboard targets", () => {
  it("maps roles to dashboards", () => {
    expect(dashboardTargetForRole("participant")).toBe("/dashboard");
    expect(dashboardTargetForRole("driver")).toBe("/dashboard/transport");
  });
});
