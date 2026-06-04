import {
  NdisDeliveryAuthorizationType,
  NdisPaymentRoute,
  NdisServiceDeliveryMechanism,
} from "@prisma/client";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import {
  createDeliveryAuthorization,
  listDeliveryAuthorizationsForOrg,
} from "@/lib/ndis/service-delivery/authorization-service";

const createSchema = z.object({
  providerOrgId: z.string().cuid(),
  participantId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  deliveryMechanism: z.nativeEnum(NdisServiceDeliveryMechanism),
  authorizationType: z.nativeEnum(NdisDeliveryAuthorizationType).optional(),
  supportItemCode: z.string().optional(),
  supportCategoryCode: z.string().optional(),
  serviceAgreementId: z.string().cuid().optional(),
  careBookingId: z.string().cuid().optional(),
  ndiaBookingReference: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    return jsonError("NDIS service delivery mechanism is disabled", 503);
  }

  const url = new URL(req.url);
  const providerOrgId = url.searchParams.get("providerOrgId");
  if (!providerOrgId) {
    return jsonError("providerOrgId is required", 400);
  }

  try {
    await assertOrgAccess(user, providerOrgId);
    const status = url.searchParams.get("status") ?? undefined;
    const rows = await listDeliveryAuthorizationsForOrg(
      providerOrgId,
      status as Parameters<typeof listDeliveryAuthorizationsForOrg>[1]
    );
    return jsonOk({ authorizations: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    return jsonError("NDIS service delivery mechanism is disabled", 503);
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const record = await createDeliveryAuthorization({
      ...parsed.data,
      validFrom: new Date(parsed.data.validFrom),
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : undefined,
      createdById: user.id,
    });
    return jsonOk({ authorization: record }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "NDIS_SERVICE_DELIVERY_DISABLED") {
      return jsonError("NDIS service delivery mechanism is disabled", 503);
    }
    return jsonError(msg, 400);
  }
}
