import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";
import { preparePaymentForBillableItems } from "@/lib/ndis-gateway/workflows/prepare-payment-workflow";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  billableItemIds: z.array(z.string().cuid()).min(1).max(200),
  billingRoute: z.enum([
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
  ]),
  billingBatchId: z.string().cuid().nullable().optional(),
});

/** POST /api/provider/ndis/billing/prepare/dry-run */
export async function POST(req: Request) {
  const user = await requireApiPermission("provider:billing:validate");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const result = await preparePaymentForBillableItems({
      organisationId,
      actorUserId: user.id,
      user,
      billableItemIds: parsed.data.billableItemIds,
      billingRoute: parsed.data.billingRoute,
      dryRun: true,
      billingBatchId: parsed.data.billingBatchId,
    });
    return jsonNdisOk(result);
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
