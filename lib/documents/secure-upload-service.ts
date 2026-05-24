import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  validateUpload,
  MAX_UPLOAD_BYTES,
} from "@/lib/security/file-upload-policy";

export type SecureUploadInput = {
  name: string;
  type: string;
  size: number;
  actorUserId: string;
  entityType: string;
  entityId: string;
};

export async function validateSecureUpload(input: SecureUploadInput) {
  const validation = validateUpload({
    name: input.name,
    type: input.type,
    size: input.size,
  });

  if (!validation.ok) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "document.upload_rejected",
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { reason: validation.reason },
    });
    return validation;
  }

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "document.upload_validated",
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: {
      fileName: input.name,
      mime: input.type,
      virusScan: "not_configured",
    },
  });

  return {
    ok: true as const,
    maxBytes: MAX_UPLOAD_BYTES,
    storage: "private_bucket_placeholder",
    signedUrlRequired: true,
  };
}
