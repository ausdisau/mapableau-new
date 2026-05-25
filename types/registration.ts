export const REGISTRATION_ROLES = [
  "participant",
  "nominee_or_family",
  "provider",
  "support_worker",
  "driver",
  "allied_health_practitioner",
  "support_coordinator",
  "plan_manager",
  "employer",
] as const;

export type RegistrationRole = (typeof REGISTRATION_ROLES)[number];

export type OnboardingFlowStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "complete"
  | "needs_review";

export type ServiceEligibilityStatus =
  | "onboarding_incomplete"
  | "submitted"
  | "needs_review"
  | "listed"
  | "verified"
  | "booking_eligible"
  | "matching_eligible"
  | "dispatch_eligible"
  | "not_eligible";

export type OnboardingApiResponse = {
  success: boolean;
  nextStep?: string;
  dashboardTarget?: string;
  status?: string;
  eligibilityStatus?: ServiceEligibilityStatus;
  errors?: Array<{ field: string; message: string }>;
};
