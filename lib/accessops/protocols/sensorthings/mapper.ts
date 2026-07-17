import type { JsonObject } from "../../types";

export interface SensorThingsObservationDto {
  observationType: string;
  resultValue: JsonObject;
  phenomenonTime: Date;
  resultTime: Date;
  externalId?: string | null;
}

export function mapSensorThingsObservation(
  raw: JsonObject,
): SensorThingsObservationDto {
  return {
    observationType: String(
      raw["Datastream@iot.navigationLink"] ?? raw.type ?? "unknown",
    ),
    resultValue: { result: raw.result ?? null },
    phenomenonTime: new Date(
      String(raw.phenomenonTime ?? raw.resultTime ?? new Date().toISOString()),
    ),
    resultTime: new Date(
      String(raw.resultTime ?? raw.phenomenonTime ?? new Date().toISOString()),
    ),
    externalId: raw["@iot.id"] ? String(raw["@iot.id"]) : null,
  };
}

export function sensorThingsObservationMutatesStatus(): false {
  return false;
}
