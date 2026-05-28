export type PlatformGapCategory =
  | "product"
  | "integration"
  | "tenancy_auth"
  | "launch_ops"
  | "compliance_ndis";

export type PlatformGapSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type PlatformGapDetectedStatus =
  | "open"
  | "partial"
  | "met"
  | "not_applicable";

export type PlatformGapResolutionStatus =
  | "open"
  | "in_progress"
  | "mitigated"
  | "accepted_risk"
  | "closed";

export type PlatformGapDetectorId =
  | "ecosystem_roadmap"
  | "integration_stubs"
  | "integration_health"
  | "launch_item_sync"
  | "static_open"
  | "static_partial"
  | "static_met"
  | "ndia_real_submission"
  | "auth0_config"
  | "provider_billing_tenancy"
  | "provider_auth_bridge"
  | "care_ndis_pricing"
  | "care_allocation_flag";

export type PlatformGapEvidenceLink = {
  label: string;
  href: string;
};

export type PlatformGapCatalogEntry = {
  code: string;
  category: PlatformGapCategory;
  title: string;
  description: string;
  severity: PlatformGapSeverity;
  baseline: string;
  evidenceLinks: PlatformGapEvidenceLink[];
  detector?: PlatformGapDetectorId;
  /** For integration_health detector */
  integrationKey?: string;
  /** For launch_item_sync — matches LaunchReadinessItem.code */
  launchItemCode?: string;
};

export type PlatformGapDetectionResult = {
  detectedStatus: PlatformGapDetectedStatus;
  detectedSummary: string;
};

export type PlatformGapRow = {
  code: string;
  category: PlatformGapCategory;
  title: string;
  description: string;
  severity: PlatformGapSeverity;
  baseline: string;
  evidenceLinks: PlatformGapEvidenceLink[];
  detectedStatus: PlatformGapDetectedStatus;
  detectedSummary: string;
  effectiveStatus: PlatformGapResolutionStatus;
  overrideStatus: PlatformGapResolutionStatus | null;
  overrideNotes: string | null;
  lastEvaluatedAt: string;
};

export type PlatformGapAnalysisSummary = {
  lastEvaluatedAt: string;
  total: number;
  openCount: number;
  byCategory: Record<PlatformGapCategory, { total: number; open: number }>;
  bySeverity: Record<PlatformGapSeverity, number>;
  gaps: PlatformGapRow[];
};
