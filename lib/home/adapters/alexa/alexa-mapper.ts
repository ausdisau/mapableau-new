import type { HomeCapabilityKind } from "../../contracts/capability";
import type { HomeRoutineId } from "../../contracts/routine";

/**
 * Alexa is a human-interaction / voice adapter in P0 —
 * not a universal device registry.
 */
export type AlexaIntentProposal = {
  utterance: string;
  intentName: string;
  proposedCapabilityKind?: HomeCapabilityKind;
  proposedRoutineId?: HomeRoutineId;
  notes: string;
};

export const ALEXA_INTENT_FIXTURES: AlexaIntentProposal[] = [
  {
    utterance: "Alexa, ask MapAble if I'm ready to leave",
    intentName: "MapAble.EvaluateGoingOut",
    proposedRoutineId: "GOING_OUT",
    notes: "Voice becomes a typed routine evaluation request — still needs MapAble authority.",
  },
  {
    utterance: "Alexa, tell MapAble I'm going to bed",
    intentName: "MapAble.StartGoingToBed",
    proposedRoutineId: "GOING_TO_BED",
    proposedCapabilityKind: "START_ROUTINE",
    notes: "Proposes START_ROUTINE; never executes devices directly.",
  },
  {
    utterance: "Alexa, ask MapAble to turn on the hallway light",
    intentName: "MapAble.ProposeTurnOn",
    proposedCapabilityKind: "TURN_ON",
    notes: "Maps to HomeActionRequest proposal only.",
  },
];

export function mapAlexaIntentToProposal(
  intentName: string,
): AlexaIntentProposal | undefined {
  return ALEXA_INTENT_FIXTURES.find((f) => f.intentName === intentName);
}
