import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";

/**
 * Y1 wedge pilot configuration — one org + participant cohort with trust
 * infrastructure enabled in staging/production.
 *
 * Set Y1_WEDGE_PILOT_ENABLED=true and configure cohort env vars to activate.
 */
export const y1WedgePilotConfig = {
  enabled: process.env.Y1_WEDGE_PILOT_ENABLED === "true",
  organisationId: process.env.Y1_WEDGE_PILOT_ORG_ID ?? "",
  participantCohortEmails: (process.env.Y1_WEDGE_PILOT_COHORT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean),
  /** When true, Y2 orchestration flags are also enabled for pilot orgs. */
  includeY2Orchestration:
    process.env.Y1_WEDGE_PILOT_INCLUDE_Y2 === "true",
};

export type Y1WedgeUxPath = {
  key: string;
  label: string;
  href: string;
  description: string;
  flag: keyof typeof y1WedgeConfig;
};

/** Participant UX paths aligned to masterplan Y1 wedge. */
export const Y1_WEDGE_UX_PATHS: Y1WedgeUxPath[] = [
  {
    key: "support-profile",
    label: "Support profile",
    href: "/dashboard/support-profile",
    description: "Publish routines, preferences, boundaries, and escalation.",
    flag: "supportProfileEnabled",
  },
  {
    key: "match-review",
    label: "Match review",
    href: "/dashboard/care/matches",
    description: "Review explainable worker matches before confirming.",
    flag: "participantMatchReviewEnabled",
  },
  {
    key: "backup-recovery",
    label: "Backup recovery",
    href: "/dashboard/care/recovery",
    description: "Recover continuity when a shift is cancelled or at risk.",
    flag: "backupShiftRecoveryEnabled",
  },
  {
    key: "incident-intake",
    label: "Incident intake",
    href: "/dashboard/safety/incidents/new",
    description: "Stepped safeguarding and complaint intake.",
    flag: "incidentIntakeV2Enabled",
  },
  {
    key: "micro-consent",
    label: "Micro-consent",
    href: "/dashboard/consent",
    description: "Granular consent for data sharing across modules.",
    flag: "microConsentEnabled",
  },
];

/** Masterplan north-star proxy metrics for the pilot. */
export const Y1_WEDGE_SUCCESS_METRICS = [
  {
    key: "continuity_adjusted_supported_weeks",
    label: "Continuity-adjusted supported weeks",
    description: "Weeks with at least one approved shift minus serious misfits.",
  },
  {
    key: "match_dispute_rate",
    label: "Match dispute rate",
    description: "Participant disputes / total match confirmations.",
  },
  {
    key: "backup_recovery_success_rate",
    label: "Backup recovery success rate",
    description: "Assigned recoveries / detected at-risk shifts.",
  },
] as const;

export function isY1WedgePilotActive() {
  return y1WedgePilotConfig.enabled;
}

export function isUserInY1PilotCohort(email: string | null | undefined) {
  if (!y1WedgePilotConfig.enabled) return false;
  if (y1WedgePilotConfig.participantCohortEmails.length === 0) return true;
  if (!email) return false;
  return y1WedgePilotConfig.participantCohortEmails.includes(email);
}

export function isY1WedgeFeatureEnabled(
  flag: keyof typeof y1WedgeConfig
): boolean {
  if (!y1WedgeConfig[flag]) return false;
  if (!y1WedgePilotConfig.enabled) return y1WedgeConfig[flag];
  return y1WedgeConfig[flag];
}

export function getActiveY1UxPaths(): Y1WedgeUxPath[] {
  return Y1_WEDGE_UX_PATHS.filter((path) =>
    isY1WedgeFeatureEnabled(path.flag)
  );
}

/** Recommended env bundle for staging pilot (documented in docs/pilot/y1-wedge-pilot.md). */
export function getY1PilotEnvBundle() {
  return {
    Y1_WEDGE_PILOT_ENABLED: "true",
    SUPPORT_PROFILE_ENABLED: "true",
    PARTICIPANT_MATCH_REVIEW_ENABLED: "true",
    BACKUP_SHIFT_RECOVERY_ENABLED: "true",
    INCIDENT_INTAKE_V2_ENABLED: "true",
    MICRO_CONSENT_ENABLED: "true",
    ...(y1WedgePilotConfig.includeY2Orchestration
      ? {
          Y1_WEDGE_PILOT_INCLUDE_Y2: "true",
          BACKUP_RECOVERY_PILOT_ENABLED: "true",
          CARE_TRANSPORT_ORCHESTRATION_V2_ENABLED: "true",
        }
      : {}),
  };
}

export function isOrchestrationPilotActive() {
  return (
    y1WedgePilotConfig.includeY2Orchestration &&
    y2OrchestrationConfig.careTransportOrchestrationV2Enabled
  );
}
