import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { createBillableItemsFromService } from "@/lib/ndis-gateway/billing/service-to-billable-item";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  sourceType: z.enum([
    "booking",
    "care_shift",
    "timesheet",
    "delivery_event",
    "manual",
  ]),
  sourceId: z.string().min(1),
  participantId: z.string().cuid().optional(),
  supportItemCode: z.string().min(1).max(64).optional(),
  supportDescription: z.string().min(1).max(500).optional(),
  serviceStartAt: z.string().datetime().optional(),
  serviceEndAt: z.string().datetime().optional(),
  quantity: z.number().positive().optional(),
  unitType: z.string().min(1).max(64).optional(),
  unitPriceCents: z.number().int().nonnegative().optional(),
  chargeType: z
    .enum([
      "support",
      "provider_travel_labour",
      "provider_travel_non_labour",
      "activity_based_transport",
      "cancellation",
      "report_writing",
      "non_face_to_face",
      "other",
    ])
    .optional(),
  allowZeroPriceReason: z
    .enum(["pro_bono", "grant_funded", "explicit_zero_authorised"])
    .nullable()
    .optional(),
  clientRequestedRoute: z
    .enum([
      "ndis_self_managed",
      "ndis_plan_managed",
      "ndis_ndia_managed",
      "private_pay",
      "pro_bono",
      "grant_funded",
      "employer_funded",
      "health_funded",
      "other",
      "unresolved",
    ])
    .optional(),
  allowClientOverride: z.boolean().optional(),
  overrideReason: z.string().max(500).nullable().optional(),
});

/** POST /api/provider/ndis/billable-items/from-service */
export async function POST(req: Request) {
  const user = await requireApiPermission("provider:billing:create");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const result = await createBillableItemsFromService({
      organisationId,
      createdById: user.id,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      participantId: parsed.data.participantId,
      supportItemCode: parsed.data.supportItemCode,
      supportDescription: parsed.data.supportDescription,
      serviceStartAt: parsed.data.serviceStartAt
        ? new Date(parsed.data.serviceStartAt)
        : undefined,
      serviceEndAt: parsed.data.serviceEndAt
        ? new Date(parsed.data.serviceEndAt)
        : undefined,
      quantity: parsed.data.quantity,
      unitType: parsed.data.unitType,
      unitPriceCents: parsed.data.unitPriceCents,
      chargeType: parsed.data.chargeType,
      allowZeroPriceReason: parsed.data.allowZeroPriceReason,
      clientRequestedRoute: parsed.data.clientRequestedRoute,
      allowClientOverride: parsed.data.allowClientOverride,
      overrideReason: parsed.data.overrideReason,
    });

    return jsonNdisOk(result, result.idempotent ? 200 : 201);
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
