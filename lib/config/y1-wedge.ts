/** Tracks A+B+C pilot: trust wedge + public conversion (see feature plan). */
export type Y1WedgeConfig = {
  supportProfileEnabled: boolean;
  participantMatchReviewEnabled: boolean;
  incidentIntakeV2Enabled: boolean;
  microConsentEnabled: boolean;
  backupShiftRecoveryEnabled: boolean;
};

function isY1WedgeStagingEnvironment(): boolean {
  return (
    process.env.MAPABLE_Y1_WEDGE_STAGING === "true" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  );
}

function readWedgeEnvFlag(
  key: string,
  options?: { stagingDefault?: boolean },
): boolean {
  const value = process.env[key];
  if (value === "true") return true;
  if (value === "false") return false;
  if (options?.stagingDefault && isY1WedgeStagingEnvironment()) {
    return true;
  }
  return false;
}

export const y1WedgeConfig: Y1WedgeConfig = {
  supportProfileEnabled: readWedgeEnvFlag("SUPPORT_PROFILE_ENABLED", {
    stagingDefault: true,
  }),
  participantMatchReviewEnabled: readWedgeEnvFlag(
    "PARTICIPANT_MATCH_REVIEW_ENABLED",
    { stagingDefault: true },
  ),
  incidentIntakeV2Enabled: readWedgeEnvFlag("INCIDENT_INTAKE_V2_ENABLED"),
  microConsentEnabled: readWedgeEnvFlag("MICRO_CONSENT_ENABLED"),
  backupShiftRecoveryEnabled: readWedgeEnvFlag("BACKUP_SHIFT_RECOVERY_ENABLED"),
};

export function isY1WedgeStagingDefaultsActive(): boolean {
  return isY1WedgeStagingEnvironment();
}
