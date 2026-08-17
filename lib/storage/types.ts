export const STORAGE_ACCESS_CLASSIFICATIONS = [
  "PUBLIC",
  "AUTHENTICATED",
  "PARTICIPANT_CONTROLLED",
  "ORGANISATION_PRIVATE",
  "SENSITIVE",
  "SYSTEM_INTERNAL",
] as const;

export type StorageAccessClassification =
  (typeof STORAGE_ACCESS_CLASSIFICATIONS)[number];

export const STORAGE_PURPOSES = [
  "access_evidence_photo",
  "care_document",
] as const;

export type StoragePurpose = (typeof STORAGE_PURPOSES)[number];

export const STORAGE_RETENTION_CLASSES = [
  "standard",
  "evidence",
  "short_lived",
] as const;

export type StorageRetentionClass = (typeof STORAGE_RETENTION_CLASSES)[number];

export const OBJECT_KEY_NAMESPACES = {
  accessEvidence: "access-evidence",
  accreditation: "accreditation",
  vision: "vision",
  navigate: "navigate",
  observatory: "observatory",
  documents: "documents",
} as const;

export type ObjectStoreProviderName = "supabase" | "memory" | "s3";

/** Canonical stored object identity is provider + bucket + key, never a URL. */
export type StoredObject = {
  key: string;
  bucket: string;
  provider: ObjectStoreProviderName;
  sizeBytes: number;
  contentType: string;
  etag?: string;
  checksum?: string;
  createdAt: Date;
};

export type ObjectMetadata = {
  key: string;
  bucket: string;
  provider: ObjectStoreProviderName;
  sizeBytes: number;
  contentType: string;
  etag?: string;
  checksum?: string;
  lastModified?: Date;
};

export type ObjectKeyInput = {
  key: string;
  bucket: string;
};

export type PutObjectInput = ObjectKeyInput & {
  data: Uint8Array;
  contentType: string;
  cacheControl?: string;
};

export type GetObjectInput = ObjectKeyInput;

export type StoredObjectStream = {
  body: Uint8Array;
  metadata: ObjectMetadata;
};

export type RemoveObjectInput = ObjectKeyInput;

export type SignedReadInput = ObjectKeyInput & {
  expiresInSeconds: number;
};

export type SignedObjectUrl = {
  url: string;
  expiresAt: Date;
  key: string;
  bucket: string;
  provider: ObjectStoreProviderName;
};

export type SignedUploadInput = ObjectKeyInput & {
  contentType: string;
  expiresInSeconds: number;
  maxBytes?: number;
};

export type SignedUploadGrant = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
  key: string;
  bucket: string;
  provider: ObjectStoreProviderName;
  token?: string;
};
