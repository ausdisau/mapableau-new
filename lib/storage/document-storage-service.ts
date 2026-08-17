import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isDocumentObjectStoreEnabled,
  parseCloudStorageProvider,
} from "@/lib/config/object-storage";
import {
  readDocumentFile,
  storeDocumentFile,
  validateUpload,
} from "@/lib/storage/documents";

export type StorageBackend = "local" | "s3" | "supabase";

export function getStorageBackend(): StorageBackend {
  if (isDocumentObjectStoreEnabled()) {
    const provider = parseCloudStorageProvider(
      process.env.CLOUD_STORAGE_PROVIDER,
    );
    if (provider === "supabase" || provider === "s3") return provider;
  }
  const mode = process.env.DOCUMENT_STORAGE_BACKEND ?? "local";
  if (mode === "s3" || mode === "supabase") return mode;
  return "local";
}

export async function storePrivateDocument(
  buffer: Buffer,
  originalName: string,
  context: {
    uploadedById: string;
    participantId?: string;
    organisationId?: string;
    bucketHint?: string;
  }
) {
  const stored = await storeDocumentFile(buffer, originalName, {
    uploadedById: context.uploadedById,
    participantId: context.participantId,
    organisationId: context.organisationId,
  });

  await createAuditEvent({
    actorUserId: context.uploadedById,
    action: "document:stored",
    entityType: "document",
    entityId: stored.fileKey,
    participantId: context.participantId,
    organisationId: context.organisationId,
    metadata: {
      bucketHint: context.bucketHint ?? "private",
      fileSize: stored.fileSize,
      backend: getStorageBackend(),
    },
  });

  return stored;
}

export async function readPrivateDocument(
  fileKey: string,
  actorUserId: string,
  authorised: boolean
): Promise<Buffer> {
  if (!authorised) {
    throw new Error("Not authorised to read this document");
  }

  const buffer = await readDocumentFile(fileKey);

  await createAuditEvent({
    actorUserId,
    action: "document:read",
    entityType: "document",
    entityId: fileKey,
  });

  return buffer;
}

export { validateUpload };
