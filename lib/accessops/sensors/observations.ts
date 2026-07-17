import type { AccessSensorObservation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { JsonObject } from "../types";

export async function recordSensorObservation(input: {
  deviceId: string;
  observationType: string;
  resultValue: JsonObject;
  phenomenonTime: Date;
  resultTime: Date;
  unit?: string | null;
  externalId?: string | null;
  integrityOk?: boolean;
}): Promise<AccessSensorObservation> {
  const resultValue = asJson(input.resultValue);
  if (!resultValue) throw new Error("RESULT_VALUE_REQUIRED");
  return prisma.accessSensorObservation.create({
    data: {
      deviceId: input.deviceId,
      observationType: input.observationType,
      resultValue,
      phenomenonTime: input.phenomenonTime,
      resultTime: input.resultTime,
      unit: input.unit ?? null,
      externalId: input.externalId ?? null,
      integrityOk: input.integrityOk ?? true,
    },
  });
}

export function sensorObservationMutatesStatus(): false {
  return false;
}
