import type {
  AccessSensorDevice,
  AccessSensorDeviceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJsonArray } from "@/lib/prisma-json";

export async function registerSensorDevice(input: {
  assetId: string;
  deviceIdentifier: string;
  deviceType: AccessSensorDeviceType;
  protocol: string;
  observationTypes: string[];
  tenantId?: string | null;
}): Promise<AccessSensorDevice> {
  const observationTypes = asJsonArray(input.observationTypes);
  if (!observationTypes) throw new Error("OBSERVATION_TYPES_REQUIRED");
  return prisma.accessSensorDevice.create({
    data: {
      assetId: input.assetId,
      tenantId: input.tenantId ?? null,
      deviceIdentifier: input.deviceIdentifier,
      deviceType: input.deviceType,
      protocol: input.protocol,
      observationTypes,
      productionActivated: false,
    },
  });
}

export async function suspendCompromisedSensor(
  deviceId: string,
): Promise<AccessSensorDevice> {
  return prisma.accessSensorDevice.update({
    where: { id: deviceId },
    data: {
      healthStatus: "compromised",
      status: "suspended",
      productionActivated: false,
    },
  });
}
