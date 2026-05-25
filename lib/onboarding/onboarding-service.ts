import type { MapAbleUserRole, Prisma } from "@prisma/client";

import { recordOnboardingEvent } from "@/lib/onboarding/onboarding-audit-service";
import { evaluateEligibility } from "@/lib/onboarding/eligibility-gates";
import {
  dashboardTargetForRole,
  isRoleAllowedForSelfRegistration,
  mapRegistrationRoleToMapAbleRole,
  onboardingPathForRole,
  resolveNextStepAfterBaseRegistration,
} from "@/lib/onboarding/onboarding-router";
import { prisma } from "@/lib/prisma";
import type { BaseRegistrationInput } from "@/lib/validation/registration-schemas";
import type {
  alliedHealthOnboardingSchema,
  driverOnboardingSchema,
  employerOnboardingSchema,
  familyOnboardingSchema,
  participantOnboardingSchema,
  planManagerOnboardingSchema,
  providerOnboardingSchema,
  supportCoordinatorOnboardingSchema,
  workerOnboardingSchema,
} from "@/lib/validation/onboarding-schemas";
import type { z } from "zod";
import type { OnboardingApiResponse } from "@/types/registration";
import type { RegistrationRole } from "@/types/registration";

type ParticipantInput = z.infer<typeof participantOnboardingSchema>;
type FamilyInput = z.infer<typeof familyOnboardingSchema>;
type ProviderInput = z.infer<typeof providerOnboardingSchema>;
type WorkerInput = z.infer<typeof workerOnboardingSchema>;
type DriverInput = z.infer<typeof driverOnboardingSchema>;
type AlliedInput = z.infer<typeof alliedHealthOnboardingSchema>;
type ScInput = z.infer<typeof supportCoordinatorOnboardingSchema>;
type PmInput = z.infer<typeof planManagerOnboardingSchema>;
type EmployerInput = z.infer<typeof employerOnboardingSchema>;

export async function ensureOnboardingStatus(userId: string) {
  return prisma.profileOnboardingStatus.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getOnboardingStatus(userId: string) {
  const row = await ensureOnboardingStatus(userId);
  return {
    selectedRole: row.selectedRole as RegistrationRole | null,
    onboardingStatus: row.onboardingStatus,
    nextStep: row.nextStep,
    eligibilityStatus: row.eligibilityStatus,
    completedSteps: (row.completedSteps as string[]) ?? [],
  };
}

async function upsertConsents(
  userId: string,
  input: BaseRegistrationInput,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const consents: Array<{ type: string; accepted: boolean }> = [
    { type: "terms_of_use", accepted: input.acceptedTerms },
    { type: "privacy_policy", accepted: input.acceptedPrivacyPolicy },
    { type: "marketing", accepted: Boolean(input.marketingConsent) },
  ];
  for (const c of consents) {
    await prisma.registrationConsent.upsert({
      where: {
        userId_consentType: { userId, consentType: c.type },
      },
      create: {
        userId,
        consentType: c.type,
        accepted: c.accepted,
        acceptedAt: c.accepted ? new Date() : null,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
      update: {
        accepted: c.accepted,
        acceptedAt: c.accepted ? new Date() : null,
      },
    });
  }
}

async function assignUserRole(userId: string, role: RegistrationRole) {
  const mapableRole = mapRegistrationRoleToMapAbleRole(role);
  await prisma.user.update({
    where: { id: userId },
    data: { primaryRole: mapableRole },
  });
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId, role: mapableRole } },
    create: { userId, role: mapableRole, isPrimary: true },
    update: { isPrimary: true },
  });
}

async function updateOnboardingProgress(
  userId: string,
  role: RegistrationRole,
  step: string,
  status: "in_progress" | "submitted" | "complete" | "needs_review" = "in_progress"
) {
  const row = await ensureOnboardingStatus(userId);
  const steps = new Set([...(row.completedSteps as string[]), step]);
  const eligibility = evaluateEligibility(role, status === "complete");
  await prisma.profileOnboardingStatus.update({
    where: { userId },
    data: {
      selectedRole: role,
      onboardingStatus: status,
      completedSteps: [...steps],
      nextStep:
        status === "complete"
          ? dashboardTargetForRole(role)
          : onboardingPathForRole(role),
      eligibilityStatus: eligibility.status,
    },
  });
}

