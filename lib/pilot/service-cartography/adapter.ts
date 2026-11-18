import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { serviceCartographyConfig } from "@/lib/config/service-cartography";
import {
  createDecisionAuditEvent,
  type ConsentGrant,
  type ConsentPurpose,
  type DecisionAuditEvent,
  type ServiceOffer,
} from "@mapable/service-cartography";

import {
  CARTOGRAPHY_GOAL_REF,
  CARTOGRAPHY_PARTICIPANT_ID,
  cloneOffers,
  syntheticGrant,
} from "./fixtures";
import type { CartographyAdapter, CartographyCallerContext } from "./types";

/** In-memory ring buffer for the synthetic pilot; never a durable ledger. */
export const MAX_ADVISORY_OUTCOME_LOG = 50;

const advisoryLog: DecisionAuditEvent[] = [];

function assertSyntheticPilot(): void {
  if (!serviceCartographyConfig.syntheticOnly) {
    throw new Error(
      "Service Cartography adapter refuses non-synthetic records in this release",
    );
  }
}

function assertServerContext(context: CartographyCallerContext): void {
  if (context.source !== "session" && context.source !== "synthetic_simulate") {
    const _never: never = context.source;
    throw new Error(`Unsupported cartography caller source: ${_never}`);
  }
}

export function readAdvisoryOutcomeLog(): readonly DecisionAuditEvent[] {
  return [...advisoryLog];
}

export function clearAdvisoryOutcomeLog(): void {
  advisoryLog.length = 0;
}

export function createSyntheticCartographyAdapter(): CartographyAdapter {
  return {
    async loadVerifiedOffersForGoal(
      goalRef: string,
      callerContext: CartographyCallerContext,
    ): Promise<ServiceOffer[]> {
      assertSyntheticPilot();
      assertServerContext(callerContext);
      if (goalRef !== CARTOGRAPHY_GOAL_REF) return [];
      return cloneOffers();
    },

    async loadPurposeBoundGrant(
      subjectRef: string,
      purpose: ConsentPurpose,
      callerContext: CartographyCallerContext,
    ): Promise<ConsentGrant[]> {
      assertSyntheticPilot();
      assertServerContext(callerContext);
      if (subjectRef !== CARTOGRAPHY_PARTICIPANT_ID) return [];
      return [syntheticGrant(purpose)];
    },

    async recordAdvisoryOutcome(
      event: DecisionAuditEvent,
      callerContext: CartographyCallerContext,
    ): Promise<void> {
      assertSyntheticPilot();
      assertServerContext(callerContext);
      const normalized = createDecisionAuditEvent(event);
      advisoryLog.push(normalized);
      if (advisoryLog.length > MAX_ADVISORY_OUTCOME_LOG) {
        advisoryLog.splice(0, advisoryLog.length - MAX_ADVISORY_OUTCOME_LOG);
      }
      if (!callerContext.actorUserId) return;
      await createAuditEvent({
        actorUserId: callerContext.actorUserId,
        organisationId: callerContext.organisationId,
        action: "service_cartography.advisory_recorded",
        entityType: "service_cartography_advisory",
        entityId: normalized.eventId,
        metadata: {
          algorithmId: normalized.algorithmId,
          algorithmVersion: normalized.algorithmVersion,
          outcome: normalized.outcome,
          reasonCodes: normalized.reasonCodes,
          synthetic: true,
        },
      });
    },
  };
}
