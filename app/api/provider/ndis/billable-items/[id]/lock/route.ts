import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { lockBillableItem } from "@/lib/ndis-gateway/billing/billable-item-lock";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  reason: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

/** POST /api/provider/ndis/billable-items/[id]/lock */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:approve");
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
    const result = await lockBillableItem({
      organisationId,
      billableItemId: id,
      actorUserId: user.id,
      reason: parsed.data.reason,
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
