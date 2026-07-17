import { runDoorToRoomPreflight } from "../journey/door-to-room-preflight";
import type { AccessQueryAst } from "../query/ast";
import type { AccessOutcomeRecord, AccessOutcomeState } from "./types";

const shadowOutcomes = new Map<string, AccessOutcomeRecord>();

/**
 * Record a synthetic outcome after preflight.
 * Default: participant_goal_not_yet_verified — a route found is not a journey completed.
 */
export function recordJourneyOutcome(input: {
  query: AccessQueryAst;
  requirementSetRef: string;
  outcomeState?: AccessOutcomeState;
}): AccessOutcomeRecord {
  const { preflight } = runDoorToRoomPreflight(input);
  const outcomeState = input.outcomeState ?? "participant_goal_not_yet_verified";

  const record: AccessOutcomeRecord = {
    outcomeId: `outcome:${preflight.preflightId}:${Date.now()}`,
    journeyRef: preflight.preflightId,
    queryId: preflight.queryId,
    destinationRef: preflight.destinationRef,
    preflightConclusion: preflight.overallConclusion,
    outcomeState,
    distinctions: {
      routeFound: preflight.segments.length > 0,
      requestCreated: false,
      serviceConfirmed: false,
      participantGoalAchieved: outcomeState === "participant_goal_achieved",
    },
    evidenceSummary:
      outcomeState === "participant_goal_achieved"
        ? "Participant confirmed goal achieved (synthetic)"
        : "Preflight completed; real-world goal not yet verified",
    limitations: [
      "A route found is not a journey completed",
      "A request created is not a service confirmed",
      "A service confirmed is not a participant outcome achieved",
      "Synthetic outcome store is in-memory only",
    ],
    recordedAt: new Date().toISOString(),
    operatingMode: "synthetic",
    productionClaim: "none",
  };

  shadowOutcomes.set(record.outcomeId, record);
  return record;
}

export function getOutcome(outcomeId: string): AccessOutcomeRecord | undefined {
  return shadowOutcomes.get(outcomeId);
}

export function listOutcomesForJourney(journeyRef: string): AccessOutcomeRecord[] {
  return [...shadowOutcomes.values()].filter((o) => o.journeyRef === journeyRef);
}

export function clearShadowOutcomes(): void {
  shadowOutcomes.clear();
}
