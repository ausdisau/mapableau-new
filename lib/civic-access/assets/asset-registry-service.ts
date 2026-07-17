import {
  isCivicFlagEnabled,
  useCivicMemoryStore,
} from "../feature-flags";
import { assertNoUniversalScore, paidOrgCannotBoostConfidence } from "../invariants";
import {
  memoryAddAssetVersion,
  memoryAddExternalReference,
  memoryCreateAsset,
  memoryGetAsset,
  memoryLinkAssetSource,
  memoryListAssets,
  type StoredCivicAsset,
} from "../memory-store";
import type {
  CivicAssetInput,
  CivicAssetVersionInput,
  CivicExternalReferenceInput,
} from "../types";

function assertRegistryEnabled(): void {
  if (!isCivicFlagEnabled("assetRegistry")) {
    throw new Error("MAPABLE_CIVIC_DISABLED");
  }
}

export async function registerCivicAsset(
  input: CivicAssetInput
): Promise<StoredCivicAsset> {
  assertRegistryEnabled();
  assertNoUniversalScore(input.metadata ?? {});
  paidOrgCannotBoostConfidence({
    isPaidBoost: Boolean(input.metadata?.paidConfidenceBoost),
  });

  if (!useCivicMemoryStore()) {
    // Prisma persistence reserved for post-migration dual-write.
    // Wave 1 runtime/tests use the memory store by default.
  }

  return memoryCreateAsset(input);
}

export async function createCivicAssetVersion(
  assetId: string,
  input: CivicAssetVersionInput
) {
  assertRegistryEnabled();
  return memoryAddAssetVersion(assetId, input);
}

export async function linkCivicExternalReference(
  assetId: string,
  input: CivicExternalReferenceInput
) {
  assertRegistryEnabled();
  return memoryAddExternalReference(assetId, input);
}

export async function linkCivicAssetToSource(
  assetId: string,
  sourceId: string
) {
  assertRegistryEnabled();
  memoryLinkAssetSource(assetId, sourceId);
}

export async function listCivicAssets(organisationId?: string | null) {
  assertRegistryEnabled();
  return memoryListAssets(organisationId);
}

export async function getCivicAsset(assetId: string) {
  assertRegistryEnabled();
  const asset = memoryGetAsset(assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  return asset;
}

export function serializeCivicAsset(asset: StoredCivicAsset) {
  return {
    id: asset.id,
    stableKey: asset.stableKey,
    organisationId: asset.organisationId,
    ownerOrganisationId: asset.ownerOrganisationId,
    operatorOrganisationId: asset.operatorOrganisationId,
    accessPlaceId: asset.accessPlaceId,
    assetClass: asset.assetClass,
    assetType: asset.assetType,
    title: asset.title,
    plainLanguageTitle: asset.plainLanguageTitle,
    description: asset.description,
    jurisdictionCode: asset.jurisdictionCode,
    lifecycleState: asset.lifecycleState,
    visibility: asset.visibility,
    geometry: asset.geometry,
    operatingHours: asset.operatingHours,
    accessibilityClaims: asset.accessibilityClaims,
    lastVerifiedAt: asset.lastVerifiedAt?.toISOString() ?? null,
    nextReviewAt: asset.nextReviewAt?.toISOString() ?? null,
    attribution: asset.attribution,
    metadata: asset.metadata,
    sourceId: asset.sourceId,
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
    externalReferences: asset.externalReferences.map((r) => ({
      id: r.id,
      system: r.system,
      externalId: r.externalId,
      canonicalRef: r.canonicalRef,
    })),
  };
}
