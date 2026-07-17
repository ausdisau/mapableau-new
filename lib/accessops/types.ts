import type {
  AccessAsset,
  AccessAssetLifecycleStatus,
  AccessAssetType,
  AccessEdgeDirection,
  AccessFitResult,
  AccessOperationalState,
  AccessPublicVisibility,
  AccessSecurityClassification,
  AccessSensorHealthStatus,
  AccessTwinEdge,
  AccessTwinEdgeType,
} from "@prisma/client";

export type JsonObject = Record<string, unknown>;

export const ACCESSOPS_PERMISSIONS = {
  readPublic: "accessops:read_public",
  readRestricted: "accessops:read_restricted",
  publishGraph: "accessops:publish_graph",
  manageAssets: "accessops:manage_assets",
  manageStatus: "accessops:manage_status",
  manageIncidents: "accessops:manage_incidents",
  manageSources: "accessops:manage_sources",
  manageSensors: "accessops:manage_sensors",
  exportOpenData: "accessops:export_open_data",
  manageWebhooks: "accessops:manage_webhooks",
} as const;

export const ACCESSOPS_FEATURE_FLAG_KEYS = [
  "ACCESSOPS_EXTERNAL_FEEDS_ENABLED",
  "ACCESSOPS_OUTDOOR_PROVIDERS_ENABLED",
  "ACCESSOPS_OPEN_DATA_EXPORTS_ENABLED",
  "ACCESSOPS_WEBHOOKS_PRODUCTION_ENABLED",
  "ACCESSOPS_STATUS_SUBSCRIPTIONS_ENABLED",
  "ACCESSOPS_SENSOR_FEEDS_ENABLED",
  "ACCESSOPS_INDOOR_IMPORTS_ENABLED",
] as const;

export type AccessOpsFeatureFlagKey =
  (typeof ACCESSOPS_FEATURE_FLAG_KEYS)[number];

export const ACCESSOPS_RELIABILITY_CALCULATION_VERSION =
  "accessops-reliability-v1";

export interface AccessAssetDto {
  id: string;
  publicIdentifier: string;
  assetType: AccessAssetType;
  title: string;
  description: string | null;
  lifecycleStatus: AccessAssetLifecycleStatus;
  publicVisibility: AccessPublicVisibility;
  securityClassification: AccessSecurityClassification;
  geometryReference: string | null;
  geometryType: string | null;
  geometryVersion: number;
  ownerEntityId: string | null;
  operatorEntityId: string | null;
  maintainerEntityId: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface OperationalStatusProjection {
  assetId: string | null;
  state: AccessOperationalState;
  available: boolean;
  stale: boolean;
  sourceType: string | null;
  confidence: number;
  effectiveFrom: Date | null;
  expectedUntil: Date | null;
  freshnessDeadline: Date | null;
  reason: string;
}

export interface MinuteStatusBucket {
  state: AccessOperationalState;
  minutes: number;
  expected?: boolean;
  evidencePresent?: boolean;
  scheduled?: boolean;
  outageKey?: string;
}

export interface ReliabilityWindowResult {
  expectedAvailableMinutes: number;
  verifiedAvailableMinutes: number;
  degradedMinutes: number;
  unavailableMinutes: number;
  unknownMinutes: number;
  scheduledMaintenanceMinutes: number;
  unplannedOutageCount: number;
  meanRestoreMinutes: number | null;
  longestOutageMinutes: number | null;
  statusCoveragePercent: number;
  evidenceCompleteness: number;
  calculationVersion: typeof ACCESSOPS_RELIABILITY_CALCULATION_VERSION;
}

export interface AccessTwinNode {
  assetId: string;
  assetType: AccessAssetType;
  publicIdentifier: string;
  securityClassification: AccessSecurityClassification;
  publicVisibility: AccessPublicVisibility;
  title: string;
}

export interface AccessTwinRouteEdge {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  edgeType: AccessTwinEdgeType;
  direction: AccessEdgeDirection;
  securityClassification: AccessSecurityClassification;
  accessibilityConstraints?: JsonObject | null;
  minimumClearance?: number | null;
  maximumGradient?: number | null;
  validUntil?: Date | null;
  toAssetType?: AccessAssetType;
  toPublicVisibility?: AccessPublicVisibility;
  toSecurityClassification?: AccessSecurityClassification;
}

export interface AccessRouteConstraints {
  requiresWheelchairAccess?: boolean;
  maximumGradient?: number;
  minimumClearance?: number;
  hardBlockedAssetIds?: string[];
}

export interface AccessRouteResult {
  found: boolean;
  assetIds: string[];
  edgeIds: string[];
  warnings: string[];
}

export interface PublicationPolicySubject {
  securityClassification?: AccessSecurityClassification | null;
  publicVisibility?: AccessPublicVisibility | null;
  lifecycleStatus?: AccessAssetLifecycleStatus | null;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export interface ConformanceResult {
  conformant: boolean;
  profile: string;
  errors: string[];
  warnings: string[];
}

export interface JourneyRouteOption {
  routeId: string;
  assetIds: string[];
  edgeIds: string[];
  fit: AccessFitResult;
  warnings: string[];
  requiresApproval: boolean;
}

export interface OpaqueToken {
  token: string;
  expiresAt: Date;
  checksum: string;
}

export interface EvidenceReference {
  ref: string;
  checksum: string;
  capturedAt: Date;
  private: boolean;
}

export const AVAILABLE_STATES: readonly AccessOperationalState[] = [
  "reported_available",
  "verified_available",
];

export const BLOCKING_STATES: readonly AccessOperationalState[] = [
  "temporarily_unavailable",
  "scheduled_unavailable",
  "under_maintenance",
  "permanently_removed",
  "status_conflict",
  "stale",
  "unknown",
  "test_only",
];

export const RESTRICTED_CLASSIFICATIONS: readonly AccessSecurityClassification[] =
  ["restricted", "security_sensitive"];

export function mapAccessAssetDto(asset: AccessAsset): AccessAssetDto {
  return {
    id: asset.id,
    publicIdentifier: asset.publicIdentifier,
    assetType: asset.assetType,
    title: asset.title,
    description: asset.plainLanguageDescription,
    lifecycleStatus: asset.lifecycleStatus,
    publicVisibility: asset.publicVisibility,
    securityClassification: asset.securityClassification,
    geometryReference: asset.geometryReference,
    geometryType: asset.geometryType,
    geometryVersion: asset.geometryVersion,
    ownerEntityId: asset.ownerEntityId,
    operatorEntityId: asset.operatorEntityId,
    maintainerEntityId: asset.maintainerEntityId,
    effectiveFrom: asset.effectiveFrom,
    effectiveTo: asset.effectiveTo,
  };
}

export function isRestrictedClassification(
  classification: AccessSecurityClassification | null | undefined,
): boolean {
  return (
    classification === "restricted" || classification === "security_sensitive"
  );
}

export function isPubliclyVisibleAsset(
  asset: PublicationPolicySubject,
): boolean {
  return (
    !isRestrictedClassification(asset.securityClassification) &&
    asset.publicVisibility === "public" &&
    asset.lifecycleStatus !== "retired" &&
    asset.lifecycleStatus !== "removed" &&
    asset.lifecycleStatus !== "archived"
  );
}

export function isPrismaTwinEdge(edge: AccessTwinEdge): AccessTwinEdge {
  return edge;
}

export type SensorSafetyState = AccessSensorHealthStatus | "missing_heartbeat";
