import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";
import { correctPaymentWorkflow } from "@/lib/ndis-gateway/workflows/correct-payment-workflow";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  correctionType: z.enum([
    "administrative",
    "service_date",
    "support_item",
    "quantity",
    "unit_price",
    "participant",
    "payment_route",
    "duplicate",
    "cancellation",
    "travel",
    "tax",
    "recipient",
    "complete_reversal",
  ]),
  reason: z.string().min(1).max(2000),
  patches: z
    .object({
      supportItemCode: z.string().max(64).nullable().optional(),
      supportDescription: z.string().max(500).optional(),
      serviceStartAt: z.string().datetime().optional(),
      serviceEndAt: z.string().datetime().optional(),
      quantity: z.union([z.number().positive(), z.string()]).optional(),
      unitPriceCents: z.number().int().nonnegative().optional(),
      unitType: z.string().max(64).optional(),
    })
    .default({}),
});

type Params = { params: Promise<{ id: string }> };

/** POST /api/provider/ndis/billable-items/[id]/correct */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:correct");
  if (user instanceof Response) return user;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const result = await correctPaymentWorkflow({
      organisationId,
      actorUserId: user.id,
      originalBillableItemId: id,
      correctionType: parsed.data.correctionType,
      reason: parsed.data.reason,
      patches: {
        ...parsed.data.patches,
        serviceStartAt: parsed.data.patches.serviceStartAt
          ? new Date(parsed.data.patches.serviceStartAt)
          : undefined,
        serviceEndAt: parsed.data.patches.serviceEndAt
          ? new Date(parsed.data.patches.serviceEndAt)
          : undefined,
      },
    });
    return jsonNdisOk(result, 201);
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
