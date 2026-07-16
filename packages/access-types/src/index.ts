/**
 * @mapable/access-types — shared Zod-friendly type exports for partner SDK.
 * Semantic versioning starts at 0.1.0; breaking changes require major bumps.
 */

export type AccessWidgetMode =
  | "quick_access_summary"
  | "current_incident_banner"
  | "entrance_selector"
  | "access_guide_launcher"
  | "personal_fit_checker"
  | "visit_plan_launcher"
  | "accessibility_feedback_link";

export type PublicAccessFeatureSummary = {
  type: string;
  summary: string;
  source: string;
  observedAt: string | null;
  confidenceLabel: string;
  unknown: boolean;
};
