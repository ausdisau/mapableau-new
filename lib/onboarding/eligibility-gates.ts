import type { RegistrationRole } from "@/types/registration";
import type { ServiceEligibilityStatus } from "@/types/registration";

import type { EligibilityBadge } from "@/types/onboarding";

export type EligibilityEvaluation = {
  status: ServiceEligibilityStatus;
  badge: EligibilityBadge;
  canAccessParticipantDashboard: boolean;
  canListInDirectory: boolean;
  canAcceptBookings: boolean;
  canBeMatched: boolean;
  canBeDispatched: boolean;
  message: string;
};

export function evaluateEligibility(
  role: RegistrationRole,
  onboardingComplete: boolean,
  verificationVerified = false
): EligibilityEvaluation {
  if (!onboardingComplete) {
    return base("onboarding_incomplete", "onboarding incomplete", {
      message: "Complete onboarding to continue.",
    });
  }

  switch (role) {
    case "participant":
      return base("verified", "verified", {
        canAccessParticipantDashboard: true,
        message: "You can use your participant dashboard.",
      });
    case "nominee_or_family":
      return base("verified", "verified", {
        canAccessParticipantDashboard: true,
        message:
          "Nominee access depends on participant consent links before viewing their data.",
      });
    case "provider":
      return base(
        verificationVerified ? "listed" : "submitted",
        verificationVerified ? "listed" : "needs review",
        {
          canListInDirectory: verificationVerified,
          canAcceptBookings: verificationVerified,
          message: verificationVerified
            ? "Your organisation can be listed after verification."
            : "Directory listing and booking eligibility require verification review.",
        }
      );
    case "support_worker":
      return base("submitted", "not eligible yet", {
        canBeMatched: false,
        message:
          "Your profile is submitted. Matching eligibility requires worker verification checks.",
      });
    case "driver":
      return base("submitted", "not eligible yet", {
        canBeDispatched: false,
        message:
          "Dispatch eligibility requires licence, vehicle checks, and verification.",
      });
    case "allied_health_practitioner":
      return base("submitted", "needs review", {
        canListInDirectory: false,
        message:
          "Public listing and clinical booking require credential review where applicable.",
      });
    case "support_coordinator":
      return base("verified", "verified", {
        message:
          "Participant access requires an active consent link with each participant.",
      });
    case "plan_manager":
      return base("verified", "verified", {
        message:
          "Invoice access requires participant or nominee consent before viewing billing data.",
      });
    case "employer":
      return base("submitted", "needs review", {
        message:
          "Job posting permission requires employer profile approval after review.",
      });
    default:
      return base("not_eligible", "not eligible yet", {
        message: "This role is not eligible for the requested action yet.",
      });
  }
}

function base(
  status: ServiceEligibilityStatus,
  badge: EligibilityBadge,
  extra: Partial<EligibilityEvaluation>
): EligibilityEvaluation {
  return {
    status,
    badge,
    canAccessParticipantDashboard: false,
    canListInDirectory: false,
    canAcceptBookings: false,
    canBeMatched: false,
    canBeDispatched: false,
    message: "",
    ...extra,
  };
}
