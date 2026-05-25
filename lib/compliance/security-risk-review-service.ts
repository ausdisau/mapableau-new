import { logAuthAudit } from "@/lib/auth/auth-audit-service";

/** Placeholder for periodic security risk review — not HIPAA certification */
export async function recordSecurityRiskReviewPlaceholder(input: {
  reviewerUserId?: string;
  scope: string;
  findingsSummary: string;
}) {
  await logAuthAudit({
    userId: input.reviewerUserId,
    action: "compliance.risk_review_placeholder",
    metadata: {
      scope: input.scope,
      findingsSummary: input.findingsSummary,
      disclaimer:
        "MapAble implements HIPAA-ready controls; certification requires BAAs, policies, and legal review.",
    },
  });
  return { recorded: true };
}

export const HIPAA_DISCLAIMER =
  "MapAble uses HIPAA-ready architecture controls. This product is not certified as HIPAA compliant unless your organisation completes vendor BAAs, risk analysis, policies, and legal review.";
