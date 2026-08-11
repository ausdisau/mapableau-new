import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import type { DataClass } from "@/lib/ai/platform/types/classification";
import type {
  CapabilityMaturity,
  ProductionClaimStatus,
} from "@/lib/ai/platform/types/maturity";

export type CapabilityBackend = "deterministic" | "model_backed" | "hybrid";

export type AiCapabilityRegistration = {
  key: string;
  /** Semver-style capability version for audit and ARC sidecars. */
  version?: string;
  publicName: string;
  internalOwner: string;
  responsibleDomain: string;
  intendedUsers: string[];
  intendedPurpose: string;
  prohibitedUses: string[];
  maturity: CapabilityMaturity;
  productionClaimStatus: ProductionClaimStatus;
  featureFlag: string;
  backend: CapabilityBackend;
  modelIdentifier: string | null;
  promptVersion: string | null;
  toolAllowlist: string[];
  inputSchemaRef: string;
  outputSchemaRef: string;
  permittedDataClasses: DataClass[];
  prohibitedDataClasses: DataClass[];
  /** Purpose-specific consent scopes that must be current before invocation. */
  requiredConsentScopes?: string[];
  /** Maximum autonomy / authority ceiling for this capability. */
  authorityCeiling: AuthorityCeiling;
  /** Approval envelope lifetime in minutes when participant/human approval is required. */
  approvalExpiryMinutes?: number;
  humanReviewRequired: boolean;
  participantApprovalRequired: boolean;
  fallbackBehaviour: string;
  maxLatencyMs: number;
  tokenBudget: number | null;
  costBudgetUsd: number | null;
  evaluationSuite: string | null;
  algorithmRegisterRef: string | null;
  reviewDueDate: string | null;
  killSwitchKey: string;
  /** Required audit action prefixes emitted for consequential uses. */
  auditEventRequirements?: string[];
};
