/**
 * SDK interrupt/approval bridge.
 *
 * SDK approval ≠ participant consent ≠ business authority.
 * Paused RunState is stored server-side only (never returned to clients).
 * Prefer existing AgentRun / action-envelope stores; this module is an
 * encrypted in-memory/TTL cache keyed by opaque approval ids until a
 * dedicated schema is reviewed.
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

import type { MapAbleAgentsContext } from "./contracts";
import { assertNotPermanentlyProhibited } from "./policy";

const DEFAULT_TTL_MS = 15 * 60 * 1000;

export type PausedSdkApproval = {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  proposedAction: string;
  summary: string;
  expiresAt: number;
  /** Encrypted serialized RunState — never log or return raw. */
  encryptedRunState: string;
};

type ApprovalStore = Map<string, PausedSdkApproval>;

const globalStore = globalThis as typeof globalThis & {
  __mapableSdkApprovals?: ApprovalStore;
};

function store(): ApprovalStore {
  if (!globalStore.__mapableSdkApprovals) {
    globalStore.__mapableSdkApprovals = new Map();
  }
  return globalStore.__mapableSdkApprovals;
}

function encryptionKey(): Buffer {
  const raw =
    process.env.MAPABLE_SDK_APPROVAL_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "mapable-sdk-approval-dev-only-not-for-prod";
  return createHash("sha256").update(raw).digest();
}

export function encryptRunStatePayload(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptRunStatePayload(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function createPausedApproval(input: {
  context: MapAbleAgentsContext;
  proposedAction: string;
  summary: string;
  runStateJson: string;
  ttlMs?: number;
}): { approvalRecordId: string; summary: string; proposedAction: string } {
  assertNotPermanentlyProhibited(input.proposedAction);

  const id = `sdkapr_${randomBytes(16).toString("hex")}`;
  const record: PausedSdkApproval = {
    id,
    tenantId: input.context.tenantId,
    participantId: input.context.participantId,
    actorUserId: input.context.actorUserId,
    capabilityKey: input.context.capabilityKey,
    proposedAction: input.proposedAction,
    summary: input.summary.slice(0, 500),
    expiresAt: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
    encryptedRunState: encryptRunStatePayload(input.runStateJson),
  };
  store().set(id, record);

  return {
    approvalRecordId: id,
    summary: record.summary,
    proposedAction: record.proposedAction,
  };
}

export function getPausedApproval(input: {
  approvalRecordId: string;
  tenantId: string;
  participantId: string;
}): PausedSdkApproval | null {
  const record = store().get(input.approvalRecordId);
  if (!record) return null;
  if (record.tenantId !== input.tenantId) return null;
  if (record.participantId !== input.participantId) return null;
  if (Date.now() > record.expiresAt) {
    store().delete(input.approvalRecordId);
    return null;
  }
  return record;
}

export function consumePausedApproval(input: {
  approvalRecordId: string;
  tenantId: string;
  participantId: string;
  decision: "approve" | "reject";
}): {
  ok: boolean;
  reason?: string;
  runStateJson?: string;
  proposedAction?: string;
} {
  const record = getPausedApproval(input);
  if (!record) {
    return { ok: false, reason: "MAPABLE_SDK_APPROVAL_EXPIRED_OR_UNKNOWN" };
  }

  store().delete(input.approvalRecordId);

  if (input.decision === "reject") {
    return { ok: true, proposedAction: record.proposedAction };
  }

  assertNotPermanentlyProhibited(record.proposedAction);

  return {
    ok: true,
    proposedAction: record.proposedAction,
    runStateJson: decryptRunStatePayload(record.encryptedRunState),
  };
}

/** Test helper — clears the in-process store. */
export function __resetSdkApprovalStoreForTests(): void {
  store().clear();
}
