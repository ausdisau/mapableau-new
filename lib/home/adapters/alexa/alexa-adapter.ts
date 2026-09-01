import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
  HomeActionRequest,
} from "../../contracts/action";
import type { HomeCapabilityAdapter } from "../../contracts/adapter";
import type { HomeEndpoint } from "../../contracts/environment";
import type { CapabilityState } from "../../contracts/state";
import { buildHomeActionReceipt } from "../../core/receipts";
import { normalizeCapabilityState } from "../../core/state-normalizer";
import { mapableHomeFlags } from "@/lib/config/mapable-home";
import {
  mapAlexaIntentToProposal,
  type AlexaIntentProposal,
} from "./alexa-mapper";

/**
 * Alexa intent adapter — proposes MapAble actions/routines.
 * Does not expose arbitrary third-party household device registries.
 */
export class AlexaIntentAdapter implements HomeCapabilityAdapter {
  readonly id = "adapter:alexa";
  readonly provider = "ALEXA" as const;
  readonly status = "SCAFFOLDED" as const;

  async discover(): Promise<HomeEndpoint[]> {
    // Not a device registry.
    return [];
  }

  async getState(
    endpointId: string,
    capabilityId: string,
  ): Promise<CapabilityState> {
    return normalizeCapabilityState({
      endpointId,
      capabilityId,
      value: null,
      confidence: "UNAVAILABLE",
      observedAt: null,
      explanation: "Alexa adapter does not provide device state in P0.",
    });
  }

  async execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt> {
    return buildHomeActionReceipt({
      action,
      result: "NOT_SUPPORTED",
      stateBefore: null,
      stateAfter: null,
      explanation:
        "Alexa does not execute device actions in P0. It may only propose MapAble requests.",
      undoAvailable: false,
    });
  }

  /**
   * Convert a voice intent into a typed proposal for MapAble authority.
   * Never bypasses authority evaluation.
   */
  proposeFromIntent(intentName: string): AlexaIntentProposal | null {
    if (!mapableHomeFlags.alexaEnabled) return null;
    return mapAlexaIntentToProposal(intentName) ?? null;
  }

  /**
   * Server-side interface placeholder for a future Custom Skill / MCS.
   */
  buildActionRequestFromProposal(
    proposal: AlexaIntentProposal,
    base: Pick<
      HomeActionRequest,
      "id" | "correlationId" | "participantId" | "actorId" | "endpointId" | "requestedAt"
    >,
  ): HomeActionRequest | null {
    if (!proposal.proposedCapabilityKind) return null;
    return {
      ...base,
      capabilityKind: proposal.proposedCapabilityKind,
      explanation: proposal.notes,
      vendorPermissionClaimed: false,
    };
  }
}
