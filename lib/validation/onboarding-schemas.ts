import { z } from "zod";

const consentPrefsSchema = z.object({
  shareAccessNeedsWithProviders: z.boolean().optional(),
  shareForPersonalisation: z.boolean().optional(),
  shareDeidentifiedResearch: z.boolean().optional(),
});

export const participantOnboardingSchema = z.object({
  preferredName: z.string().min(1).max(120),
  dateOfBirth: z.string().min(1),
  participantType: z.enum([
    "self_managed",
    "plan_managed",
    "ndia_managed",
    "exploring",
  ]),
  fundingType: z.enum([
    "ndis",
    "private",
    "mixed",
    "unknown",
  ]),
  primaryServiceRegion: z.string().min(1).max(120),
  mainSupportGoals: z.string().min(1).max(2000),
  accessNeedsSummary: z.string().min(1).max(2000),
  communicationPreferences: z.array(z.string()).default([]),
  consentPreferences: consentPrefsSchema.default({}),
  emergencyContact: z.string().max(500).optional(),
  ndisNumber: z.string().max(50).optional(),
});

export const familyOnboardingSchema = z.object({
  relationshipToParticipant: z.string().min(1).max(120),
  participantLinkMethod: z.enum([
    "invite_email",
    "existing_participant_id",
    "later",
  ]),
  authorityType: z.enum([
    "informal_support",
    "nominee",
    "guardian",
    "other",
  ]),
  permissionScopes: z.array(z.string()).min(1),
});

export const providerOnboardingSchema = z.object({
  organisationLegalName: z.string().min(1).max(200),
  tradingName: z.string().max(200).optional(),
  abnOrNzbn: z.string().min(8).max(20),
  primaryContactName: z.string().min(1).max(120),
  primaryContactRole: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  website: z.string().url().optional().or(z.literal("")),
  businessAddress: z.string().min(1).max(500),
  publicServiceRegions: z.array(z.string()).min(1),
  providerTypes: z.array(z.string()).min(1),
  servicesOffered: z.array(z.string()).min(1),
  accessCapabilities: z.array(z.string()).min(1),
  ndisRegisteredClaim: z.boolean(),
  ndisRegistrationNumber: z.string().optional(),
  registrationGroups: z.array(z.string()).optional(),
  codeOfConductAcceptance: z.literal(true),
  privacyDataHandlingAcceptance: z.literal(true),
}).superRefine((data, ctx) => {
  if (data.ndisRegisteredClaim && !data.ndisRegistrationNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ndisRegistrationNumber"],
      message:
        "NDIS registration number is required when you claim NDIS registration",
    });
  }
});

export const workerOnboardingSchema = z.object({
  legalFirstName: z.string().min(1).max(80),
  legalLastName: z.string().min(1).max(80),
  displayName: z.string().min(1).max(120),
  dateOfBirth: z.string().min(1),
  stateOrTerritory: z.string().min(2).max(10),
  postcode: z.string().min(3).max(10),
  workType: z.enum(["employee", "contractor", "sole_trader"]),
  servicesOffered: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  languages: z.array(z.string()).optional(),
  providerAffiliation: z.string().optional(),
  codeOfConductAcceptance: z.literal(true),
  workerAgreementAcceptance: z.literal(true),
});

export const driverOnboardingSchema = z.object({
  licenceNumber: z.string().min(1).max(40),
  licenceState: z.string().min(2).max(10),
  licenceExpiry: z.string().min(1),
  vehicleOperatorType: z.enum(["own_vehicle", "organisation_fleet"]),
  vehicleRegistration: z.string().min(1).max(20),
  vehicleAccessibilityFeatures: z.array(z.string()).min(1),
  driverAssistanceOffered: z.array(z.string()).min(1),
  serviceRegions: z.array(z.string()).min(1),
  transportSafetyAgreementAcceptance: z.literal(true),
});

export const alliedHealthOnboardingSchema = z.object({
  profession: z.string().min(1).max(120),
  qualificationsSummary: z.string().min(1).max(2000),
  deliveryModes: z.array(z.string()).min(1),
  serviceRegions: z.array(z.string()).min(1),
  clinicalGovernanceAcceptance: z.literal(true),
  ahpraRegistrationNumber: z.string().optional(),
  professionalBody: z.string().optional(),
});

export const supportCoordinatorOnboardingSchema = z.object({
  organisationOrSoleTraderName: z.string().min(1).max(200),
  serviceRegions: z.array(z.string()).min(1),
  professionalExperienceSummary: z.string().min(1).max(2000),
  codeOfConductAcceptance: z.literal(true),
  abnOrNzbn: z.string().optional(),
  ndisRegistrationClaim: z.boolean().optional(),
});

export const planManagerOnboardingSchema = z.object({
  organisationName: z.string().min(1).max(200),
  abnOrNzbn: z.string().min(8).max(20),
  primaryContactName: z.string().min(1).max(120),
  invoiceReceivingEmail: z.string().email(),
  paymentProcessingContact: z.string().max(200).optional(),
  complianceAcknowledgement: z.literal(true),
  planManagementRegistrationDetails: z.string().optional(),
});

export const employerOnboardingSchema = z.object({
  organisationName: z.string().min(1).max(200),
  abnOrNzbn: z.string().min(8).max(20),
  contactPerson: z.string().min(1).max(120),
  contactRole: z.string().min(1).max(120),
  industry: z.string().min(1).max(120),
  locations: z.array(z.string()).min(1),
  inclusiveHiringCommitment: z.string().min(1).max(2000),
  workplaceAccessibilitySummary: z.string().min(1).max(2000),
  jobPostingPermission: z.literal(true),
  website: z.string().url().optional().or(z.literal("")),
});
