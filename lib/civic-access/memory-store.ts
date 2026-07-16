import { randomUUID } from "crypto";

import type {
  CivicAccessibilityClaim,
  CivicAssetClass,
  CivicAssetInput,
  CivicAssetLifecycle,
  CivicAssetType,
  CivicAssetVersionInput,
  CivicExternalReferenceInput,
  CivicExternalSystem,
  CivicGeometry,
  CivicLicenceKind,
  CivicSourceInput,
  CivicSourceKind,
  CivicSourceLicenceInput,
  CivicSourceVersionInput,
  CivicVisibility,
} from "./types";

export interface StoredCivicAsset {
  id: string;
  stableKey: string;
  organisationId: string | null;
  ownerOrganisationId: string | null;
  operatorOrganisationId: string | null;
  accessPlaceId: string | null;
  assetClass: CivicAssetClass;
  assetType: CivicAssetType;
  title: string;
  plainLanguageTitle: string | null;
  description: string | null;
  jurisdictionCode: string | null;
  lifecycleState: CivicAssetLifecycle;
  visibility: CivicVisibility;
  geometry: CivicGeometry | null;
  operatingHours: string | null;
  accessibilityClaims: CivicAccessibilityClaim[];
  lastVerifiedAt: Date | null;
  nextReviewAt: Date | null;
  attribution: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  retiredAt: Date | null;
  versions: StoredCivicAssetVersion[];
  externalReferences: StoredCivicExternalReference[];
  sourceId: string | null;
}

