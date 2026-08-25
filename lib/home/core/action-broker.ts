import { randomUUID } from "crypto";

import { mapableHomeFlags } from "@/lib/config/mapable-home";

import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
  HomeActionRequest,
} from "../contracts/action";
import type { AuthorityDecision } from "../contracts/authority";
import type { HomeCapabilityAdapter } from "../contracts/adapter";
import {
  evaluateHomeAuthority,
  refuseConfirmation,
  type AuthorityEvaluatorContext,
  type PendingConfirmation,
} from "./authority-evaluator";
import { requireHomeCapability } from "./capability-registry";

export type ActionBrokerResult =
  | {
      status: "EXECUTED";
      decision: Extract<AuthorityDecision, { outcome: "ALLOW" }>;
      action: AuthorizedHomeAction;
      receipt: HomeActionReceipt;
    }
  | {
      status: "REQUIRES_CONFIRMATION";
      decision: Extract<AuthorityDecision, { outcome: "REQUIRE_CONFIRMATION" }>;
      request: HomeActionRequest;
    }
  | {
      status: "DENIED";
      decision: Extract<AuthorityDecision, { outcome: "DENY" }>;
      request: HomeActionRequest;
    };

/**
 * Critical invariant: adapters only receive AuthorizedHomeAction.
 * HomeActionRequest never reaches adapter.execute().
 */
export class HomeActionBroker {
  private readonly pendingConfirmations = new Map<string, PendingConfirmation>();
  private readonly receipts: HomeActionReceipt[] = [];

  constructor(
    private readonly adapters: Map<string, HomeCapabilityAdapter>,
    private readonly resolveAdapterId: (endpointId: string) => string,
  ) {}

  getPendingConfirmations(): Map<string, PendingConfirmation> {
    return this.pendingConfirmations;
  }

  listReceipts(): HomeActionReceipt[] {
    return [...this.receipts];
  }

  refuse(token: string): void {
    refuseConfirmation(this.pendingConfirmations, token);
  }

  async proposeAndMaybeExecute(
    request: HomeActionRequest,
    authorityCtx: Omit<AuthorityEvaluatorContext, "pendingConfirmations">,
  ): Promise<ActionBrokerResult> {
    if (!mapableHomeFlags.enabled) {
      return {
        status: "DENIED",
        decision: {
          outcome: "DENY",
          basis: "MapAble Home is disabled.",
          code: "FEATURE_DISABLED",
        },
        request,
      };
    }

    const decision = evaluateHomeAuthority(request, {
      ...authorityCtx,
      pendingConfirmations: this.pendingConfirmations,
    });

    if (decision.outcome === "DENY") {
      return { status: "DENIED", decision, request };
    }

    if (decision.outcome === "REQUIRE_CONFIRMATION") {
      return { status: "REQUIRES_CONFIRMATION", decision, request };
    }

    return this.executeAuthorized(request, decision.basis);
  }

  async confirmAndExecute(
    request: HomeActionRequest,
    confirmationToken: string,
    authorityCtx: Omit<AuthorityEvaluatorContext, "pendingConfirmations">,
  ): Promise<ActionBrokerResult> {
    return this.proposeAndMaybeExecute(
      { ...request, confirmationToken },
      authorityCtx,
    );
  }

  /**
   * Builds AuthorizedHomeAction then calls adapter.execute.
   * Exposed for tests asserting requests never reach adapters.
   */
  async executeAuthorized(
    request: HomeActionRequest,
    authorityBasis: string,
  ): Promise<ActionBrokerResult> {
    const capability = requireHomeCapability(request.capabilityKind);
    const adapterId = this.resolveAdapterId(request.endpointId);
    const adapter = this.adapters.get(adapterId);

    if (!adapter) {
      return {
        status: "DENIED",
        decision: {
          outcome: "DENY",
          basis: `No adapter registered for ${adapterId}.`,
          code: "ADAPTER_DISABLED",
        },
        request,
      };
    }

    if (adapter.provider !== "SIMULATOR") {
      if (!mapableHomeFlags.realDeviceActionsEnabled) {
        return {
          status: "DENIED",
          decision: {
            outcome: "DENY",
            basis:
              "Real device actions are disabled. Only the simulator may execute in P0.",
            code: "REAL_DEVICE_ACTIONS_DISABLED",
          },
          request,
        };
      }
      return {
        status: "DENIED",
        decision: {
          outcome: "DENY",
          basis: "Non-simulator adapters cannot execute in P0.",
          code: "NOT_SUPPORTED",
        },
        request,
      };
    }

    if (!mapableHomeFlags.simulatorEnabled) {
      return {
        status: "DENIED",
        decision: {
          outcome: "DENY",
          basis: "Simulator adapter is disabled.",
          code: "ADAPTER_DISABLED",
        },
        request,
      };
    }

    const authorized: AuthorizedHomeAction = {
      id: randomUUID(),
      requestId: request.id,
      correlationId: request.correlationId,
      participantId: request.participantId,
      actorId: request.actorId,
      endpointId: request.endpointId,
      capabilityKind: request.capabilityKind,
      riskClass: capability.riskClass,
      parameters: request.parameters,
      authorityBasis,
      authorizedAt: new Date().toISOString(),
      adapterId,
    };

    const receipt = await adapter.execute(authorized);
    this.receipts.push(receipt);

    return {
      status: "EXECUTED",
      decision: {
        outcome: "ALLOW",
        basis: authorityBasis,
        autonomyLevel: capability.minimumAuthorityLevel,
      },
      action: authorized,
      receipt,
    };
  }
}
