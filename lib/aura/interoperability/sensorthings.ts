import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AuraAccessObservation = {
  id: string;
  sourceId: string;
  thingId: string;
  sensorId?: string;
  datastreamId?: string;
  placeId: string;
  elementId?: string;
  observedProperty: string;
  value: boolean | number | string;
  unit?: string;
  phenomenonTime: string;
  resultTime?: string;
  receivedAt: string;
  quality: "good" | "degraded" | "invalid" | "unknown";
  sequenceNumber?: number;
  signatureValid?: boolean;
  staleAfter: string;
  expiresAt: string;
  sourceVersion: string;
  state: "current" | "stale" | "invalid" | "superseded";
};

export type AuraDerivedAccessState = {
  id: string;
  placeId: string;
  elementId: string;
  property: string;
  value: boolean | "unknown" | "conflict";
  observationIds: string[];
  derivationRule: string;
  confidence: number;
  generatedAt: string;
  expiresAt: string;
};

const observations = new Map<string, AuraAccessObservation>();
const derived = new Map<string, AuraDerivedAccessState>();

export function resetSensorStore(): void {
  observations.clear();
  derived.clear();
}

export function ingestObservation(input: Omit<AuraAccessObservation, "id" | "state"> & {
  trustedSource?: boolean;
}): AuraAccessObservation | null {
  if (!auraFlags.sensorThingsEnabled && process.env.NODE_ENV !== "test") {
    throw new Error("AURA_SENSORTHINGS_DISABLED");
  }
  if (input.trustedSource === false) {
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
  deriveState(obs);
  return obs;
}

function deriveState(obs: AuraAccessObservation): void {
  const key = `${obs.placeId}:${obs.elementId}:${obs.observedProperty}`;
  const contradictory = [...observations.values()].filter(
    (o) =>
      o.placeId === obs.placeId &&
      o.elementId === obs.elementId &&
      o.observedProperty === obs.observedProperty &&
      o.state === "current" &&
      o.id !== obs.id &&
      o.value !== obs.value,
  );

  if (contradictory.length) {
    derived.set(key, {
      id: randomUUID(),
      placeId: obs.placeId,
      elementId: obs.elementId ?? "",
      property: obs.observedProperty,
      value: "conflict",
      observationIds: [obs.id, ...contradictory.map((c) => c.id)],
      derivationRule: "contradictory_observations",
      confidence: 0,
      generatedAt: new Date().toISOString(),
      expiresAt: obs.expiresAt,
    });
    return;
  }

  if (Date.parse(obs.staleAfter) <= Date.now()) {
    derived.set(key, {
      id: randomUUID(),
      placeId: obs.placeId,
      elementId: obs.elementId ?? "",
      property: obs.observedProperty,
      value: "unknown",
      observationIds: [obs.id],
      derivationRule: "stale_observation",
      confidence: 0,
      generatedAt: new Date().toISOString(),
      expiresAt: obs.expiresAt,
    });
    return;
  }

  derived.set(key, {
    id: randomUUID(),
    placeId: obs.placeId,
    elementId: obs.elementId ?? "",
    property: obs.observedProperty,
    value: obs.value === false ? false : obs.value === true ? true : "unknown",
    observationIds: [obs.id],
    derivationRule: "trusted_current_observation",
    confidence: obs.quality === "good" ? 0.9 : 0.5,
    generatedAt: new Date().toISOString(),
    expiresAt: obs.expiresAt,
  });
}

export function getDerivedState(
  placeId: string,
  elementId: string,
  property: string,
): AuraDerivedAccessState | null {
  return derived.get(`${placeId}:${elementId}:${property}`) ?? null;
}

export function assertSensorThingsReadOnly(): void {
  if (auraFlags.sensorThingsTaskingEnabled) {
    throw new Error("AURA_SENSORTHINGS_TASKING_FORBIDDEN");
  }
}
