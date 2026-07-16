import { PLATFORM_ASSURANCE_DISCLAIMER } from "@/lib/config/platform-assurance";

import { listControlsWithComplianceMapping } from "./control-inventory";
import { listScopeAssessments } from "./scope-assessment-service";
import { ensureRegistrationControlsSeeded } from "./source-registry";
import { listRegulatorySources } from "./source-registry";

export async function getAssuranceOverview() {
  await ensureRegistrationControlsSeeded();
  const [sources, assessments, controls] = await Promise.all([
    listRegulatorySources(),
    listScopeAssessments(),
    listControlsWithComplianceMapping(),
  ]);

  const openLegalReviews = assessments.filter(
    (a) =>
      a.result === "legal_review_required" || a.status === "legal_review"
  ).length;

  return {
    disclaimer: PLATFORM_ASSURANCE_DISCLAIMER,
    counts: {
      sources: sources.length,
      assessments: assessments.length,
      controls: controls.length,
      openLegalReviews,
      controlsNotStarted: controls.filter((c) => c.status === "not_started")
        .length,
    },
    sources: sources.slice(0, 12),
    recentAssessments: assessments.slice(0, 10),
    controls: controls.slice(0, 20),
  };
}

export {
  listRegulatorySources,
  ensureRegulatorySourcesSeeded,
  ensureRegistrationControlsSeeded,
  formatAuthorityClassLabel,
  formatScopeResultLabel,
  sourceRequiresHumanPromotion,
  assertDraftNotTreatedAsLaw,
  assertSourceMutable,
} from "./source-registry";

export {
  createScopeAssessment,
  createScopeAssessmentSchema,
  listScopeAssessments,
  getScopeAssessment,
  buildAuditReadinessExport,
  assertMaySetScopeResult,
} from "./scope-assessment-service";

export {
  SCOPE_QUESTIONS,
  SCOPE_QUESTIONNAIRE_VERSION,
  suggestScopeResult,
} from "./scope-questionnaire";

export { listRegistrationControls, listControlsWithComplianceMapping } from "./control-inventory";
