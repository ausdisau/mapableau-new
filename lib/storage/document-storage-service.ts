import { logAuditEvent } from "@/lib/audit/audit-service";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { phase2Config } from "@/lib/config/phase2";
import {
  readDocumentFile,
  storeDocumentFile,
  validateUpload,
} from "@/lib/storage/documents";

export type StorageBackend = "local" | "s3" | "supabase";

export function getStorageBackend(): StorageBackend {
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
  if (phase2Config.documentStorageMode !== "local" && getStorageBackend() === "local") {
    // Phase 2 local mode
  }

  const stored = await storeDocumentFile(buffer, originalName);

  await logAuditEvent({
    actorUserId: context.uploadedById,
    action: "document:stored",
    domain: "documents",
    entityType: "document",
    entityId: stored.fileKey,
    participantId: context.participantId,
    organisationId: context.organisationId,
    riskLevel: "medium",
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

  await logDataAccess({
    actorUserId,
    entityType: "document",
    entityId: fileKey,
    sensitivityLevel: "restricted",
    accessReason: "Document read",
    result: "allowed",
  });

  await logAuditEvent({
    actorUserId,
    action: "document:read",
    domain: "documents",
    entityType: "document",
    entityId: fileKey,
    riskLevel: "high",
  });

  return buffer;
}

export { validateUpload };
