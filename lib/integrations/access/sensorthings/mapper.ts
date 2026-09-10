import {
  createUnverifiedProvenance,
  normalizedObservationSchema,
  type NormalizedObservation,
} from "../contracts";
import {
  sensorThingsObservationSchema,
  sensorThingsThingSchema,
  type SensorThingsObservation,
} from "./schemas";

export function mapSensorThingsObservation(
  raw: unknown,
  context?: {
    thingName?: string;
    datastreamName?: string;
    unit?: string;
  },
): NormalizedObservation {
  const observation = sensorThingsObservationSchema.parse(raw);
  const phenomenonTime = observation.phenomenonTime ?? observation.resultTime;
  const result = observation.result;

  let value: string | number | boolean | "UNKNOWN" | null = "UNKNOWN";
  if (result === null || result === undefined) {
    value = "UNKNOWN";
  } else {
    value = result;
  }

  const provenance = createUnverifiedProvenance({
    sourceProvider: "sensorthings",
    sourceReference: String(observation["@iot.id"] ?? "unknown"),
    contributorType: "SENSOR",
    attribution: context?.thingName ?? "SensorThings",
    capturedAt: phenomenonTime,
    confidence: 0.4, // Sensor readings are not verified truth
  });

  const coords = observation.Feature?.geometry?.coordinates;

  return normalizedObservationSchema.parse({
    featureType: "sensor",
    attribute: context?.datastreamName ?? "reading",
    value,
    valueQualifier: "MEASURED",
    geometry: coords
      ? { type: "Point", coordinates: coords }
      : undefined,
    observedAt: phenomenonTime,
    notes: [
      context?.unit ? `unit=${context.unit}` : null,
      "Sensor reading — not verified human capability",
    ]
      .filter(Boolean)
      .join(" · "),
    provenance: {
      ...provenance,
      sourceType: "sensorthings_observation",
      verificationState: "UNVERIFIED",
    },
    claimStrength: "observation",
  });
}

export function mapSensorThingsThing(raw: unknown): NormalizedObservation[] {
  const thing = sensorThingsThingSchema.parse(raw);
  const out: NormalizedObservation[] = [];
  for (const ds of thing.Datastreams ?? []) {
    for (const obs of ds.Observations ?? []) {
      out.push(
        mapSensorThingsObservation(obs, {
          thingName: thing.name,
          datastreamName: ds.name,
          unit: ds.unitOfMeasurement?.symbol,
        }),
      );
    }
  }
  return out;
}