export interface StoredCivicAssetVersion {
  id: string;
  assetId: string;
  versionLabel: string;
  contentHash: string | null;
  changelog: string | null;
  sourceRevision: string | null;
  projectionSnapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface StoredCivicExternalReference {
  id: string;
  assetId: string;
  system: CivicExternalSystem;
  externalId: string;
  canonicalRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface StoredCivicSource {
  id: string;
  stableKey: string;
  name: string;
  kind: CivicSourceKind;
  organisationId: string | null;
  publisher: string | null;
  homepageUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  versions: StoredCivicSourceVersion[];
  licences: StoredCivicSourceLicence[];
}

export interface StoredCivicSourceVersion {
  id: string;
  sourceId: string;
  versionLabel: string;
  retrievedAt: Date;
  publishedAt: Date | null;
  contentHash: string | null;
  feedUrl: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface StoredCivicSourceLicence {
  id: string;
  sourceId: string;
  licenceKind: CivicLicenceKind;
  licenceName: string;
  licenceUrl: string | null;
  attributionText: string | null;
  allowsPublicPublication: boolean;
  allowsCommercialReuse: boolean;
  notes: string | null;
  createdAt: Date;
}

interface CivicMemoryStore {
  assets: Map<string, StoredCivicAsset>;
  assetsByKey: Map<string, string>;
  sources: Map<string, StoredCivicSource>;
  sourcesByKey: Map<string, string>;
}

const globalStore = globalThis as unknown as {
  __mapableCivicStore?: CivicMemoryStore;
};

function createStore(): CivicMemoryStore {
  return {
    assets: new Map(),
    assetsByKey: new Map(),
    sources: new Map(),
    sourcesByKey: new Map(),
  };
}

export function getCivicMemoryStore(): CivicMemoryStore {
  if (!globalStore.__mapableCivicStore) {
    globalStore.__mapableCivicStore = createStore();
  }
  return globalStore.__mapableCivicStore;
}

export function resetCivicMemoryStore(): void {
  globalStore.__mapableCivicStore = createStore();
}

function orgKey(organisationId: string | null | undefined): string {
  return organisationId ?? "__platform__";
}

export function memoryCreateAsset(input: CivicAssetInput): StoredCivicAsset {
  const store = getCivicMemoryStore();
  const key = `${orgKey(input.organisationId)}:${input.stableKey}`;
  if (store.assetsByKey.has(key)) {
    throw new Error("ASSET_STABLE_KEY_CONFLICT");
  }
  const now = new Date();
  const asset: StoredCivicAsset = {
    id: randomUUID(),
    stableKey: input.stableKey,
    organisationId: input.organisationId ?? null,
    ownerOrganisationId: input.ownerOrganisationId ?? input.organisationId ?? null,
    operatorOrganisationId: input.operatorOrganisationId ?? null,
    accessPlaceId: input.accessPlaceId ?? null,
    assetClass: input.assetClass,
    assetType: input.assetType,
    title: input.title,
    plainLanguageTitle: input.plainLanguageTitle ?? null,
    description: input.description ?? null,
    jurisdictionCode: input.jurisdictionCode ?? null,
    lifecycleState: input.lifecycleState ?? "registered",
    visibility: input.visibility ?? "internal",
    geometry: input.geometry ?? null,
    operatingHours: input.operatingHours ?? null,
    accessibilityClaims: input.accessibilityClaims ?? [],
    lastVerifiedAt: input.lastVerifiedAt ?? null,
    nextReviewAt: input.nextReviewAt ?? null,
    attribution: input.attribution ?? null,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    retiredAt: null,
    versions: [],
    externalReferences: [],
    sourceId: null,
  };
  store.assets.set(asset.id, asset);
  store.assetsByKey.set(key, asset.id);
  return asset;
}

export function memoryAddAssetVersion(
  assetId: string,
  input: CivicAssetVersionInput
): StoredCivicAssetVersion {
  const asset = getCivicMemoryStore().assets.get(assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  const version: StoredCivicAssetVersion = {
    id: randomUUID(),
    assetId,
    versionLabel: input.versionLabel,
    contentHash: input.contentHash ?? null,
    changelog: input.changelog ?? null,
    sourceRevision: input.sourceRevision ?? null,
    projectionSnapshot: input.projectionSnapshot ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };
  asset.versions.push(version);
  asset.updatedAt = new Date();
  return version;
}

export function memoryAddExternalReference(
  assetId: string,
  input: CivicExternalReferenceInput
): StoredCivicExternalReference {
  const asset = getCivicMemoryStore().assets.get(assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  const duplicate = asset.externalReferences.find(
    (r) => r.system === input.system && r.externalId === input.externalId
  );
  if (duplicate) throw new Error("EXTERNAL_REF_CONFLICT");
  const ref: StoredCivicExternalReference = {
    id: randomUUID(),
    assetId,
    system: input.system,
    externalId: input.externalId,
    canonicalRef:
      input.canonicalRef ?? `${input.system}:${input.externalId}`,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };
  asset.externalReferences.push(ref);
  asset.updatedAt = new Date();
  if (input.system === "access_place" && !asset.accessPlaceId) {
    asset.accessPlaceId = input.externalId;
  }
  return ref;
}

export function memoryListAssets(
  organisationId?: string | null
): StoredCivicAsset[] {
  const all = Array.from(getCivicMemoryStore().assets.values());
  if (organisationId === undefined) return all;
  if (organisationId === null) {
    return all.filter((a) => a.organisationId === null);
  }
  return all.filter((a) => a.organisationId === organisationId);
}

export function memoryGetAsset(assetId: string): StoredCivicAsset | null {
  return getCivicMemoryStore().assets.get(assetId) ?? null;
}

export function memoryCreateSource(input: CivicSourceInput): StoredCivicSource {
  const store = getCivicMemoryStore();
  if (store.sourcesByKey.has(input.stableKey)) {
    throw new Error("SOURCE_STABLE_KEY_CONFLICT");
  }
  const now = new Date();
  const source: StoredCivicSource = {
    id: randomUUID(),
    stableKey: input.stableKey,
    name: input.name,
    kind: input.kind,
    organisationId: input.organisationId ?? null,
    publisher: input.publisher ?? null,
    homepageUrl: input.homepageUrl ?? null,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    versions: [],
    licences: [],
  };
  store.sources.set(source.id, source);
  store.sourcesByKey.set(input.stableKey, source.id);
  return source;
}

export function memoryAddSourceVersion(
  sourceId: string,
  input: CivicSourceVersionInput
): StoredCivicSourceVersion {
  const source = getCivicMemoryStore().sources.get(sourceId);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  const version: StoredCivicSourceVersion = {
    id: randomUUID(),
    sourceId,
    versionLabel: input.versionLabel,
    retrievedAt: input.retrievedAt,
    publishedAt: input.publishedAt ?? null,
    contentHash: input.contentHash ?? null,
    feedUrl: input.feedUrl ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };
  source.versions.push(version);
  source.updatedAt = new Date();
  return version;
}

export function memoryAddSourceLicence(
  sourceId: string,
  input: CivicSourceLicenceInput
): StoredCivicSourceLicence {
  const source = getCivicMemoryStore().sources.get(sourceId);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  const licence: StoredCivicSourceLicence = {
    id: randomUUID(),
    sourceId,
    licenceKind: input.licenceKind,
    licenceName: input.licenceName,
    licenceUrl: input.licenceUrl ?? null,
    attributionText: input.attributionText ?? null,
    allowsPublicPublication: input.allowsPublicPublication,
    allowsCommercialReuse: input.allowsCommercialReuse,
    notes: input.notes ?? null,
    createdAt: new Date(),
  };
  source.licences.push(licence);
  source.updatedAt = new Date();
  return licence;
}

export function memoryGetSource(sourceId: string): StoredCivicSource | null {
  return getCivicMemoryStore().sources.get(sourceId) ?? null;
}

export function memoryGetSourceByKey(
  stableKey: string
): StoredCivicSource | null {
  const id = getCivicMemoryStore().sourcesByKey.get(stableKey);
  if (!id) return null;
  return memoryGetSource(id);
}

export function memoryListSources(): StoredCivicSource[] {
  return Array.from(getCivicMemoryStore().sources.values());
}

export function memoryLinkAssetSource(
  assetId: string,
  sourceId: string
): void {
  const asset = memoryGetAsset(assetId);
  const source = memoryGetSource(sourceId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  if (source.licences.length === 0) {
    throw new Error("LICENCE_REQUIRED");
  }
  asset.sourceId = sourceId;
  asset.updatedAt = new Date();
}
