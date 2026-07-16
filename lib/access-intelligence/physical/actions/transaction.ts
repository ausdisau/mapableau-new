import { randomUUID } from "node:crypto";

import { getAdapterForCapability } from "../adapters/registry";
import { listHarbourCapabilities } from "../capabilities/harbour";
import { getPhysicalMode, isShadowOnly } from "../configuration";
import {
  PhysicalSystemsError,
  type PhysicalSystemsErrorCode,
} from "../errors";
import { recordMetric } from "../observability";
import { evaluateSafety } from "../safety/kernel";
import type {
  ApprovalRecord,
  DeviceCapability,
  DeviceState,
  EmergencyModeState,
  PhysicalActionExecution,
  PhysicalActionProposal,
} from "../schemas";
import { createPhysicalActionProposal } from "./proposal";
import { transitionAction } from "./state-machine";

function asErrorCode(code: string | undefined): PhysicalSystemsErrorCode {
  return (code as PhysicalSystemsErrorCode | undefined) ?? "UNSAFE_STATE";
}

export type PhysicalActionStore = {
  save(execution: PhysicalActionExecution): Promise<void>;
  get(id: string): Promise<PhysicalActionExecution | null>;
  list(filter?: { userId?: string; placeId?: string }): Promise<
    PhysicalActionExecution[]
  >;
};

class InMemoryPhysicalActionStore implements PhysicalActionStore {
  private readonly map = new Map<string, PhysicalActionExecution>();

  async save(execution: PhysicalActionExecution): Promise<void> {
    this.map.set(execution.id, structuredClone(execution));
  }

  async get(id: string): Promise<PhysicalActionExecution | null> {
    const found = this.map.get(id);
    return found ? structuredClone(found) : null;
  }

  async list(filter?: {
    userId?: string;
    placeId?: string;
  }): Promise<PhysicalActionExecution[]> {
    let items = [...this.map.values()];
    if (filter?.userId) {
      items = items.filter((e) => e.proposal.userId === filter.userId);
    }
    if (filter?.placeId) {
      items = items.filter((e) => e.proposal.placeId === filter.placeId);
    }
    return items.map((e) => structuredClone(e));
  }

  clear(): void {
    this.map.clear();
  }
}

export type TransactionContext = {
  getDevice: (deviceId: string) => DeviceState;
  getEmergency: () => EmergencyModeState;
  getCapability?: (capabilityId: string) => DeviceCapability | undefined;
  /** Demo: advance simulator immediately instead of wall-clock timeout. */
  onSimulatorTick?: (executionId: string, capabilityId: string) => void;
};

export class PhysicalActionTransactionManager {
  private readonly store: PhysicalActionStore;
  private readonly locks = new Map<string, string>();
  private readonly ctx: TransactionContext;

  constructor(ctx: TransactionContext, store?: PhysicalActionStore) {
    this.ctx = ctx;
    this.store = store ?? new InMemoryPhysicalActionStore();
  }

  async propose(input: {
    placeId: string;
    userId: string;
    capabilityId: string;
    rationale: string;
    parameters?: Record<string, unknown>;
  }): Promise<PhysicalActionExecution> {
    const capability =
      this.ctx.getCapability?.(input.capabilityId) ??
      listHarbourCapabilities().find((c) => c.id === input.capabilityId);

    if (!capability) {
      throw new PhysicalSystemsError(
        "CAPABILITY_NOT_FOUND",
        `Unknown capability ${input.capabilityId}.`,
      );
    }

    const device = this.ctx.getDevice(capability.deviceId);
    const emergency = this.ctx.getEmergency();
    const proposal = createPhysicalActionProposal({
      placeId: input.placeId,
      userId: input.userId,
      capability,
      rationale: input.rationale,
      parameters: input.parameters,
    });

    const safety = evaluateSafety({
      proposal,
      capability,
      device,
      emergency,
      forProposal: true,
    });
    if (!safety.allowed) {
      recordMetric("physical_safety_deny", {
        code: safety.code ?? "UNSAFE_STATE",
      });
      throw new PhysicalSystemsError(
        asErrorCode(safety.code),
        safety.reasons.join(" "),
        undefined,
        { reasons: safety.reasons },
      );
    }

    const state = proposal.requireUserApproval
      ? ("awaiting_user_approval" as const)
      : proposal.requireVenueApproval
        ? ("awaiting_venue_approval" as const)
        : ("approved" as const);

    const now = new Date().toISOString();
    const execution: PhysicalActionExecution = {
      id: `exec-${randomUUID()}`,
      proposal,
      state,
      approvals: [],
      createdAt: now,
      updatedAt: now,
      postconditionResults: [],
      safetyReasons: safety.reasons,
    };

    await this.store.save(execution);
    recordMetric("physical_action_proposed", {
      capabilityId: capability.id,
      mode: getPhysicalMode(),
    });
    return execution;
  }