function ok(
  role: RegistrationRole,
  status: string,
  extra?: Partial<OnboardingApiResponse>
): OnboardingApiResponse {
  return {
    success: true,
    nextStep: resolveNextStepAfterBaseRegistration(role),
    dashboardTarget: dashboardTargetForRole(role),
    status,
    ...extra,
  };
}

export async function submitBaseRegistration(
  userId: string,
  input: BaseRegistrationInput,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<OnboardingApiResponse> {
  if (!isRoleAllowedForSelfRegistration(input.role)) {
    return {
      success: false,
      errors: [
        {
          field: "role",
          message: "This role cannot be self-assigned. Contact MapAble support.",
        },
      ],
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email,
      phone: input.mobile,
      preferredContactMethod:
        input.preferredCommunicationMethod === "plain_language"
          ? "email"
          : input.preferredCommunicationMethod,
    },
  });

  await assignUserRole(userId, input.role);
  await upsertConsents(userId, input, meta);

  await prisma.profileOnboardingStatus.upsert({
    where: { userId },
    create: {
      userId,
      selectedRole: input.role,
      onboardingStatus: "in_progress",
      completedSteps: ["base_registration"],
      nextStep: onboardingPathForRole(input.role),
      roleDataJson: {
        country: input.country,
        stateOrTerritory: input.stateOrTerritory,
        postcode: input.postcode,
        accessibilityCommunicationPreference:
          input.accessibilityCommunicationPreference,
      } as Prisma.InputJsonValue,
    },
    update: {
      selectedRole: input.role,
      onboardingStatus: "in_progress",
      completedSteps: ["base_registration"],
      nextStep: onboardingPathForRole(input.role),
      roleDataJson: {
        country: input.country,
        stateOrTerritory: input.stateOrTerritory,
        postcode: input.postcode,
        accessibilityCommunicationPreference:
          input.accessibilityCommunicationPreference,
      } as Prisma.InputJsonValue,
    },
  });

  await recordOnboardingEvent({
    userId,
    role: input.role,
    eventType: "base_registration_submitted",
    payload: { country: input.country, postcode: input.postcode },
  });

  return ok(input.role, "in_progress", {
    nextStep: onboardingPathForRole(input.role),
  });
}

export async function submitRoleSelection(
  userId: string,
  role: RegistrationRole
): Promise<OnboardingApiResponse> {
  if (!isRoleAllowedForSelfRegistration(role)) {
    return {
      success: false,
      errors: [{ field: "role", message: "This role cannot be self-assigned." }],
    };
  }
  await assignUserRole(userId, role);
  await updateOnboardingProgress(userId, role, "role_selected");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "role_selected",
  });
  return ok(role, "in_progress", { nextStep: onboardingPathForRole(role) });
}

export async function submitParticipantOnboarding(
  userId: string,
  input: ParticipantInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "participant";
  const dob = new Date(input.dateOfBirth);

  await prisma.participantProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: input.preferredName,
      preferredName: input.preferredName,
      dateOfBirth: dob,
      homeState: input.primaryServiceRegion.split(" ").pop(),
      participantNotes: input.mainSupportGoals,
      ...(input.ndisNumber
        ? { ndisParticipantNumberEnc: input.ndisNumber }
        : {}),
    },
    update: {
      preferredName: input.preferredName,
      dateOfBirth: dob,
      participantNotes: input.mainSupportGoals,
    },
  });

  await prisma.accessibilityProfile.upsert({
    where: { userId },
    create: {
      userId,
      communicationPreferences: input.communicationPreferences,
      digitalPreferences: { simpleLanguageMode: true },
    },
    update: {
      communicationPreferences: input.communicationPreferences,
    },
  });

  await updateOnboardingProgress(userId, role, "participant_onboarding", "complete");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "participant_onboarding_submitted",
    payload: { fundingType: input.fundingType },
  });

  return ok(role, "complete", {
    nextStep: "/onboarding/complete",
    eligibilityStatus: "verified",
  });
}

