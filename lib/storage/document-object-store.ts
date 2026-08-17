import { createHash, randomBytes } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isDocumentObjectStoreEnabled } from "@/lib/config/object-storage";
import { prisma } from "@/lib/prisma";

import { STORAGE_AUDIT_ACTIONS } from "./audit-actions";
import {
  ObjectNotFoundError,
  StorageAuthorizationError,
  StorageNotEnabledError,
  StoragePolicyError,
} from "./errors";
import { getObjectStore } from "./factory";
import { sanitiseOriginalFilename } from "./filename";
import { buildCareDocumentKey } from "./key-builder";
import { sniffDocumentContentType } from "./magic-bytes";
import {
  assertMalwareScanAllowsStore,
  documentScanStatusFromMalware,
  getMalwareScanner,
} from "./malware-scanner";
import { incrementStorageMetric } from "./metrics";
import type { ObjectStore } from "./object-store";
import {
  assertClassificationAllowedForPurpose,
  assertMimeAndSize,
  resolveBucketForPurpose,
} from "./policies";
import type { StorageAccessClassification } from "./types";

export const OBJECT_STORE_DOCUMENT_FILE_PREFIX = "asset:";

export type StoreDocumentOwnerContext = {
  uploadedById: string;
  participantId?: string | null;
  organisationId?: string | null;
  /** When true, organisationId came from the client and membership is required. */
  organisationIdFromClient?: boolean;
  visibility?: string | null;
};

export type StoreCareDocumentInput = StoreDocumentOwnerContext & {
  buffer: Buffer;
  originalName: string;
};

export type StoredDocumentFile = {
  fileKey: string;
  mimeType: string;
  fileSize: number;
  storedAssetId?: string;
  scanStatus?: "not_configured" | "passed" | "failed";
};

function newAssetId(): string {
  return randomBytes(12).toString("hex");
}

function classificationForDocument(input: StoreCareDocumentInput): StorageAccessClassification {
  if (input.organisationId) return "ORGANISATION_PRIVATE";
  return "PARTICIPANT_CONTROLLED";
}

async function assertClientOrganisationMembership(
  userId: string,
  organisationId: string,
): Promise<void> {
  const member = await prisma.organisationMember.findFirst({
    where: { userId, organisationId },
    select: { id: true },
  });
  if (!member) {
    throw new StorageAuthorizationError(
      "Not a member of this organisation",
    );
  }
}

