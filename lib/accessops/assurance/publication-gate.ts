import type { AccessOpsAssuranceAssessment } from "@prisma/client";

export function assuranceAllowsPublication(
  assessments: Pick<
    AccessOpsAssuranceAssessment,
    "outcome" | "restrictsPublication" | "expiresAt"
  >[],
  now: Date = new Date(),
): boolean {
  return assessments.every(
    (assessment) =>
      assessment.outcome !== "fail" &&
      !assessment.restrictsPublication &&
      (!assessment.expiresAt || assessment.expiresAt.getTime() > now.getTime()),
  );
}
