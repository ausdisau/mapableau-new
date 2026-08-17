import { InvalidObjectKeyError } from "./errors";
import { extensionFromFilename } from "./filename";
import { OBJECT_KEY_NAMESPACES } from "./types";

const OPAQUE_ID = /^[a-zA-Z0-9_-]{8,64}$/;
const ALLOWED_IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_DOCUMENT_EXT = new Set(["pdf", "png", "jpg", "jpeg", "txt"]);

const EMAIL_LIKE = /@/;
const PHONE_LIKE = /^\d{8,}$/;
const NDIS_LIKE = /^(ndis|ndia)/i;
const DIAGNOSIS_LIKE =
  /diagnos|autism|epilepsy|schizophren|dementia|diabetes/i;

function assertOpaqueId(value: string, label: string): string {
  const trimmed = value.trim();
  if (!OPAQUE_ID.test(trimmed)) {
    throw new InvalidObjectKeyError(`${label} must be an opaque identifier`);
  }
  rejectPiiSegment(trimmed, label);
  return trimmed;
}

function rejectPiiSegment(segment: string, label: string): void {
  if (
    EMAIL_LIKE.test(segment) ||
    PHONE_LIKE.test(segment) ||
    NDIS_LIKE.test(segment) ||
    DIAGNOSIS_LIKE.test(segment)
  ) {
    throw new InvalidObjectKeyError(
      `${label} must not contain personal information`,
    );
  }
}

function canonicalDocumentExt(
  originalFilename: string,
  contentType: string,
): string {
  const fromName = extensionFromFilename(originalFilename);
  if (fromName === "jpeg") return "jpg";
  if (ALLOWED_DOCUMENT_EXT.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "text/plain":
      return "txt";
    default:
      throw new InvalidObjectKeyError("Unsupported file extension");
  }
}

function canonicalExt(originalFilename: string, contentType: string): string {
  const fromName = extensionFromFilename(originalFilename);
  if (fromName === "jpeg") return "jpg";
  if (ALLOWED_IMAGE_EXT.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new InvalidObjectKeyError("Unsupported file extension");
  }
}

export function validateObjectKey(key: string): string {
  if (!key || typeof key !== "string") {
    throw new InvalidObjectKeyError("Object key is required");
  }
  if (key.startsWith("/") || key.includes("\\") || key.includes("\0")) {
    throw new InvalidObjectKeyError("Object key must be a relative path");
  }
  if (key.includes("..") || key.includes("%2e") || key.includes("%2E")) {
    throw new InvalidObjectKeyError("Object key must not contain path traversal");
  }
  const segments = key.split("/");
  if (segments.some((segment) => segment.length === 0)) {
    throw new InvalidObjectKeyError("Object key must not contain empty segments");
  }
  for (const segment of segments) {
    rejectPiiSegment(segment, "object key");
  }
  return key;
}

export function buildAccessEvidencePhotoKey(input: {
  placeId: string;
  observationId: string;
  assetId: string;
  originalFilename: string;
  contentType: string;
}): string {
  const placeId = assertOpaqueId(input.placeId, "placeId");
  const observationId = assertOpaqueId(input.observationId, "observationId");
  const assetId = assertOpaqueId(input.assetId, "assetId");
  const ext = canonicalExt(input.originalFilename, input.contentType);
  const key = [
    OBJECT_KEY_NAMESPACES.accessEvidence,
    "places",
    placeId,
    "observations",
    observationId,
    "original",
    `${assetId}.${ext}`,
  ].join("/");
  return validateObjectKey(key);
}

export function buildCareDocumentKey(input: {
  organisationId?: string | null;
  participantId?: string | null;
  assetId: string;
  originalFilename: string;
  contentType: string;
}): string {
  const assetId = assertOpaqueId(input.assetId, "assetId");
  const ext = canonicalDocumentExt(input.originalFilename, input.contentType);
  if (input.organisationId) {
    const organisationId = assertOpaqueId(
      input.organisationId,
      "organisationId",
    );
    return validateObjectKey(
      [
        OBJECT_KEY_NAMESPACES.documents,
        "organisations",
        organisationId,
        `${assetId}.${ext}`,
      ].join("/"),
    );
  }
  if (input.participantId) {
    const participantId = assertOpaqueId(input.participantId, "participantId");
    return validateObjectKey(
      [
        OBJECT_KEY_NAMESPACES.documents,
        "participants",
        participantId,
        `${assetId}.${ext}`,
      ].join("/"),
    );
  }
  throw new InvalidObjectKeyError(
    "Care document keys require organisationId or participantId",
  );
}

/** Documented namespaces for future writers — not implemented here. */
export const FUTURE_OBJECT_KEY_EXAMPLES = {
  accreditation: "accreditation/assessments/{assessmentId}/evidence/{criterionId}/{assetId}.{ext}",
  visionSource: "vision/source/{assetId}.{ext}",
  visionDerived: "vision/derived/{sourceAssetId}/{derivedAssetId}.json",
  navigate: "navigate/datasets/{datasetId}/{version}/...",
  observatory: "observatory/snapshots/{yyyy}/{mm}/...",
} as const;
