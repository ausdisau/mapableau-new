import { createHash } from "node:crypto";

import type {
  KernelAuditEvent,
  KernelAuditVerification,
  KernelPhase,
} from "@/lib/care-intelligence/kernel/types";

export const GENESIS_AUDIT_HASH = "0".repeat(64);

export function appendKernelAuditEvent(params: {
  events: KernelAuditEvent[];
  baseTime: Date;
  phase: KernelPhase;
  kind: KernelAuditEvent["kind"];
  summary: string;
}) {
  const sequence = params.events.length + 1;
  const previousHash = params.events.at(-1)?.hash ?? GENESIS_AUDIT_HASH;
  const occurredAt = new Date(
    params.baseTime.getTime() + sequence,
  ).toISOString();
  const hash = hashAuditFields({
    sequence,
    occurredAt,
    phase: params.phase,
    kind: params.kind,
    summary: params.summary,
    previousHash,
  });
  params.events.push({
    sequence,
    occurredAt,
    phase: params.phase,
    kind: params.kind,
    summary: params.summary,
    previousHash,
    hash,
  });
}

export function verifyKernelAudit(
  events: readonly KernelAuditEvent[],
): KernelAuditVerification {
  let previousHash = GENESIS_AUDIT_HASH;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const sequence = index + 1;
    if (event.sequence !== sequence)
      return invalid(sequence, events.length, "AUDIT_SEQUENCE_INVALID");
    if (event.previousHash !== previousHash)
      return invalid(sequence, events.length, "AUDIT_PREVIOUS_HASH_INVALID");
    const expectedHash = hashAuditFields({
      sequence: event.sequence,
      occurredAt: event.occurredAt,
      phase: event.phase,
      kind: event.kind,
      summary: event.summary,
      previousHash: event.previousHash,
    });
    if (event.hash !== expectedHash)
      return invalid(sequence, events.length, "AUDIT_HASH_INVALID");
    previousHash = event.hash;
  }
  return {
    valid: events.length > 0,
    eventsChecked: events.length,
    firstInvalidSequence: null,
    reason: events.length > 0 ? "AUDIT_CHAIN_VALID" : "AUDIT_CHAIN_EMPTY",
  };
}

function hashAuditFields(fields: Omit<KernelAuditEvent, "hash">) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        fields.sequence,
        fields.occurredAt,
        fields.phase,
        fields.kind,
        fields.summary,
        fields.previousHash,
      ]),
    )
    .digest("hex");
}

function invalid(
  sequence: number,
  eventsChecked: number,
  reason: string,
): KernelAuditVerification {
  return {
    valid: false,
    eventsChecked,
    firstInvalidSequence: sequence,
    reason,
  };
}
