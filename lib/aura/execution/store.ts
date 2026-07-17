import { randomUUID } from "crypto";

import type {
  AuraActionExecution,
  AuraExecutionReceipt,
  AuraExecutionState,
} from "./types";

const executions = new Map<string, AuraActionExecution>();
const executionsByIdempotency = new Map<string, string>();
const receipts = new Map<string, AuraExecutionReceipt>();

const VALID_TRANSITIONS: Record<AuraExecutionState, AuraExecutionState[]> = {
  awaiting_execution_approval: ["approval_granted", "approval_declined", "approval_expired"],
  approval_granted: ["preflight_rechecking", "authorisation_failed"],
  approval_declined: [],
  approval_expired: [],
  preflight_rechecking: ["authorised", "authorisation_failed"],
  authorisation_failed: [],
  authorised: ["queued", "executing", "authorisation_failed"],
  queued: ["executing", "cancel_requested", "cancelled"],
  executing: ["service_receipt_received", "failed", "timed_out"],
  service_receipt_received: ["verifying_postconditions"],
  verifying_postconditions: [
    "succeeded",
    "partially_succeeded",
    "failed",
    "human_review_required",
  ],
  succeeded: [],
  partially_succeeded: ["compensation_proposed"],
  failed: ["compensation_proposed"],
  timed_out: [],
  cancel_requested: ["cancelled", "cancellation_failed"],
  cancelled: [],
  cancellation_failed: [],
  compensation_proposed: ["compensation_approved", "cancelled"],
  compensation_approved: ["compensating"],
  compensating: ["compensated", "compensation_failed"],
  compensated: [],
  compensation_failed: [],
  human_review_required: [],
};

export function resetExecutionStore(): void {
  executions.clear();
  executionsByIdempotency.clear();
  receipts.clear();
}

export function getExecution(id: string): AuraActionExecution | null {
  return executions.get(id) ?? null;
}

export function requireExecution(id: string): AuraActionExecution {
  const e = executions.get(id);
  if (!e) throw new Error("AURA_EXECUTION_NOT_FOUND");
  return e;
}

export function getExecutionByIdempotencyKey(
  key: string,
): AuraActionExecution | null {
  const id = executionsByIdempotency.get(key);
  if (!id) return null;
  return executions.get(id) ?? null;
}

export function listExecutionsForMission(missionId: string): AuraActionExecution[] {
  return [...executions.values()].filter((e) => e.missionId === missionId);
}

export function transitionExecution(
  id: string,
  next: AuraExecutionState,
  patch: Partial<AuraActionExecution> = {},
): AuraActionExecution {
  const current = requireExecution(id);
  const allowed = VALID_TRANSITIONS[current.state] ?? [];
  if (!allowed.includes(next) && current.state !== next) {
    throw new Error(`AURA_EXECUTION_INVALID_TRANSITION:${current.state}->${next}`);
  }
  const updated = { ...current, ...patch, state: next };
  executions.set(id, updated);
  return updated;
}

export function createExecutionRecord(input: {
  missionId: string;
  proposalId: string;
  proposalVersion: number;
  proposalHash: string;
  executionApprovalId: string;
  actionType: AuraActionExecution["actionType"];
  serviceId: string;
  serviceVersion: string;
  idempotencyKey: string;
  cancellationSupported: boolean;
  compensationSupported: boolean;
  auditCorrelationId: string;
}): AuraActionExecution {
  const existingId = executionsByIdempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = executions.get(existingId);
    if (existing) {
      if (existing.proposalHash !== input.proposalHash) {
        throw new Error("AURA_IDEMPOTENCY_HASH_CONFLICT");
      }
      return existing;
    }
  }

  const execution: AuraActionExecution = {
    id: randomUUID(),
    missionId: input.missionId,
    proposalId: input.proposalId,
    proposalVersion: input.proposalVersion,
    proposalHash: input.proposalHash,
    executionApprovalId: input.executionApprovalId,
    actionType: input.actionType,
    serviceId: input.serviceId,
    serviceVersion: input.serviceVersion,
    state: "authorised",
    idempotencyKey: input.idempotencyKey,
    outboxEventIds: [],
    recordsCreated: [],
    postconditions: [],
    realWorldOutcome: "not_observed",
    cancellationSupported: input.cancellationSupported,
    compensationSupported: input.compensationSupported,
    auditCorrelationId: input.auditCorrelationId,
    authorisedAt: new Date().toISOString(),
  };
  executions.set(execution.id, execution);
  executionsByIdempotency.set(input.idempotencyKey, execution.id);
  return execution;
}

export function saveExecutionReceipt(receipt: AuraExecutionReceipt): void {
  if (receipts.has(receipt.id)) {
    throw new Error("AURA_RECEIPT_IMMUTABLE");
  }
  receipts.set(receipt.id, Object.freeze({ ...receipt }) as AuraExecutionReceipt);
}

export function getExecutionReceipt(executionId: string): AuraExecutionReceipt | null {
  return (
    [...receipts.values()].find((r) => r.executionId === executionId) ?? null
  );
}

export function getExecutionReceiptById(id: string): AuraExecutionReceipt | null {
  return receipts.get(id) ?? null;
}

export function cancelQueuedExecutionsForMission(missionId: string): string[] {
  const cancelled: string[] = [];
  for (const [id, exec] of executions) {
    if (
      exec.missionId === missionId &&
      (exec.state === "queued" || exec.state === "authorised")
    ) {
      executions.set(id, {
        ...exec,
        state: "cancelled",
        cancelledAt: new Date().toISOString(),
      });
      cancelled.push(id);
    }
  }
  return cancelled;
}
