import { createHash, randomBytes } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getObjectStorageConfig } from "@/lib/config/object-storage";
import { prisma } from "@/lib/prisma";

import { STORAGE_AUDIT_ACTIONS } from "./audit-actions";
import {
  StorageAuthorizationError,
  StorageGrantExpiredError,
  StorageNotEnabledError,
  StoragePolicyError,
  StorageReplayError,
  ObjectNotFoundError,
} from "./errors";
import { getObjectStore } from "./factory";
import { sanitiseOriginalFilename } from "./filename";
import { buildAccessEvidencePhotoKey } from "./key-builder";
import { incrementStorageMetric } from "./metrics";
import type { ObjectStore } from "./object-store";
import {
  assertClassificationAllowedForPurpose,
  assertMimeAndSize,
  resolveBucketForPurpose,
  resolvePurposePolicy,
} from "./policies";
import type { StoragePurpose, SignedUploadGrant } from "./types";

function hashNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}

function newNonce(): string {
  return randomBytes(32).toString("hex");
}

function newCuidLikeId(): string {
  return randomBytes(12).toString("hex");
}

export function assertObjectStorageEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (!getObjectStorageConfig(environment).enabled) {
    throw new StorageNotEnabledError();
  }
}

export type AuthoriseUploadInput = {
  actor: CurrentUser;
  purpose: StoragePurpose;
  contentType: string;
  sizeBytes: number;
  originalFilename: string;
  placeId: string;
  observationId: string;
  organisationId?: string | null;
  classification?: "PUBLIC" | "AUTHENTICATED";
};

export type AuthoriseUploadResult = {
  sessionId: string;
  assetId: string;
  completionNonce: string;
  grant: SignedUploadGrant;
  acceptedTypes: readonly string[];
  maxBytes: number;
  productionClaim: "none";
};

export async function authoriseUpload(
  input: AuthoriseUploadInput,
  deps: { store?: ObjectStore } = {},
): Promise<AuthoriseUploadResult> {
  assertObjectStorageEnabled();
  const policy = resolvePurposePolicy(input.purpose);
  const classification = input.classification ?? policy.classification;
  assertClassificationAllowedForPurpose(input.purpose, classification);
  assertMimeAndSize({
    purpose: input.purpose,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
  });

  if (input.organisationId) {
    throw new StoragePolicyError(
      "Organisation-scoped uploads are not available for this purpose",
    );
  }

  const observation = await prisma.accessObservationRecord.findUnique({
    where: { id: input.observationId },
    select: {
      id: true,
      placeId: true,
      observerUserId: true,
      sourceType: true,
      verificationStatus: true,
    },
  });
  if (!observation) {
    throw new StoragePolicyError("Observation not found", "OBSERVATION_NOT_FOUND");
  }
  if (observation.placeId !== input.placeId) {
    throw new StorageAuthorizationError("Observation does not belong to this place");
  }
  if (
    observation.observerUserId !== input.actor.id &&
    !isAdminRole(input.actor.primaryRole)
  ) {
    throw new StorageAuthorizationError(
      "Only the observation contributor can attach evidence",
    );
  }

  const assetId = newCuidLikeId();
  const objectKey = buildAccessEvidencePhotoKey({
    placeId: input.placeId,
    observationId: input.observationId,
    assetId,
    originalFilename: input.originalFilename,
    contentType: input.contentType,
  });
  const bucket = resolveBucketForPurpose(input.purpose);
  const store = deps.store ?? getObjectStore();
  const completionNonce = newNonce();
  const expiresAt = new Date(Date.now() + policy.signedUploadTtlSeconds * 1000);

  const asset = await prisma.storedAsset.create({
    data: {
      id: assetId,
      provider: store.provider,
      bucket,
      objectKey,
      originalFilename: sanitiseOriginalFilename(input.originalFilename),
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      accessClassification: classification,
      sourceType: observation.sourceType,
      createdById: input.actor.id,
      retentionClass: policy.retentionClass,
      status: "pending",
    },
  });

  const session = await prisma.storageUploadSession.create({
    data: {
      assetId: asset.id,
      purpose: input.purpose,
      objectKey,
      bucket,
      provider: store.provider,
      contentType: input.contentType,
      declaredSizeBytes: input.sizeBytes,
      accessClassification: classification,
      nonceHash: hashNonce(completionNonce),
      status: "pending",
      expiresAt,
      actorUserId: input.actor.id,
      placeId: input.placeId,
      observationId: input.observationId,
    },
  });

  const grant = await store.createSignedUpload({
    key: objectKey,
    bucket,
    contentType: input.contentType,
    expiresInSeconds: policy.signedUploadTtlSeconds,
    maxBytes: policy.maxBytes,
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: input.actor.primaryRole as never,
    action: STORAGE_AUDIT_ACTIONS.uploadAuthorised,
    entityType: "StoredAsset",
    entityId: asset.id,
    metadata: {
      purpose: input.purpose,
      provider: store.provider,
      sizeBytes: input.sizeBytes,
      contentType: input.contentType,
      observationId: input.observationId,
    },
  });

  incrementStorageMetric("uploads_requested", {
    purpose: input.purpose,
    provider: store.provider,
  });

  return {
    sessionId: session.id,
    assetId: asset.id,
    completionNonce,
    grant,
    acceptedTypes: policy.allowedMimeTypes,
    maxBytes: policy.maxBytes,
    productionClaim: "none",
  };
}

