import type { MatchReason } from "./matching-types";

export type HardFilterContext = {
  verificationStatus?: string;
  organisationStatus?: string;
  organisationVerification?: string;
  isBlocked?: boolean;
  hasRequiredSkill?: boolean;
};

export function applyHardFilters(ctx: HardFilterContext): {
  passed: boolean;
  reasons: MatchReason[];
} {
  const reasons: MatchReason[] = [];

  if (ctx.isBlocked) {
    return {
      passed: false,
      reasons: [
        {
          code: "participant_block",
          label: "This worker is on your blocked list.",
          weight: 0,
        },
      ],
    };
  }

  if (ctx.organisationVerification === "suspended" || ctx.organisationVerification === "rejected") {
    return {
      passed: false,
      reasons: [
        {
          code: "provider_ineligible",
          label: "Provider is not verified or is inactive.",
          weight: 0,
        },
      ],
    };
  }

  if (ctx.verificationStatus && ctx.verificationStatus !== "verified") {
    reasons.push({
      code: "worker_unverified",
      label: "Worker verification is not complete.",
      weight: 0,
    });
  }

  if (ctx.hasRequiredSkill === false) {
    return {
      passed: false,
      reasons: [
        {
          code: "missing_skill",
          label: "Required skills for this request are not met.",
          weight: 0,
        },
      ],
    };
  }

  return { passed: true, reasons };
}
