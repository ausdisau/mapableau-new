import { requireMission } from "../mission/store";
import { getLatestWorld, invalidateEdge } from "./composer";
import type { AuraJourneyWorld } from "./types";

export type PropagationResult = {
  previousWorldId: string;
  revisedWorld: AuraJourneyWorld;
  routeChanged: boolean;
  arrivalTimeChanged: boolean;
  supportConflictCreated: boolean;
  newBlockers: string[];
  newUnknowns: string[];
  summary: string;
  externalActionTaken: false;
};

export function propagateDependencyChange(input: {
  missionId: string;
  changeType: "lift_outage" | "transport_cancellation" | "curb_closure";
  sourceObservationIds: string[];
}): PropagationResult {
  const current = getLatestWorld(input.missionId);
  if (!current) throw new Error("AURA_WORLD_NOT_FOUND");

  const mission = requireMission(input.missionId);
  const previousWorldId = current.id;

  let revised: AuraJourneyWorld;
  const newBlockers: string[] = [];
  const newUnknowns: string[] = [];

  switch (input.changeType) {
    case "lift_outage":
      revised = invalidateEdge({
        missionId: input.missionId,
        edgeId: "e10",
        reason: "Western lift unavailable",
      });
      newBlockers.push("Western lift route segment unavailable");
      newUnknowns.push("No verified lift alternative");
      break;
    case "transport_cancellation":
      revised = invalidateEdge({
        missionId: input.missionId,
        edgeId: "e5",
        reason: "Transport trip cancelled",
      });
      newBlockers.push("Transport segment cancelled");
      break;
    case "curb_closure":
      revised = invalidateEdge({
        missionId: input.missionId,
        edgeId: "e8",
        reason: "Curb zone closed",
      });
      newBlockers.push("Curb zone unavailable");
      break;
    default: {
      const _exhaustive: never = input.changeType;
      throw new Error(`Unknown change: ${_exhaustive}`);
    }
  }

  return {
    previousWorldId,
    revisedWorld: revised,
    routeChanged: true,
    arrivalTimeChanged: input.changeType !== "curb_closure",
    supportConflictCreated: input.changeType === "transport_cancellation",
    newBlockers,
    newUnknowns,
    summary: `Plan superseded due to ${input.changeType}. Previous plan preserved.`,
    externalActionTaken: false,
  };
}