export type CompleteUploadInput = {
  actor: CurrentUser;
  sessionId: string;
  completionNonce: string;
  sha256?: string;
};

export async function completeUpload(
  input: CompleteUploadInput,
  deps: { store?: ObjectStore } = {},
) {
  assertObjectStorageEnabled();
  const session = await prisma.storageUploadSession.findUnique({
    where: { id: input.sessionId },
    include: { asset: true },
  });
  if (!session) {
    throw new ObjectNotFoundError();
  }
  if (session.actorUserId !== input.actor.id && !isAdminRole(input.actor.primaryRole)) {
    throw new StorageAuthorizationError();
  }
  if (session.status === "completed" || session.consumedAt) {
    throw new StorageReplayError();
  }
  if (session.status !== "pending") {
    throw new StorageReplayError("Upload session is not pending");
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.storageUploadSession.update({
      where: { id: session.id },
      data: { status: "expired" },
    });
    throw new StorageGrantExpiredError();
  }
  if (session.nonceHash !== hashNonce(input.completionNonce)) {
    throw new StorageAuthorizationError("Invalid completion nonce");
  }

  const store = deps.store ?? getObjectStore();
  const exists = await store.exists({
    key: session.objectKey,
    bucket: session.bucket,
  });
  if (!exists) {
    incrementStorageMetric("uploads_failed", {
      purpose: session.purpose,
      provider: store.provider,
      errorClass: "object_missing",
    });
    throw new ObjectNotFoundError();
  }

  const metadata = await store.getMetadata({
    key: session.objectKey,
    bucket: session.bucket,
  });
  if (metadata && metadata.sizeBytes > session.declaredSizeBytes) {
    incrementStorageMetric("uploads_failed", {
      purpose: session.purpose,
      provider: store.provider,
      errorClass: "size_mismatch",
    });
    throw new StoragePolicyError("Uploaded object exceeds authorised size");
  }

  const now = new Date();
  const asset = await prisma.$transaction(async (tx) => {
    await tx.storageUploadSession.update({
      where: { id: session.id },
      data: { status: "completed", consumedAt: now },
    });
    return tx.storedAsset.update({
      where: { id: session.assetId },
      data: {
        status: "ready",
        sizeBytes: metadata?.sizeBytes || session.declaredSizeBytes,
        contentType: metadata?.contentType || session.contentType,
        sha256: input.sha256 ?? undefined,
      },
    });
  });

  if (session.observationId) {
    await prisma.accessObservationEvidence.create({
      data: {
        observationId: session.observationId,
        assetId: asset.id,
        evidenceKind: "photo",
      },
    });
    await createAuditEvent({
      actorUserId: input.actor.id,
      actorRole: input.actor.primaryRole as never,
      action: STORAGE_AUDIT_ACTIONS.evidenceAttached,
      entityType: "AccessObservationRecord",
      entityId: session.observationId,
      metadata: { assetId: asset.id, evidenceKind: "photo" },
    });
    incrementStorageMetric("evidence_attached", {
      purpose: session.purpose,
      provider: store.provider,
    });
  }

  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: input.actor.primaryRole as never,
    action: STORAGE_AUDIT_ACTIONS.uploadCompleted,
    entityType: "StoredAsset",
    entityId: asset.id,
    metadata: {
      purpose: session.purpose,
      provider: store.provider,
      sizeBytes: asset.sizeBytes,
    },
  });

  incrementStorageMetric("uploads_completed", {
    purpose: session.purpose,
    provider: store.provider,
  });
  incrementStorageMetric("bytes_uploaded", {
    purpose: session.purpose,
    provider: store.provider,
  }, asset.sizeBytes);

  return {
    asset: toPublicAsset(asset),
    productionClaim: "none" as const,
  };
}

