import { getObjectStorageConfig } from "@/lib/config/object-storage";

import { StorageConfigurationError, StoragePolicyError } from "./errors";
import type {
  StorageAccessClassification,
  StoragePurpose,
  StorageRetentionClass,
} from "./types";

export const ACCESS_EVIDENCE_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CARE_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
] as const;

export type StoragePurposePolicy = {
  purpose: StoragePurpose;
  classification: StorageAccessClassification;
  allowedMimeTypes: readonly string[];
  maxBytes: number;
  retentionClass: StorageRetentionClass;
  signedUploadTtlSeconds: number;
  signedReadTtlSeconds: number;
};

export function resolvePurposePolicy(
  purpose: StoragePurpose,
  environment: NodeJS.ProcessEnv = process.env,
): StoragePurposePolicy {
  const config = getObjectStorageConfig(environment);
  switch (purpose) {
    case "access_evidence_photo":
      return {
        purpose,
        classification: "AUTHENTICATED",
        allowedMimeTypes: ACCESS_EVIDENCE_PHOTO_MIME_TYPES,
        maxBytes: config.evidenceMaxUploadMb * 1024 * 1024,
        retentionClass: "evidence",
        signedUploadTtlSeconds: config.signedUploadTtlSeconds,
        signedReadTtlSeconds: config.signedReadTtlSeconds,
      };
    case "care_document":
      return {
        purpose,
        classification: "PARTICIPANT_CONTROLLED",
        allowedMimeTypes: CARE_DOCUMENT_MIME_TYPES,
        maxBytes: config.evidenceMaxUploadMb * 1024 * 1024,
        retentionClass: "standard",
        signedUploadTtlSeconds: config.signedUploadTtlSeconds,
        signedReadTtlSeconds: config.signedReadTtlSeconds,
      };
    default: {
      const exhaustive: never = purpose;
      throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
    }
  }
}

export function assertPurposeAllowed(purpose: StoragePurpose): void {
  switch (purpose) {
    case "access_evidence_photo":
    case "care_document":
      return;
    default: {
      const exhaustive: never = purpose;
      throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
    }
  }
}

export function assertClassificationAllowedForPurpose(
  purpose: StoragePurpose,
  classification: StorageAccessClassification,
): void {
  switch (purpose) {
    case "access_evidence_photo": {
      if (classification === "PARTICIPANT_CONTROLLED") {
        throw new StoragePolicyError(
          "Participant-controlled storage is not available for access evidence",
          "PARTICIPANT_CONTROLLED_DENIED",
        );
      }
      if (
        classification === "ORGANISATION_PRIVATE" ||
        classification === "SENSITIVE" ||
        classification === "SYSTEM_INTERNAL"
      ) {
        throw new StoragePolicyError(
          `Classification ${classification} is not allowed for ${purpose}`,
        );
      }
      if (classification !== "AUTHENTICATED" && classification !== "PUBLIC") {
        throw new StoragePolicyError(
          `Classification ${classification} is not allowed for ${purpose}`,
        );
      }
      return;
    }
    case "care_document": {
      if (
        classification !== "PARTICIPANT_CONTROLLED" &&
        classification !== "ORGANISATION_PRIVATE"
      ) {
        throw new StoragePolicyError(
          `Classification ${classification} is not allowed for care documents`,
        );
      }
      return;
    }
    default: {
      const exhaustive: never = purpose;
      throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
    }
  }
}

export function assertMimeAndSize(input: {
  purpose: StoragePurpose;
  contentType: string;
  sizeBytes: number;
}): void {
  const policy = resolvePurposePolicy(input.purpose);
  if (!policy.allowedMimeTypes.includes(input.contentType)) {
    const accepted =
      input.purpose === "care_document"
        ? "PDF, PNG, JPEG, or text"
        : "JPEG, PNG, WebP";
    throw new StoragePolicyError(
      `File type not allowed. Accepted: ${accepted}`,
      "MIME_NOT_ALLOWED",
    );
  }
  if (input.sizeBytes <= 0) {
    throw new StoragePolicyError("File size must be greater than zero");
  }
  if (input.sizeBytes > policy.maxBytes) {
    throw new StoragePolicyError(
      `File must be under ${Math.floor(policy.maxBytes / (1024 * 1024))} MB`,
      "FILE_TOO_LARGE",
    );
  }
}

export function resolveBucketForPurpose(
  purpose: StoragePurpose,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const config = getObjectStorageConfig(environment);
  switch (purpose) {
    case "access_evidence_photo": {
      const bucket =
        config.evidenceBucket ??
        config.privateBucket ??
        config.legacySupabaseBucket;
      if (!bucket) {
        throw new StorageConfigurationError(
          "MAPABLE_STORAGE_EVIDENCE_BUCKET or MAPABLE_STORAGE_PRIVATE_BUCKET is required",
        );
      }
      return bucket;
    }
    case "care_document": {
      const bucket = config.privateBucket ?? config.legacySupabaseBucket;
      if (!bucket) {
        throw new StorageConfigurationError(
          "MAPABLE_STORAGE_PRIVATE_BUCKET is required for care documents",
        );
      }
      return bucket;
    }
    default: {
      const exhaustive: never = purpose;
      throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
    }
  }
}

export function formatAcceptedTypes(purpose: StoragePurpose): string {
  const policy = resolvePurposePolicy(purpose);
  return policy.allowedMimeTypes.join(", ");
}