export async function storeCareDocumentOnObjectStore(
  input: StoreCareDocumentInput,
  deps: { store?: ObjectStore } = {},
): Promise<StoredDocumentFile> {
  if (!isDocumentObjectStoreEnabled()) {
    throw new StorageNotEnabledError();
  }
  if (!input.organisationId && !input.participantId) {
    throw new StoragePolicyError(
      "Care documents require a participant or organisation owner",
    );
  }
  if (input.organisationId && input.organisationIdFromClient) {
    await assertClientOrganisationMembership(
      input.uploadedById,
      input.organisationId,
    );
  }

  const sniffed = sniffDocumentContentType(input.buffer);
  if (!sniffed) {
    throw new StoragePolicyError(
      "File type not allowed. Accepted: PDF, PNG, JPEG, or text",
      "MIME_NOT_ALLOWED",
    );
  }
  assertMimeAndSize({
    purpose: "care_document",
    contentType: sniffed,
    sizeBytes: input.buffer.byteLength,
  });

  const classification = classificationForDocument(input);
  assertClassificationAllowedForPurpose("care_document", classification);

  const scan = await getMalwareScanner().scan({
    data: input.buffer,
    fileName: sanitiseOriginalFilename(input.originalName),
  });
  await assertMalwareScanAllowsStore(scan);
  const scanStatus = documentScanStatusFromMalware(scan);

  const assetId = newAssetId();
  const objectKey = buildCareDocumentKey({
    organisationId: input.organisationId,
    participantId: input.organisationId ? null : input.participantId,
    assetId,
    originalFilename: input.originalName,
    contentType: sniffed,
  });
  const bucket = resolveBucketForPurpose("care_document");
  const store = deps.store ?? getObjectStore();
  const sha256 = createHash("sha256").update(input.buffer).digest("hex");

  const stored = await store.put({
    key: objectKey,
    bucket,
    data: new Uint8Array(input.buffer),
    contentType: sniffed,
  });

  try {
    const asset = await prisma.storedAsset.create({
      data: {
        id: assetId,
        organisationId: input.organisationId ?? null,
        provider: stored.provider,
        bucket: stored.bucket,
        objectKey: stored.key,
        originalFilename: sanitiseOriginalFilename(input.originalName),
        contentType: sniffed,
        sizeBytes: stored.sizeBytes,
        sha256,
        accessClassification: classification,
        sourceType: "care_document",
        createdById: input.uploadedById,
        retentionClass: "standard",
        status: "ready",
      },
    });

    await createAuditEvent({
      actorUserId: input.uploadedById,
      action: STORAGE_AUDIT_ACTIONS.uploadCompleted,
      entityType: "StoredAsset",
      entityId: asset.id,
      organisationId: input.organisationId ?? undefined,
      participantId: input.participantId ?? undefined,
      metadata: {
        purpose: "care_document",
        provider: stored.provider,
        scanStatus,
      },
    });
    incrementStorageMetric("uploads_completed", {
      purpose: "care_document",
      provider: stored.provider,
    });
    incrementStorageMetric(
      "bytes_uploaded",
      { purpose: "care_document", provider: stored.provider },
      stored.sizeBytes,
    );

    return {
      fileKey: `${OBJECT_STORE_DOCUMENT_FILE_PREFIX}${asset.id}`,
      mimeType: sniffed,
      fileSize: stored.sizeBytes,
      storedAssetId: asset.id,
      scanStatus,
    };
  } catch (error) {
    try {
      await store.remove({ key: stored.key, bucket: stored.bucket });
    } catch {
      incrementStorageMetric("deletes_failed", {
        purpose: "care_document",
        provider: stored.provider,
      });
    }
    throw error;
  }
}

export async function readCareDocumentFromObjectStore(
  assetId: string,
  deps: { store?: ObjectStore } = {},
): Promise<Buffer> {
  if (!isDocumentObjectStoreEnabled() && process.env.MAPABLE_OBJECT_STORAGE_ENABLED !== "true") {
    throw new StorageNotEnabledError();
  }
  const asset = await prisma.storedAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      bucket: true,
      objectKey: true,
      status: true,
      sourceType: true,
    },
  });
  if (!asset || asset.status === "deleted" || asset.sourceType !== "care_document") {
    throw new ObjectNotFoundError();
  }
  const store = deps.store ?? getObjectStore();
  const result = await store.get({ key: asset.objectKey, bucket: asset.bucket });
  incrementStorageMetric("signed_reads", {
    purpose: "care_document",
    provider: result.metadata.provider,
  });
  return Buffer.from(result.body);
}

export async function deleteCareDocumentObject(
  assetId: string,
  actorUserId: string,
  deps: { store?: ObjectStore } = {},
): Promise<void> {
  const asset = await prisma.storedAsset.findUnique({
    where: { id: assetId },
  });
  if (!asset || asset.sourceType !== "care_document") return;
  await prisma.storedAsset.update({
    where: { id: assetId },
    data: { status: "deleted", deletedAt: new Date() },
  });
  try {
    const store = deps.store ?? getObjectStore();
    await store.remove({ key: asset.objectKey, bucket: asset.bucket });
    await createAuditEvent({
      actorUserId,
      action: STORAGE_AUDIT_ACTIONS.objectDeleted,
      entityType: "StoredAsset",
      entityId: assetId,
      metadata: { purpose: "care_document" },
    });
  } catch {
    incrementStorageMetric("deletes_failed", { purpose: "care_document" });
  }
}

export function parseObjectStoreDocumentAssetId(fileKey: string): string | null {
  if (!fileKey.startsWith(OBJECT_STORE_DOCUMENT_FILE_PREFIX)) return null;
  const id = fileKey.slice(OBJECT_STORE_DOCUMENT_FILE_PREFIX.length).trim();
  return id.length >= 8 ? id : null;
}