  async approve(
    executionId: string,
    actorId: string,
    note?: string,
  ): Promise<PhysicalActionExecution> {
    const execution = await this.requireExecution(executionId);
    const approval: ApprovalRecord = {
      id: `apr-${randomUUID()}`,
      kind: "user",
      actorId,
      approvedAt: new Date().toISOString(),
      note,
    };
    const withApproval: PhysicalActionExecution = {
      ...execution,
      approvals: [...execution.approvals, approval],
    };
    const next = transitionAction(withApproval, { type: "user_approved" });
    await this.store.save(next);
    recordMetric("physical_action_user_approved", {
      capabilityId: next.proposal.capabilityId,
    });
    return next;
  }

  async venueApprove(
    executionId: string,
    actorId: string,
    note?: string,
  ): Promise<PhysicalActionExecution> {
    const execution = await this.requireExecution(executionId);
    const approval: ApprovalRecord = {
      id: `apr-${randomUUID()}`,
      kind: "venue",
      actorId,
      approvedAt: new Date().toISOString(),
      note,
    };
    const withApproval: PhysicalActionExecution = {
      ...execution,
      approvals: [...execution.approvals, approval],
    };
    const next = transitionAction(withApproval, { type: "venue_approved" });
    await this.store.save(next);
    recordMetric("physical_action_venue_approved", {
      capabilityId: next.proposal.capabilityId,
    });
    return next;
  }

  async execute(executionId: string): Promise<PhysicalActionExecution> {
    if (isShadowOnly() && getPhysicalMode() === "shadow") {
      throw new PhysicalSystemsError(
        "SHADOW_ONLY",
        "Cannot execute physical actions in shadow-only mode.",
      );
    }

    let execution = await this.requireExecution(executionId);
    if (execution.state !== "approved") {
      throw new PhysicalSystemsError(
        "INVALID_TRANSITION",
        `Execution must be approved before execute (current: ${execution.state}).`,
      );
    }

    const capability =
      this.ctx.getCapability?.(execution.proposal.capabilityId) ??
      listHarbourCapabilities().find(
        (c) => c.id === execution.proposal.capabilityId,
      );
    if (!capability) {
      throw new PhysicalSystemsError(
        "CAPABILITY_NOT_FOUND",
        `Capability ${execution.proposal.capabilityId} not found at execute time.`,
      );
    }

    const deviceId = execution.proposal.deviceId;
    if (this.locks.has(deviceId)) {
      throw new PhysicalSystemsError(
        "LOCK_CONTENTION",
        `Device ${deviceId} is locked by ${this.locks.get(deviceId)}.`,
      );
    }
    this.locks.set(deviceId, execution.id);

    try {
      const device = this.ctx.getDevice(deviceId);
      const emergency = this.ctx.getEmergency();
      const safety = evaluateSafety({
        proposal: execution.proposal,
        capability,
        device,
        emergency,
        approvals: execution.approvals,
        // We hold the lock; only treat as contention if another execution owns it.
        deviceLockedBy: this.locks.get(deviceId) === execution.id ? null : this.locks.get(deviceId),
      });
      if (!safety.allowed) {
        recordMetric("physical_safety_deny", {
          code: safety.code ?? "UNSAFE_STATE",
        });
        execution = transitionAction(execution, {
          type: "fail",
          code: safety.code,
          message: safety.reasons.join(" "),
        });
        execution.safetyReasons = safety.reasons;
        await this.store.save(execution);
        throw new PhysicalSystemsError(
          asErrorCode(safety.code),
          safety.reasons.join(" "),
        );
      }

      execution = transitionAction(execution, { type: "start_execute" });
      await this.store.save(execution);
      recordMetric("physical_action_execute_start", {
        capabilityId: capability.id,
      });

      const adapter = getAdapterForCapability(capability.id);
      const result = await adapter.executeCapability({
        capabilityId: capability.id,
        deviceId,
        actionType: execution.proposal.actionType,
        parameters: execution.proposal.parameters,
        executionId: execution.id,
        simulated: true,
      });

      if (!result.accepted) {
        execution = transitionAction(execution, {
          type: "fail",
          code: "ADAPTER_ERROR",
          message: result.message,
        });
        execution.adapterAck = result.ack;
        await this.store.save(execution);
        recordMetric("physical_action_failed", { reason: "adapter" });
        throw new PhysicalSystemsError("ADAPTER_ERROR", result.message);
      }

      execution = {
        ...execution,
        adapterAck: result.ack,
      };
      execution = transitionAction(execution, { type: "start_verify" });
      await this.store.save(execution);

      // Demo / simulator: immediate tick instead of wall-clock setTimeout
      this.ctx.onSimulatorTick?.(execution.id, capability.id);

      const postconditionResults = verifyPostconditions(
        capability,
        this.ctx.getDevice(deviceId),
        result.postconditionHints ?? [],
      );
      execution = {
        ...execution,
        postconditionResults,
      };

      const failed = postconditionResults.filter((p) => !p.passed);
      if (failed.length > 0) {
        // Simulate timeout path when cabin never arrives
        if (failed.some((f) => f.check.includes("cabin"))) {
          execution = transitionAction(execution, { type: "timeout" });
          await this.store.save(execution);
          recordMetric("physical_action_timeout", {
            capabilityId: capability.id,
          });
          throw new PhysicalSystemsError(
            "TIMEOUT",
            "Postcondition verification timed out (simulated).",
          );
        }
        execution = transitionAction(execution, {
          type: "fail",
          code: "POSTCONDITION_FAILED",
          message: failed.map((f) => f.check).join(", "),
        });
        await this.store.save(execution);
        recordMetric("physical_action_failed", { reason: "postcondition" });
        throw new PhysicalSystemsError(
          "POSTCONDITION_FAILED",
          `Postconditions failed: ${failed.map((f) => f.check).join(", ")}`,
        );
      }

      execution = transitionAction(execution, { type: "succeed" });
      await this.store.save(execution);
      recordMetric("physical_action_succeeded", {
        capabilityId: capability.id,
      });
      return execution;
    } finally {
      this.locks.delete(deviceId);
    }
  }

