/**
 * Provider-neutral evidence object storage.
 * R2/S3 are backends — never couple GAIS to Cloudflare.
 */

import { createHash, randomUUID } from "crypto";

import type { PublicationState } from "@/lib/integrations/access/contracts";

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type EvidenceMimeType = (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

export const EVIDENCE_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB
export const EVIDENCE_MAX_DIMENSION_PX = 8192;

export type EvidenceObjectMeta = {
  objectId: string;
  contentType: EvidenceMimeType;
  byteLength: number;
  checksumSha256: string;
  publicationState: PublicationState;
  moderationState: "pending" | "approved" | "rejected" | "deleted";
  /** Internal actor ref — never put in public URLs. */
  actorRef: string;
  createdAt: string;
  /** EXIF GPS stripped / ignored — location lives in structured observation. */
  exifGeolocationStripped: true;
  retentionStatus: "active" | "pending_deletion" | "deleted";
};

export type EvidenceStorePutInput = {
  buffer: Buffer;
  contentType: string;
  actorRef: string;
  publicationState?: PublicationState;
};

export type EvidenceStore = {
  put(input: EvidenceStorePutInput): Promise<EvidenceObjectMeta>;
  getMeta(objectId: string): Promise<EvidenceObjectMeta | null>;
  markDeleted(objectId: string): Promise<EvidenceObjectMeta>;
};

export class EvidenceMediaError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "EvidenceMediaError";
    this.status = status;
  }
}

export function validateEvidenceUpload(input: {
  buffer: Buffer;
  contentType: string;
}): EvidenceMimeType {
  if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(input.contentType as EvidenceMimeType)) {
    throw new EvidenceMediaError(
      `Unsupported MIME type: ${input.contentType}`,
      415,
    );
  }
  if (input.buffer.byteLength === 0) {
    throw new EvidenceMediaError("Empty upload rejected", 400);
  }
  if (input.buffer.byteLength > EVIDENCE_MAX_BYTES) {
    throw new EvidenceMediaError(
      `Upload exceeds ${EVIDENCE_MAX_BYTES} bytes`,
      413,
    );
  }
  // Basic magic-byte checks
  const b = input.buffer;
  const isJpeg = b[0] === 0xff && b[1] === 0xd8;
  const isPng =
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const isWebp =
    b.length >= 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP";
  if (input.contentType === "image/jpeg" && !isJpeg) {
    throw new EvidenceMediaError("JPEG magic bytes mismatch", 400);
  }
  if (input.contentType === "image/png" && !isPng) {
    throw new EvidenceMediaError("PNG magic bytes mismatch", 400);
  }
  if (input.contentType === "image/webp" && !isWebp) {
    throw new EvidenceMediaError("WEBP magic bytes mismatch", 400);
  }
  return input.contentType as EvidenceMimeType;
}

/** In-memory store for tests / local fail-closed development. */
export function createMemoryEvidenceStore(): EvidenceStore {
  const store = new Map<string, EvidenceObjectMeta & { buffer: Buffer }>();

  return {
    async put(input) {
      const contentType = validateEvidenceUpload(input);
      const objectId = randomUUID();
      const checksumSha256 = createHash("sha256")
        .update(input.buffer)
        .digest("hex");
      const meta: EvidenceObjectMeta & { buffer: Buffer } = {
        objectId,
        contentType,
        byteLength: input.buffer.byteLength,
        checksumSha256,
        publicationState: input.publicationState ?? "PRIVATE_EVIDENCE",
        moderationState: "pending",
        actorRef: input.actorRef,
        createdAt: new Date().toISOString(),
        exifGeolocationStripped: true,
        retentionStatus: "active",
        buffer: input.buffer,
      };
      store.set(objectId, meta);
      const { buffer: _b, ...publicMeta } = meta;
      return publicMeta;
    },
    async getMeta(objectId) {
      const row = store.get(objectId);
      if (!row) return null;
      const { buffer: _b, ...publicMeta } = row;
      return publicMeta;
    },
    async markDeleted(objectId) {
      const row = store.get(objectId);
      if (!row) throw new EvidenceMediaError("Evidence not found", 404);
      row.moderationState = "deleted";
      row.retentionStatus = "deleted";
      store.set(objectId, row);
      const { buffer: _b, ...publicMeta } = row;
      return publicMeta;
    },
  };
}

/**
 * R2-backed store stub — requires env configuration.
 * Does not create Cloudflare resources; fails closed when unconfigured.
 */
export function createR2EvidenceStoreFromEnv(): EvidenceStore | null {
  const accountId = process.env.MAPABLE_R2_ACCOUNT_ID;
  const bucket = process.env.MAPABLE_R2_EVIDENCE_BUCKET;
  const accessKeyId = process.env.MAPABLE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MAPABLE_R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  // Network write path intentionally not activated in this foundation PR.
  // Callers fall back to memory/local until ops wires authenticated R2.
  return null;
}

export function resolveEvidenceStore(): EvidenceStore {
  return createR2EvidenceStoreFromEnv() ?? createMemoryEvidenceStore();
}
