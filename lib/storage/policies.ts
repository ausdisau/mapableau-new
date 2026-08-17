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
    default: {
      const exhaustive: never = purpose;
      throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
    }
  }
}

export function assertPurposeAllowed(purpose: StoragePurpose): void {
  if (purpose === "access_evidence_photo") return;
  const exhaustive: never = purpose;
  throw new StoragePolicyError(`Unsupported storage purpose: ${exhaustive}`);
}

export function assertClassificationAllowedForPurpose(
  purpose: StoragePurpose,
  classification: StorageAccessClassification,
): void {
  const policy = resolvePurposePolicy(purpose);
  if (classification === "PARTICIPANT_CONTROLLED") {
    throw new StoragePolicyError(
      "Participant-controlled storage is not available in this slice",
      "PARTICIPANT_CONTROLLED_DENIED",
    );
  }
  if (classification === "SENSITIVE" || classification === "SYSTEM_INTERNAL") {
    throw new StoragePolicyError(
      "Sensitive and system-internal classifications are not available in this slice",
    );
  }
  if (classification !== policy.classification && classification !== "PUBLIC") {
    throw new StoragePolicyError(
      `Classification ${classification} is not allowed for ${purpose}`,
    );
  }
}

export function assertMimeAndSize(input: {
  purpose: StoragePurpose;
  contentType: string;
  sizeBytes: number;
}): void {
  const policy = resolvePurposePolicy(input.purpose);
  if (!policy.allowedMimeTypes.includes(input.contentType)) {
    throw new StoragePolicyError(
      `File type not allowed. Accepted: JPEG, PNG, WebP`,
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
