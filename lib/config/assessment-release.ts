/**
 * Participant support-needs assessment registration.
 *
 * Release hold: OFF unless a human owner explicitly enables a bounded,
 * security-reviewed environment. This is not the I-CAN clinical-intake flag.
 */
export function isAssessmentRegistrationEnabled(): boolean {
  return process.env.MAPABLE_ASSESSMENT_REGISTRATION_ENABLED === "true";
}
