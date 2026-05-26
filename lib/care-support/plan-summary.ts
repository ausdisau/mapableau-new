import type { Prisma } from "@prisma/client";

/** Non-sensitive rollup for coordinator dashboards. */
export function buildPlanSummaryFromSections(
  sectionsJson: Prisma.JsonValue
): Record<string, unknown> {
  const sections =
    sectionsJson && typeof sectionsJson === "object" && !Array.isArray(sectionsJson)
      ? (sectionsJson as Record<string, unknown>)
      : {};

  const goals = Array.isArray(sections.goals)
    ? (sections.goals as string[]).slice(0, 10)
    : [];

  return {
    updatedFrom: "support_needs_assessment",
    goalCount: goals.length,
    goalsPreview: goals.slice(0, 3),
    hasDailyLiving: Boolean(sections.dailyLiving),
    hasCommunity: Boolean(sections.community),
    hasEmployment: Boolean(sections.employment),
    hasRiskNotes: Boolean(sections.risks),
    accessNeedsSummary:
      typeof sections.accessNeedsSummary === "string"
        ? sections.accessNeedsSummary.slice(0, 500)
        : undefined,
  };
}