  async cancel(
    executionId: string,
    reason?: string,
  ): Promise<PhysicalActionExecution> {
    const execution = await this.requireExecution(executionId);
    const next = transitionAction(execution, { type: "cancel" });
    if (reason) next.errorMessage = reason;
    await this.store.save(next);
    this.locks.delete(execution.proposal.deviceId);
    recordMetric("physical_action_cancelled", {
      capabilityId: execution.proposal.capabilityId,
    });
    return next;
  }

  async getExecution(
    executionId: string,
  ): Promise<PhysicalActionExecution | null> {
    return this.store.get(executionId);
  }

  async listExecutions(filter?: {
    userId?: string;
    placeId?: string;
  }): Promise<PhysicalActionExecution[]> {
    return this.store.list(filter);
  }

  /** Test helper */
  clearLocks(): void {
    this.locks.clear();
  }

  private async requireExecution(
    executionId: string,
  ): Promise<PhysicalActionExecution> {
    const execution = await this.store.get(executionId);
    if (!execution) {
      throw new PhysicalSystemsError(
        "ACTION_NOT_FOUND",
        `Physical action execution ${executionId} not found.`,
      );
    }
    return execution;
  }
}

function verifyPostconditions(
  capability: DeviceCapability,
  device: DeviceState,
  hints: string[],
): PhysicalActionExecution["postconditionResults"] {
  return capability.postconditions.map((check) => {
    const fromHint = hints.includes(check);
    const meta = device.metadata ?? {};
    let passed = fromHint;
    if (check === "cabin_called") {
      passed = fromHint || meta["cabin"] === "called" || meta["cabin"] === "arrived";
    }
    if (check === "door_open_pulse") {
      passed = fromHint || meta["open"] === true;
    }
    if (check === "assistance_queued") {
      passed = fromHint || typeof meta["lastTicket"] === "string";
    }
    if (check === "robot_dispatched_sim") {
      passed = fromHint || meta["status"] === "dispatched_sim";
    }
    if (check.startsWith("enable_")) {
      passed = fromHint || Boolean(meta[checkToMetaKey(check)]);
    }
    return {
      check,
      passed,
      detail: passed ? "ok" : "not observed",
    };
  });
}

function checkToMetaKey(check: string): string {
  switch (check) {
    case "enable_captions":
      return "captions";
    case "enable_large_print":
      return "largePrint";
    case "enable_visual_wayfinding":
      return "visualWayfinding";
    case "enable_low_glare":
      return "lowGlare";
    default:
      return check;
  }
}

export type { PhysicalActionProposal };