export function toPublicAsset(asset: {
  id: string;
  contentType: string;
  sizeBytes: number;
  accessClassification: string;
  status: string;
  createdAt: Date;
  originalFilename?: string;
}) {
  return {
    id: asset.id,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    accessClassification: asset.accessClassification,
    status: asset.status,
    createdAt: asset.createdAt.toISOString(),
  };
}

export async function getAssetForActor(
  assetId: string,
  actor: CurrentUser,
) {
  const asset = await prisma.storedAsset.findUnique({
    where: { id: assetId },
  });
  if (!asset || asset.deletedAt || asset.status === "deleted") {
    throw new ObjectNotFoundError();
  }
  assertCanReadAsset(actor, asset);
  return asset;
}

export function assertCanReadAsset(
  actor: CurrentUser,
  asset: {
    createdById: string;
    accessClassification: string;
    organisationId: string | null;
    status: string;
  },
): void {
  if (isAdminRole(actor.primaryRole)) return;
  if (asset.createdById === actor.id) return;
  if (asset.status !== "ready") {
    throw new StorageAuthorizationError();
  }
  if (
    asset.accessClassification === "PUBLIC" ||
    asset.accessClassification === "AUTHENTICATED"
  ) {
    return;
  }
  throw new StorageAuthorizationError();
}

export function assertCanDeleteAsset(
  actor: CurrentUser,
  asset: { createdById: string },
): void {
  if (isAdminRole(actor.primaryRole)) return;
  if (asset.createdById === actor.id) return;
  throw new StorageAuthorizationError();
}

export async function createAssetReadUrl(
  assetId: string,
  actor: CurrentUser,
  deps: { store?: ObjectStore } = {},
) {
  const asset = await getAssetForActor(assetId, actor);
  const policyTtl = getObjectStorageConfig().signedReadTtlSeconds;
  const store = deps.store ?? getObjectStore();
  const signed = await store.createSignedReadUrl({
    key: asset.objectKey,
    bucket: asset.bucket,
    expiresInSeconds: policyTtl,
  });
  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole as never,
    action: STORAGE_AUDIT_ACTIONS.readAuthorised,
    entityType: "StoredAsset",
    entityId: asset.id,
    metadata: { provider: store.provider },
  });
  incrementStorageMetric("signed_reads", { provider: store.provider });
  return {
    url: signed.url,
    expiresAt: signed.expiresAt.toISOString(),
    productionClaim: "none" as const,
  };
}

export async function deleteStoredAsset(
  assetId: string,
  actor: CurrentUser,
  deps: { store?: ObjectStore } = {},
) {
  const asset = await prisma.storedAsset.findUnique({
    where: { id: assetId },
  });
  if (!asset || asset.deletedAt) throw new ObjectNotFoundError();
  assertCanDeleteAsset(actor, asset);

  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole as never,
    action: STORAGE_AUDIT_ACTIONS.deleteRequested,
    entityType: "StoredAsset",
    entityId: asset.id,
  });

  const store = deps.store ?? getObjectStore();
  try {
    await store.remove({ key: asset.objectKey, bucket: asset.bucket });
  } catch {
    incrementStorageMetric("deletes_failed", { provider: store.provider });
    throw new StoragePolicyError("Object could not be deleted", "DELETE_FAILED");
  }

  await prisma.storedAsset.update({
    where: { id: asset.id },
    data: { status: "deleted", deletedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole as never,
    action: STORAGE_AUDIT_ACTIONS.objectDeleted,
    entityType: "StoredAsset",
    entityId: asset.id,
    metadata: { provider: store.provider },
  });

  return { deleted: true, productionClaim: "none" as const };
}

export async function reconcileOrphanedUploads(
  deps: { now?: Date } = {},
): Promise<{ orphaned: number; productionClaim: "none" }> {
  assertObjectStorageEnabled();
  const config = getObjectStorageConfig();
  const cutoff = new Date(
    (deps.now ?? new Date()).getTime() - config.orphanTtlHours * 60 * 60 * 1000,
  );
  const stale = await prisma.storageUploadSession.findMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
    },
    take: 100,
  });

  let orphaned = 0;
  for (const session of stale) {
    await prisma.storageUploadSession.update({
      where: { id: session.id },
      data: { status: "orphaned" },
    });
    orphaned += 1;
  }
  if (orphaned > 0) {
    incrementStorageMetric("orphaned_uploads", {}, orphaned);
  }
  return { orphaned, productionClaim: "none" };
}
