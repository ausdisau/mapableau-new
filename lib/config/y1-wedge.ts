export const y1WedgeConfig = {
  supportProfileEnabled: process.env.SUPPORT_PROFILE_ENABLED === "true",
  participantMatchReviewEnabled:
    process.env.PARTICIPANT_MATCH_REVIEW_ENABLED === "true",
  incidentIntakeV2Enabled: process.env.INCIDENT_INTAKE_V2_ENABLED === "true",
  microConsentEnabled: process.env.MICRO_CONSENT_ENABLED === "true",
  backupShiftRecoveryEnabled:
    process.env.BACKUP_SHIFT_RECOVERY_ENABLED === "true",
};

export function isSupportProfileEnabled() {
  return y1WedgeConfig.supportProfileEnabled;
}

export function isParticipantMatchReviewEnabled() {
  return y1WedgeConfig.participantMatchReviewEnabled;
}

export function isBackupShiftRecoveryEnabled() {
  return y1WedgeConfig.backupShiftRecoveryEnabled;
}

export function isAnyY1WedgeFeatureEnabled() {
  return Object.values(y1WedgeConfig).some(Boolean);
}
