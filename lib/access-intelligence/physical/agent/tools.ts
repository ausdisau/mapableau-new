/**
 * Physical Systems agent tools — read + propose only.
 * The agent must never import adapters or call executeAuthorisedAction.
 */
import { tool } from "ai";
import { z } from "zod";

import { createDemoPassports } from "@/lib/access-intelligence/demo-data";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import type { ServerAccessContext } from "@/lib/access-intelligence/types";

import { getPhysicalConfigurationSnapshot } from "../configuration";
import { getScoutCandidates, listScoutFixtureIds } from "../scout/candidates";
import { planPhysicalVisit } from "../services/plan-visit";
import { proposePhysicalAction } from "../services/propose-action";
import { getHarbourPhysicalSimulator } from "../simulator/harbour-simulator";

export function createPhysicalSystemsTools(ctx: ServerAccessContext) {
  return {
    getPhysicalMode: tool({
      description:
        "Read Physical Systems operational mode and actuation gates. Read-only.",
      inputSchema: z.object({}),
      execute: async () => getPhysicalConfigurationSnapshot(),
    }),

    planHarbourVisit: tool({
      description:
        "Deterministically plan a fictional Harbour Civic Centre visit using fit and route engines. Read-only.",
      inputSchema: z.object({
        passportId: z.string().optional(),
        toNodeId: z.string().optional(),
        destinationLabel: z.string().optional(),
        visitAt: z.string().optional(),
      }),
      execute: async (input) => {
        const passports = createDemoPassports(ctx.userId);
        const passport =
          passports.find((p) => p.id === (input.passportId ?? ctx.selectedPassportId)) ??
          passports.find((p) => p.isDefault) ??
          passports[0]!;
        const result = planPhysicalVisit(passport, {
          toNodeId: input.toNodeId,
          destinationLabel: input.destinationLabel,
          visitAt: input.visitAt,
        });
        return {
          placeId: result.placeId,
          fitStatus: result.decision.status,
          routeId: result.route?.id ?? null,
          steps: result.route?.steps.map((s) => s.instruction) ?? [],
          unknowns: result.decision.unknowns,
          blockers: result.decision.blockers,
          capabilities: result.availableCapabilities.map((c) => ({
            id: c.id,
            label: c.label,
            enabled: c.enabled,
            risk: c.risk,
          })),
          fictionalNotice: result.fictionalNotice,
        };
      },
    }),

    readEnvironmentState: tool({
      description:
        "Read fictional Harbour device and emergency state from the simulator. Read-only.",
      inputSchema: z.object({}),
      execute: async () => {
        const state = getHarbourPhysicalSimulator().getState();
        return {
          placeId: HARBOUR_PLACE_ID,
          emergency: state.emergency,
          devices: state.devices.map((d) => ({
            deviceId: d.deviceId,
            label: d.label,
            health: d.health,
            condition: d.condition,
            online: d.online,
            fictional: d.fictional,
          })),
          mainLiftOutage: state.mainLiftOutage,
          doorEntBFault: state.doorEntBFault,
        };
      },
    }),

    listScoutFixtures: tool({
      description: "List simulated Scout perception fixtures. Read-only.",
      inputSchema: z.object({}),
      execute: async () => ({ fixtures: listScoutFixtureIds() }),
    }),

    inspectScoutFixture: tool({
      description:
        "Load simulated perception candidates for a Scout fixture. Candidates are provisional. Read-only.",
      inputSchema: z.object({ fixtureId: z.string().min(1) }),
      execute: async ({ fixtureId }) => ({
        fixtureId,
        candidates: getScoutCandidates(fixtureId),
      }),
    }),

    proposePhysicalAction: tool({
      description:
        "Propose a physical capability action. Creates an approval-gated execution; does not dispatch devices.",
      inputSchema: z.object({
        capabilityId: z.string().min(1),
        rationale: z.string().min(3).max(500),
      }),
      needsApproval: true,
      execute: async ({ capabilityId, rationale }) => {
        const execution = await proposePhysicalAction({
          placeId: HARBOUR_PLACE_ID,
          userId: ctx.userId,
          capabilityId,
          rationale,
        });
        return {
          executionId: execution.id,
          state: execution.state,
          capabilityId: execution.proposal.capabilityId,
          actionType: execution.proposal.actionType,
          proposalHash: execution.proposal.proposalHash,
          requireUserApproval: execution.proposal.requireUserApproval,
          requireVenueApproval: execution.proposal.requireVenueApproval,
          safetyReasons: execution.safetyReasons,
          fictionalNotice: execution.proposal.fictionalNotice,
          note: "Execution requires explicit approval and Action Gateway dispatch. Agent cannot call devices.",
        };
      },
    }),
  };
}
