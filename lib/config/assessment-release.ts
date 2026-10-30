/**
 * Fail-closed release gate for participant-authored assessment intake.
 * Only an accountable release owner may enable it after privacy,
 * security, accessibility and operational checks have been completed.
 *
 * This gate does not confer approval or alter data access permissions.
 */
export function isAssessmentIntakeEnabled(): boolean {
  return process.env.MAPABLE_ASSESSMENT_INTAKE_ENABLED === "true";
}
