/**
 * Canonical AccessibilityOps domain types (Wave 1 control plane).
 * Does not introduce a universal accessibility score.
 */

export type AccessibilityAssetClass =
  | "digital"
  | "built"
  | "service"
  | "integration"
  | "procurement";

export type AccessibilityAssetType =
  | "web_application"
  | "route"
  | "page"
  | "component"
  | "design_system_component"
  | "form"
  | "user_flow"
  | "embedded_widget"
  | "email_template"
  | "notification_template"
  | "pdf"
  | "generated_document"
  | "public_access_guide"
  | "native_mobile_screen"
  | "place"
  | "building"
  | "entrance"
  | "pathway"
  | "lift"
  | "floor_plan"
  | "route_graph"
  | "booking_workflow"
  | "complaint_workflow"
  | "transport_request_workflow"
  | "api"
  | "gtfs_source"
  | "partner_widget"
  | "tender_requirement"
  | "other";

export type AccessibilityAssetCriticality =
  | "informational"
  | "important"
  | "essential"
  | "safety_critical";

export type AccessibilityAssetLifecycle =
  | "draft"
  | "registered"
  | "active"
  | "deprecated"
  | "retired";

export type AccessibilityVisibility = "public" | "internal" | "restricted";

export type AccessibilityRuleProfile =
  | "act_web"
  | "mobile"
  | "document"
  | "built_environment"
  | "service_workflow"
  | "procurement_conformance"
  | "lived_experience"
  | "design_system"
  | "mapable_internal";

export type AccessibilityRuleAutomation =
  | "automated"
  | "semi_automated"
  | "manual"
  | "lived_experience";

export type AccessibilityOutcome =
  | "passed"
  | "failed"
  | "inapplicable"
  | "cannot_tell"
  | "manual_review_required"
  | "lived_experience_review_required"
  | "evidence_expired"
  | "disputed";

export type AccessibilitySeverity =
  | "observation"
  | "minor"
  | "moderate"
  | "major"
  | "critical";

export type AccessibilityOpsMode = "demo" | "shadow" | "supervised" | "production";

export interface AccessibilityAssetInput {
  stableKey: string;
  organisationId?: string | null;
  ownerUserId?: string | null;
  assetClass: AccessibilityAssetClass;
  assetType: AccessibilityAssetType;
  title: string;
  plainLanguageTitle?: string;
  description?: string;
  criticality: AccessibilityAssetCriticality;
  lifecycleState?: AccessibilityAssetLifecycle;
  visibility?: AccessibilityVisibility;
  sourceSystem?: string;
  deploymentEnvironment?: string;
  canonicalDomainRef?: string | null;
  /** Purpose labels used to derive criticality — never model-inferred alone */
  purposeTags?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccessibilityAssetVersionInput {
  versionLabel: string;
  contentHash?: string;
  changelog?: string;
  sourceRevision?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessibilityRuleInput {
  stableKey: string;
  title: string;
  plainLanguageTitle: string;
  description: string;
  profile: AccessibilityRuleProfile;
  automation: AccessibilityRuleAutomation;
  sourceOrganisation: string;
  sourceTitle: string;
  sourceVersion: string;
  sourceStatus: string;
  requirementRefs?: string[];
  internalInterpretation?: string;
  severityDefault?: AccessibilitySeverity;
  ownerUserId?: string | null;
  knownLimitations?: string;
  evidenceRequirements?: string;
}

export interface AccessibilityRuleVersionInput {
  versionLabel: string;
  expectation: string;
  assumptions?: string;
  inputRequirements?: string;
  effectiveFrom?: Date;
  reviewBy?: Date;
  supersededByRuleVersionId?: string | null;
}

export interface ShadowEvaluationInput {
  assetId: string;
  assetVersionId?: string | null;
  ruleIds?: string[];
  /** Optional observations from parsers/runners — never AI severity */
  observations?: Array<{
    ruleStableKey: string;
    outcome: AccessibilityOutcome;
    reasonCodes: string[];
    notes?: string;
    evidenceRefs?: string[];
  }>;
  correlationId?: string;
  /** Must never influence severity or outcome */
  commercialPlan?: string | null;
}

export interface ShadowEvaluationResultItem {
  ruleId: string;
  ruleStableKey: string;
  ruleVersionId: string;
  outcome: AccessibilityOutcome;
  reasonCodes: string[];
  severityDefault: AccessibilitySeverity;
  notes?: string;
  evidenceRefs: string[];
}

export interface ShadowEvaluationResult {
  evaluationId: string;
  assetId: string;
  assetVersionId: string | null;
  mode: AccessibilityOpsMode;
  results: ShadowEvaluationResultItem[];
  blocking: false;
  correlationId: string;
  createdAt: string;
}
