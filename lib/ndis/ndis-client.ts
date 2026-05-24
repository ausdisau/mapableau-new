import type { NdisAdapterType } from "@prisma/client";
import { createHash } from "crypto";

import { aggregatorNdisAdapter } from "@/lib/ndis/adapters/aggregator-ndis-adapter";
import { directNdiaAdapter } from "@/lib/ndis/adapters/direct-ndia-adapter";
import { mockNdisAdapter } from "@/lib/ndis/adapters/mock-ndis-adapter";
import type { NdisAdapter } from "@/lib/ndis/ndis-adapter";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export function getNdisAdapter(type?: NdisAdapterType): NdisAdapter {
  const adapterType = type ?? remainingSystemsConfig.ndisAdapterType;
  switch (adapterType) {
    case "aggregator":
      return aggregatorNdisAdapter;
    case "direct_ndia":
      return directNdiaAdapter;
    default:
      return mockNdisAdapter;
  }
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function logNdisSyncEvent(params: {
  adapterType: NdisAdapterType;
  operation: string;
  payload?: unknown;
  status: string;
  error?: string;
}) {
  await prisma.ndisSyncEvent.create({
    data: {
      adapterType: params.adapterType,
      operation: params.operation,
      payloadHash: params.payload ? hashPayload(params.payload) : undefined,
      status: params.status,
      error: params.error,
    },
  });
}
