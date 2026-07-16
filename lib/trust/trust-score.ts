import type {
  EvidenceLabel,
  ProviderTrustScore,
  TrustCategory,
  VerificationLevel,
} from "@/types/wedges";

const EVIDENCE_WEIGHTS: Record<EvidenceLabel, number> = {
  verified: 1,
  declared: 0.6,
  expired: 0.2,
  unknown: 0.1,
  not_applicable: 0,
};

/**
 * Calculate evidence-based trust score. Paid subscription must NOT affect this score.
 */
export function calculateProviderTrustScore(
  providerId: string,
  categories: TrustCategory[],
): ProviderTrustScore {
  const applicable = categories.filter((category) => category.evidence !== "not_applicable");
  if (applicable.length === 0) {
    return {
      providerId,
      overallScore: 0,
      categories,
      summary: "Not enough information to calculate a trust score yet.",
    };
  }

  let earned = 0;
  for (const category of applicable) earned += EVIDENCE_WEIGHTS[category.evidence];

  const overallScore = Math.round((earned / applicable.length) * 100);
  const verifiedCount = applicable.filter((category) => category.evidence === "verified").length;
  const unknownCount = applicable.filter((category) => category.evidence === "unknown").length;

  let summary = `Trust score based on ${applicable.length} evidence categories. `;
  summary += `${verifiedCount} verified, ${unknownCount} not yet verified. `;
  summary += "This is not a guarantee of service quality.";

  return { providerId, overallScore, categories, summary };
}

export function evidenceLabelText(evidence: EvidenceLabel): string {
  switch (evidence) {
    case "verified":
      return "Verified";
    case "declared":
      return "Declared by provider";
    case "expired":
      return "Expired - needs re-check";
    case "unknown":
      return "Not yet verified";
    case "not_applicable":
      return "Not applicable";
    default: {
      const exhaustive: never = evidence;
      return exhaustive;
    }
  }
}

export const VERIFICATION_LEVEL_INFO: Record<
  VerificationLevel,
  { badgeText: string; requirements: string; doesNotMean: string; reviewPeriod: string }
> = {
  listed: {
    badgeText: "Listed",
    requirements: "Basic profile on MapAble with service categories and location.",
    doesNotMean: "Does not mean MapAble has verified credentials or access information.",
    reviewPeriod: "Ongoing",
  },
  checked: {
    badgeText: "Checked",
    requirements: "Identity and business details reviewed by MapAble.",
    doesNotMean: "Does not guarantee service quality or NDIS compliance.",
    reviewPeriod: "12 months",
  },
  verified: {
    badgeText: "Verified",
    requirements: "Credentials, insurance, and worker screening evidence reviewed.",
    doesNotMean: "Does not replace your own due diligence before booking.",
    reviewPeriod: "12 months",
  },
  access_verified: {
    badgeText: "Access Verified",
    requirements: "Accessibility profile reviewed with evidence (photos, measurements, or assessment).",
    doesNotMean: "Does not certify building compliance or guarantee every access need is met.",
    reviewPeriod: "12 months",
  },
  outcome_verified: {
    badgeText: "Outcome Verified",
    requirements: "Track record of first appointments completed and participant feedback reviewed.",
    doesNotMean: "Past outcomes do not guarantee future results.",
    reviewPeriod: "6 months",
  },
  gold_partner: {
    badgeText: "Gold Partner",
    requirements: "Sustained verification, community contribution, and regional service commitment.",
    doesNotMean: "Partnership status does not override evidence-based trust scores.",
    reviewPeriod: "6 months",
  },
};

export function verificationLevelForScore(
  score: number,
  hasAccessVerified: boolean,
  hasOutcomeEvidence = false,
): VerificationLevel {
  if (score >= 90 && hasAccessVerified && hasOutcomeEvidence) {
    return "outcome_verified";
  }
  if (score >= 80 && hasAccessVerified) return "access_verified";
  if (score >= 70) return "verified";
  if (score >= 50) return "checked";
  return "listed";
}
