import { deriveAssetCriticality } from "../criticality";
import {
  isAccessibilityOpsFlagEnabled,
  useAccessibilityOpsMemoryStore,
} from "../feature-flags";
import {
  memoryAddAssetVersion,
  memoryAddDependency,
  memoryCreateAsset,
  memoryGetAsset,
  memoryListAssets,
  type StoredAsset,
} from "../memory-store";
import type {
  AccessibilityAssetInput,
  AccessibilityAssetVersionInput,
} from "../types";

function assertRegistryEnabled(): void {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("assetRegistry")
  ) {
    throw new Error("ACCESSIBILITY_OPS_DISABLED");
  }
}

export async function registerAccessibilityAsset(
  input: AccessibilityAssetInput
): Promise<StoredAsset> {
  assertRegistryEnabled();
  if (!useAccessibilityOpsMemoryStore()) {
    // Prisma path reserved for post-migration dual-write; Wave 1 uses memory/demo store.
    // When USE_MEMORY=false and tables exist, future PR can switch here.
  }
  const criticality = deriveAssetCriticality({
    assetType: input.assetType,
    purposeTags: input.purposeTags,
    explicit: input.criticality,
  });
  return memoryCreateAsset({ ...input, criticality });
}

export async function createAccessibilityAssetVersion(
  assetId: string,
  input: AccessibilityAssetVersionInput
) {
  assertRegistryEnabled();
  return memoryAddAssetVersion(assetId, input);
}

export async function linkAccessibilityAssetDependency(
  assetId: string,
  dependsOnAssetId: string,
  dependencyType = "depends_on"
) {
  assertRegistryEnabled();
  return memoryAddDependency(assetId, dependsOnAssetId, dependencyType);
}

export async function listAccessibilityAssets(organisationId?: string | null) {
  assertRegistryEnabled();
  return memoryListAssets(organisationId);
}

export async function getAccessibilityAsset(assetId: string) {
  assertRegistryEnabled();
  return memoryGetAsset(assetId);
}

export function serializeAsset(asset: StoredAsset) {
  return {
    id: asset.id,
    stableKey: asset.stableKey,
    organisationId: asset.organisationId,
    ownerUserId: asset.ownerUserId,
    assetClass: asset.assetClass,
    assetType: asset.assetType,
    title: asset.title,
    plainLanguageTitle: asset.plainLanguageTitle,
    description: asset.description,
    criticality: asset.criticality,
    lifecycleState: asset.lifecycleState,
    visibility: asset.visibility,
    sourceSystem: asset.sourceSystem,
    deploymentEnvironment: asset.deploymentEnvironment,
    canonicalDomainRef: asset.canonicalDomainRef,
    purposeTags: asset.purposeTags,
    metadata: asset.metadata,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    retiredAt: asset.retiredAt?.toISOString() ?? null,
    versions: asset.versions.map((v) => ({
      id: v.id,
      versionLabel: v.versionLabel,
      contentHash: v.contentHash,
      changelog: v.changelog,
      sourceRevision: v.sourceRevision,
      createdAt: v.createdAt.toISOString(),
    })),
    dependencies: asset.dependencies.map((d) => ({
      id: d.id,
      dependsOnAssetId: d.dependsOnAssetId,
      dependencyType: d.dependencyType,
    })),
    owners: asset.owners.map((o) => ({
      id: o.id,
      userId: o.userId,
      roleLabel: o.roleLabel,
      accountable: o.accountable,
    })),
  };
}
