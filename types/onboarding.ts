import type {
  OnboardingFlowStatus,
  RegistrationRole,
  ServiceEligibilityStatus,
} from "@/types/registration";

export type OnboardingStatusView = {
  selectedRole: RegistrationRole | null;
  onboardingStatus: OnboardingFlowStatus;
  nextStep: string | null;
  eligibilityStatus: ServiceEligibilityStatus;
  completedSteps: string[];
};

export type EligibilityBadge =
  | "onboarding incomplete"
  | "submitted"
  | "needs review"
  | "listed"
  | "verified"
  | "booking eligible"
  | "matching eligible"
  | "dispatch eligible"
  | "not eligible yet";
