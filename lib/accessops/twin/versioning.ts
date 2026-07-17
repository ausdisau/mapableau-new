import { createHash } from "crypto";

import type { AccessGraphPublication } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { JsonObject } from "../types";

export function checksumGraphPayload(payload: JsonObject): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function recordGraphVersion(input: {
  assetId: string;
  version: number;
  graphJsonRef: string;
  graphPayload: JsonObject;
  floorPlanId?: string | null;
  publish?: boolean;
}): Promise<AccessGraphPublication> {
  return prisma.accessGraphPublication.create({
    data: {
      assetId: input.assetId,
      floorPlanId: input.floorPlanId ?? null,
      version: input.version,
      checksum: checksumGraphPayload(input.graphPayload),
      status: input.publish ? "published" : "draft",
      graphJsonRef: input.graphJsonRef,
      publishedAt: input.publish ? new Date() : null,
    },
  });
}
