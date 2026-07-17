import { isCivicFlagEnabled, useCivicMemoryStore } from "../feature-flags";
import {
  memoryAddSourceLicence,
  memoryAddSourceVersion,
  memoryCreateSource,
  memoryGetSource,
  memoryGetSourceByKey,
  memoryListSources,
  type StoredCivicSource,
} from "../memory-store";
import type {
  CivicSourceInput,
  CivicSourceLicenceInput,
  CivicSourceVersionInput,
} from "../types";

function assertRegistryEnabled(): void {
  if (!isCivicFlagEnabled("assetRegistry")) {
    throw new Error("MAPABLE_CIVIC_DISABLED");
  }
}

export async function registerCivicSource(
  input: CivicSourceInput
): Promise<StoredCivicSource> {
  assertRegistryEnabled();
  if (!useCivicMemoryStore()) {
    // Prisma path reserved for post-migration enablement.
  }
  return memoryCreateSource(input);
}

export async function createCivicSourceVersion(
  sourceId: string,
  input: CivicSourceVersionInput
) {
  assertRegistryEnabled();
  return memoryAddSourceVersion(sourceId, input);
}

export async function attachCivicSourceLicence(
  sourceId: string,
  input: CivicSourceLicenceInput
) {
  assertRegistryEnabled();
  return memoryAddSourceLicence(sourceId, input);
}

export async function getCivicSource(sourceId: string) {
  assertRegistryEnabled();
  const source = memoryGetSource(sourceId);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  return source;
}

export async function getCivicSourceByKey(stableKey: string) {
  assertRegistryEnabled();
  return memoryGetSourceByKey(stableKey);
}

export async function listCivicSources() {
  assertRegistryEnabled();
  return memoryListSources();
}

export function serializeCivicSource(source: StoredCivicSource) {
  return {
    id: source.id,
    stableKey: source.stableKey,
    name: source.name,
    kind: source.kind,
    organisationId: source.organisationId,
    publisher: source.publisher,
    homepageUrl: source.homepageUrl,
    metadata: source.metadata,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    versions: source.versions.map((v) => ({
      id: v.id,
      versionLabel: v.versionLabel,
      retrievedAt: v.retrievedAt.toISOString(),
      publishedAt: v.publishedAt?.toISOString() ?? null,
      contentHash: v.contentHash,
      feedUrl: v.feedUrl,
      notes: v.notes,
    })),
    licences: source.licences.map((l) => ({
      id: l.id,
      licenceKind: l.licenceKind,
      licenceName: l.licenceName,
      licenceUrl: l.licenceUrl,
      attributionText: l.attributionText,
      allowsPublicPublication: l.allowsPublicPublication,
      allowsCommercialReuse: l.allowsCommercialReuse,
    })),
  };
}
