import { randomUUID } from "crypto";

import { auraFlags } from "@/lib/aura/feature-flags";

/** Slim SensorThings observation ingest for Wave 7 Guardian. */

export type AuraAccessObservation = {
  id: string;
  sourceId: string;
  thingId: string;
  placeId: string;
  elementId?: string;
  observedProperty: string;
  value: boolean | number | string;
  phenomenonTime: string;
  receivedAt: string;
  quality: "good" | "degraded" | "invalid" | "unknown";
  sequenceNumber?: number;
  signatureValid?: boolean;
  staleAfter: string;
  expiresAt: string;
  sourceVersion: string;
  state: "current" | "stale" | "invalid" | "superseded";
};

const observations = new Map<string, AuraAccessObservation>();

export function resetSensorStore(): void {
  observations.clear();
}

export function ingestObservation(
  input: Omit<AuraAccessObservation, "id" | "state"> & {
    trustedSource?: boolean;
  },
): AuraAccessObservation | null {
  if (
    !auraFlags.sensorThingsEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("AURA_SENSORTHINGS_DISABLED");
  }
  // Reject forged / untrusted safety events.
  if (input.trustedSource !== true) {
    throw new Error("AURA_OBSERVATION_SOURCE_FORGED");
  }
  if (input.signatureValid === false) {
    throw new Error("AURA_OBSERVATION_SOURCE_FORGED");
  }
  if (input.quality === "invalid") {
    return null;
  }

  const existing = [...observations.values()].filter(
    (o) =>
      o.thingId === input.thingId &&
      o.observedProperty === input.observedProperty &&
      o.state === "current",
  );

  for (const prev of existing) {
    if (
      input.sequenceNumber !== undefined &&
      prev.sequenceNumber !== undefined &&
      input.sequenceNumber < prev.sequenceNumber
    ) {
      return null;
    }
    observations.set(prev.id, { ...prev, state: "superseded" });
  }

  const obs: AuraAccessObservation = {
    ...input,
    id: randomUUID(),
    state: "current",
  };
  observations.set(obs.id, obs);
  return obs;
}

export function listObservations(placeId?: string): AuraAccessObservation[] {
  const all = [...observations.values()];
  if (!placeId) return all;
  return all.filter((o) => o.placeId === placeId);
}