export async function submitFamilyOnboarding(
  userId: string,
  input: FamilyInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "nominee_or_family";
  await prisma.nomineeOnboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      relationshipToParticipant: input.relationshipToParticipant,
      authorityType: input.authorityType,
      participantLinkMethod: input.participantLinkMethod,
      permissionScopes: input.permissionScopes,
      proofRequired: input.authorityType === "guardian" || input.authorityType === "nominee",
    },
    update: {
      relationshipToParticipant: input.relationshipToParticipant,
      authorityType: input.authorityType,
      participantLinkMethod: input.participantLinkMethod,
      permissionScopes: input.permissionScopes,
    },
  });
  await updateOnboardingProgress(userId, role, "family_onboarding", "complete");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "family_onboarding_submitted",
  });
  return ok(role, "complete", { nextStep: "/onboarding/complete" });
}

async function createPlaceholderOrganisation(
  userId: string,
  name: string,
  type: "care_provider" | "transport_provider" | "employer"
) {
  const org = await prisma.organisation.create({
    data: {
      name,
      organisationType: type,
      verificationStatus: "not_started",
      serviceRegions: [],
    },
  });
  await prisma.organisationMember.create({
    data: {
      userId,
      organisationId: org.id,
      role: mapRegistrationRoleToMapAbleRole(
        type === "transport_provider" ? "driver" : type === "employer" ? "employer" : "provider"
      ) as MapAbleUserRole,
    },
  });
  return org;
}

export async function submitProviderOnboarding(
  userId: string,
  input: ProviderInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "provider";
  const org = await createPlaceholderOrganisation(
    userId,
    input.tradingName || input.organisationLegalName,
    "care_provider"
  );
  await prisma.organisation.update({
    where: { id: org.id },
    data: {
      name: input.tradingName || input.organisationLegalName,
      abn: input.abnOrNzbn,
      contactEmail: (await prisma.user.findUnique({ where: { id: userId } }))?.email,
      contactPhone: input.phone,
      website: input.website || undefined,
      address: input.businessAddress,
      serviceRegions: input.publicServiceRegions,
      ndisRegistrationClaimed: input.ndisRegisteredClaim,
      ndisRegistrationNumber: input.ndisRegistrationNumber,
      verificationStatus: "pending_review",
    },
  });

  await updateOnboardingProgress(userId, role, "provider_onboarding", "submitted");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "provider_onboarding_submitted",
    payload: { organisationId: org.id },
  });

  return ok(role, "submitted", {
    nextStep: "/onboarding/complete",
    eligibilityStatus: "needs_review",
  });
}

export async function submitWorkerOnboarding(
  userId: string,
  input: WorkerInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "support_worker";
  const org = await createPlaceholderOrganisation(
    userId,
    input.providerAffiliation || `${input.displayName} — independent worker`,
    "care_provider"
  );
  await prisma.workerProfile.create({
    data: {
      userId,
      organisationId: org.id,
      displayName: input.displayName,
      profileSummary: input.skills.join(", "),
      serviceTypes: input.servicesOffered,
      serviceRegions: [input.stateOrTerritory],
      languages: input.languages ?? [],
      verificationStatus: "pending_review",
    },
  });
  await updateOnboardingProgress(userId, role, "worker_onboarding", "submitted");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "worker_onboarding_submitted",
  });
  return ok(role, "submitted", {
    eligibilityStatus: "not_eligible",
  });
}

export async function submitDriverOnboarding(
  userId: string,
  input: DriverInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "driver";
  const org = await createPlaceholderOrganisation(
    userId,
    "Transport — pending verification",
    "transport_provider"
  );
  await prisma.driverProfile.create({
    data: {
      userId,
      organisationId: org.id,
      displayName: (await prisma.user.findUnique({ where: { id: userId } }))?.name ?? "Driver",
      serviceRegions: input.serviceRegions,
      licenceStatus: "pending_review",
      verificationStatus: "pending_review",
    },
  });
  await prisma.profileOnboardingStatus.update({
    where: { userId },
    data: {
      roleDataJson: input as unknown as Prisma.InputJsonValue,
    },
  });
  await updateOnboardingProgress(userId, role, "driver_onboarding", "submitted");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "driver_onboarding_submitted",
  });
  return ok(role, "submitted", { eligibilityStatus: "not_eligible" });
}

