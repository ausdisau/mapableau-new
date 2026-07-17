import type { AccessOpsWebhookDelivery } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { JsonObject } from "../types";

import { filterWebhookPayload } from "./webhook-delivery";

export async function enqueueWebhookDelivery(input: {
  subscriptionId: string;
  eventId: string;
  eventType: string;
  schemaVersion: string;
  payloadJson: JsonObject;
}): Promise<AccessOpsWebhookDelivery> {
  const payload = asJson(filterWebhookPayload(input.payloadJson));
  if (!payload) throw new Error("WEBHOOK_PAYLOAD_REQUIRED");
  return prisma.accessOpsWebhookDelivery.create({
    data: {
      subscriptionId: input.subscriptionId,
      eventId: input.eventId,
      eventType: input.eventType,
      schemaVersion: input.schemaVersion,
      payloadJson: payload,
      status: "queued",
    },
  });
}
