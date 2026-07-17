import { prisma } from "@/lib/prisma";

/**
 * Continuous access evaluation. Even after a consent-bound token is issued,
 * every dereference re-checks the underlying directive. If the directive is
 * withdrawn or expired, the token is treated as revoked in real time.
 */

export interface ContinuousAccessResult {
  allowed: boolean;
  reason: string;
  directiveId: string;
}

export async function continuouslyEvaluateDirective(
  directiveId: string
): Promise<ContinuousAccessResult> {
  const now = new Date();
  const directive = await prisma.consentDirective.findUnique({
    where: { id: directiveId },
    select: {
      id: true,
      status: true,
      decision: true,
      effectiveFrom: true,
      effectiveUntil: true,
    },
  });
  if (!directive) {
    return {
      allowed: false,
      reason: "directive_not_found",
      directiveId,
    };
  }
  if (directive.status !== "active") {
    return {
      allowed: false,
      reason: `directive_status_${directive.status}`,
      directiveId,
    };
  }
  if (directive.decision !== "active") {
    return {
      allowed: false,
      reason: `directive_decision_${directive.decision}`,
      directiveId,
    };
  }
  if (directive.effectiveUntil && directive.effectiveUntil <= now) {
    return {
      allowed: false,
      reason: "directive_expired",
      directiveId,
    };
  }
  if (directive.effectiveFrom && directive.effectiveFrom > now) {
    return {
      allowed: false,
      reason: "directive_not_yet_effective",
      directiveId,
    };
  }
  return { allowed: true, reason: "ok", directiveId };
}
