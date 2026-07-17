import type { AccessJourneyPlan } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson, asJsonArray } from "@/lib/prisma-json";

import type { JourneyRouteOption, JsonObject } from "../types";

export async function createJourneyPlan(input: {
  requestId: string;
  origin: JsonObject;
  destination: JsonObject;
  departureWindow: JsonObject;
  routeOptions: JourneyRouteOption[];
  expiresAt: Date;
  participantId?: string | null;
  tenantId?: string | null;
  statusSnapshotId?: string;
}): Promise<AccessJourneyPlan> {
  const origin = asJson(input.origin);
  const destination = asJson(input.destination);
  const departureWindow = asJson(input.departureWindow);
  const routeOptions = asJsonArray(input.routeOptions);
  if (!origin || !destination || !departureWindow || !routeOptions)
    throw new Error("JOURNEY_JSON_REQUIRED");
  return prisma.accessJourneyPlan.create({
    data: {
      requestId: input.requestId,
      participantId: input.participantId ?? null,
      tenantId: input.tenantId ?? null,
      graphVersions: [],
      sourceVersions: [],
      statusSnapshotId: input.statusSnapshotId ?? "unknown",
      consentDirectiveIds: [],
      origin,
      destination,
      departureWindow,
      routeOptions,
      expiresAt: input.expiresAt,
      status: "generated",
    },
  });
}
