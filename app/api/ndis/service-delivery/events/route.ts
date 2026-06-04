import { NdisPaymentRoute, NdisServiceDeliveryMechanism } from "@prisma/client";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { recordDeliveryEvent } from "@/lib/ndis/service-delivery/delivery-event-service";

const bodySchema = z.object({
  providerOrgId: z.string().cuid(),
  participantId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  deliveryMechanism: z.nativeEnum(NdisServiceDeliveryMechanism),
  serviceDate: z.string().datetime(),
  authorizationId: z.string().cuid().optional(),
  careShiftId: z.string().cuid().optional(),
  careServiceLogId: z.string().cuid().optional(),
  claimLineId: z.string().cuid().optional(),
  quantityMinutes: z.number().int().positive().optional(),
  evidenceJson: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    return jsonError("NDIS service delivery mechanism is disabled", 503);
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const event = await recordDeliveryEvent({
      ...parsed.data,
      serviceDate: new Date(parsed.data.serviceDate),
      createdById: user.id,
    });
    return jsonOk({ event }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "NDIS_SERVICE_DELIVERY_DISABLED") {
      return jsonError("NDIS service delivery mechanism is disabled", 503);
    }
    return jsonError(msg, 400);
  }
}
