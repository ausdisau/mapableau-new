import { z } from "zod";

import { assertLease , listActiveLeases } from "../leases";
import {
  challengeMissionPlan,
  getMissionResponse,
  stopAuraMission,
} from "../mission/service";
import { requireMission } from "../mission/store";
import { listWitness } from "../witness";

/**
 * AURA tools — no Prisma client is passed or closed over.
 * Tools call application services / in-memory mission store only.
 */
export type AuraToolContext = {
  missionId: string;
  userId: string;
  abortSignal?: AbortSignal;
};

function assertNotStopped(missionId: string) {
  const m = requireMission(missionId);
  if (m.stopState || m.status === "stopped") {
    throw new Error("AURA_MISSION_STOPPED");
  }
  return m;
}

export function createAuraTools(ctx: AuraToolContext) {
  return {
    readMissionContext: {
      description: "Read current mission context (leased).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return getMissionResponse(ctx.missionId);
      },
    },
    readMissionGraph: {
      description: "Read mission dependency graph.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        const m = requireMission(ctx.missionId);
        return m.graph;
      },
    },
    listCapabilityLeases: {
      description: "List active capability leases for this mission.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listActiveLeases(ctx.missionId).map((l) => ({
          capabilityId: l.capabilityId,
          module: l.module,
          authority: l.authority,
          expiresAt: l.expiresAt,
          revokedAt: l.revokedAt,
        }));
      },
    },
    stopMission: {
      description: "Stop AURA for this mission (participant mandate).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.stop");
        return stopAuraMission(ctx.missionId, ctx.userId);
      },
    },
    verifyProofCarryingPlan: {
      description: "Return independent verifier result (cannot be overridden).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "plan.verify");
        const m = requireMission(ctx.missionId);
        return m.verifier;
      },
    },
    challengePlan: {
      description: "One bounded advisory self-challenge cycle.",
      inputSchema: z.object({}),
      execute: async () => {
        assertNotStopped(ctx.missionId);
        assertLease(ctx.missionId, "plan.challenge");
        return challengeMissionPlan(ctx.missionId);
      },
    },
    readAuditWitness: {
      description: "Read redacted witness/audit events for replay.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listWitness(ctx.missionId);
      },
    },
  };
}

/** Static guarantee for tests: tool factory source must not import the ORM client. */
export const AURA_TOOLS_NO_PRISMA = true;
