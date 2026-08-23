/**
 * Alexa intent → MapAble proposal path (account-linking-aware).
 *
 * Example: "Alexa, tell MapAble I\'m going to bed."
 * → START_ROUTINE / GOING_TO_BED proposal → authority → confirmation as required.
 * Never: Alexa → direct device control.
 */

import { mapableHomeFlags } from "@/lib/config/mapable-home";

import { AlexaIntentAdapter } from "./alexa-adapter";
import {
  mapAlexaIntentToProposal,
  type AlexaIntentProposal,
} from "./alexa-mapper";
import type { ValidatedAlexaIdentity } from "./types";

export type AlexaIntentAdaptation = {
  identity: ValidatedAlexaIdentity;
  mapAbleUserId: string;
  proposal: AlexaIntentProposal;
};

export function adaptAlexaIntentToProposal(input: {
  identity: ValidatedAlexaIdentity;
  mapAbleUserId: string;
  intentName: string;
}): AlexaIntentAdaptation | null {
  if (!mapableHomeFlags.alexaEnabled) return null;

  const proposal = mapAlexaIntentToProposal(input.intentName);
  if (!proposal) return null;

  const adapter = new AlexaIntentAdapter();
  if (!adapter.proposeFromIntent(input.intentName)) return null;

  return {
    identity: input.identity,
    mapAbleUserId: input.mapAbleUserId,
    proposal,
  };
}
