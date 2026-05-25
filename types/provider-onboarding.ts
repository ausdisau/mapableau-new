import type { OrganisationType, VerificationStatus } from "@prisma/client";

export type ProviderOnboardingStepId =
  | "organisation"
  | "regions"
  | "ndis"
  | "insurance"
  | "review";

export type ProviderOnboardingTaskView = {
  id: string;
  taskKey: string;
  title: string;
  status: string;
};

export type ProviderOnboardingOrganisationDraft = {
  id: string;
  name: string;
  abn: string | null;
  organisationType: OrganisationType;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  serviceRegions: string[];
  notes: string | null;
  ndisRegistrationClaimed: boolean;
  ndisRegistrationNumber: string | null;
  insuranceStatus: string | null;
  verificationStatus: VerificationStatus;
};

export type ProviderOnboardingState = {
  organisationId: string;
  organisation: ProviderOnboardingOrganisationDraft;
  workflowId: string | null;
  tasks: ProviderOnboardingTaskView[];
  currentStep: ProviderOnboardingStepId;
  completedSteps: ProviderOnboardingStepId[];
  submitted: boolean;
  canAccessConsole: boolean;
};

export type OrganisationStepPayload = {
  name: string;
  abn?: string;
  organisationType: OrganisationType;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
};

export type RegionsStepPayload = {
  serviceRegions: string[];
  notes?: string;
};

export type NdisStepPayload = {
  ndisRegistrationClaimed: boolean;
  ndisRegistrationNumber?: string;
};

export type InsuranceStepPayload = {
  insuranceStatus: string;
  insuranceNotes?: string;
};

export type ProviderOnboardingPatchBody =
  | { step: "organisation"; data: OrganisationStepPayload }
  | { step: "regions"; data: RegionsStepPayload }
  | { step: "ndis"; data: NdisStepPayload }
  | { step: "insurance"; data: InsuranceStepPayload };
