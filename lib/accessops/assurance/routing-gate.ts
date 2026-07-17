import type { AccessOpsAssuranceAssessment } from "@prisma/client";

export function assuranceAllowsRouting(
  assessments: Pick<
    AccessOpsAssuranceAssessment,
    "outcome" | "restrictsRouting" | "expiresAt"
  >[],
  now: Date = new Date(),
): boolean {
  return assessments.every(
    (assessment) =>
      assessment.outcome !== "fail" &&
      !assessment.restrictsRouting &&
      (!assessment.expiresAt || assessment.expiresAt.getTime() > now.getTime()),
  );
}
