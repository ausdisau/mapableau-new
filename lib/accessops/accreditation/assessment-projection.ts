import type { AccessOpsAssuranceAssessment } from "@prisma/client";

export function assessmentRestrictsLiveUse(
  assessment: Pick<
    AccessOpsAssuranceAssessment,
    "outcome" | "restrictsPublication" | "restrictsRouting"
  >,
): boolean {
  return (
    assessment.outcome === "fail" ||
    assessment.restrictsPublication ||
    assessment.restrictsRouting
  );
}
