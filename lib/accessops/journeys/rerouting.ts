import type { ContinuitySignalKind } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

import type { JsonObject } from "../types";

export async function recordJourneyRerouteContinuitySignal(input: {
  journeyId: string;
  assetId: string;
  kind: Extract<
    ContinuitySignalKind,
    "reliability_incident" | "external_civic_feed"
  >;
  payload: JsonObject;
  observedAt: Date;
  participantId?: string | null;
}): Promise<string> {
  const signal = await recordContinuitySignal({
    kind: input.kind,
    participantId: input.participantId ?? null,
    sourceKind: "accessops_journey_reroute",
    sourceRef: input.journeyId,
    payload: input.payload,
    dedupeKey: `accessops:${input.journeyId}:${input.assetId}:${input.kind}`,
    observedAt: input.observedAt,
    confidence: "low",
  });
  return signal.id;
}