export async function submitAlliedHealthOnboarding(
  userId: string,
  input: AlliedInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "allied_health_practitioner";
  await prisma.alliedHealthOnboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      profession: input.profession,
      qualificationsSummary: input.qualificationsSummary,
      ahpraRegistrationNumber: input.ahpraRegistrationNumber,
      professionalBody: input.professionalBody,
      deliveryModes: input.deliveryModes,
      serviceRegions: input.serviceRegions,
      clinicalBookingEligibilityStatus: "needs_review",
    },
    update: {
      profession: input.profession,
      qualificationsSummary: input.qualificationsSummary,
      deliveryModes: input.deliveryModes,
      serviceRegions: input.serviceRegions,
      clinicalBookingEligibilityStatus: "needs_review",
    },
  });
  await updateOnboardingProgress(userId, role, "allied_health_onboarding", "submitted");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "allied_health_onboarding_submitted",
  });
  return ok(role, "submitted", { eligibilityStatus: "needs_review" });
}

export async function submitSupportCoordinatorOnboarding(
  userId: string,
  input: ScInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "support_coordinator";
  await updateOnboardingProgress(userId, role, "support_coordinator_onboarding", "complete");
  await prisma.profileOnboardingStatus.update({
    where: { userId },
    data: { roleDataJson: input as unknown as Prisma.InputJsonValue },
  });
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "support_coordinator_onboarding_submitted",
  });
  return ok(role, "complete");
}

export async function submitPlanManagerOnboarding(
  userId: string,
  input: PmInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "plan_manager";
  await prisma.planManagerOnboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      organisationName: input.organisationName,
      abnOrNzbn: input.abnOrNzbn,
      primaryContactName: input.primaryContactName,
      invoiceReceivingEmail: input.invoiceReceivingEmail,
      paymentProcessingContact: input.paymentProcessingContact,
      planManagementRegistrationDetails: input.planManagementRegistrationDetails,
    },
    update: { ...input },
  });
  await updateOnboardingProgress(userId, role, "plan_manager_onboarding", "complete");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "plan_manager_onboarding_submitted",
  });
  return ok(role, "complete");
}

export async function submitEmployerOnboarding(
  userId: string,
  input: EmployerInput
): Promise<OnboardingApiResponse> {
  const role: RegistrationRole = "employer";
  const org = await createPlaceholderOrganisation(
    userId,
    input.organisationName,
    "employer"
  );
  await prisma.employerOnboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      organisationName: input.organisationName,
      abnOrNzbn: input.abnOrNzbn,
      contactPerson: input.contactPerson,
      contactRole: input.contactRole,
      industry: input.industry,
      locations: input.locations,
      website: input.website,
      inclusiveHiringCommitment: input.inclusiveHiringCommitment,
      workplaceAccessibilitySummary: input.workplaceAccessibilitySummary,
      jobPostingPermissionStatus: "needs_review",
    },
    update: {
      organisationName: input.organisationName,
      abnOrNzbn: input.abnOrNzbn,
      contactPerson: input.contactPerson,
      contactRole: input.contactRole,
      industry: input.industry,
      locations: input.locations,
      inclusiveHiringCommitment: input.inclusiveHiringCommitment,
      workplaceAccessibilitySummary: input.workplaceAccessibilitySummary,
      jobPostingPermissionStatus: "needs_review",
    },
  });
  await prisma.organisation.update({
    where: { id: org.id },
    data: { abn: input.abnOrNzbn, website: input.website },
  });
  await updateOnboardingProgress(userId, role, "employer_onboarding", "submitted");
  await recordOnboardingEvent({
    userId,
    role,
    eventType: "employer_onboarding_submitted",
  });
  return ok(role, "submitted", { eligibilityStatus: "needs_review" });
}
