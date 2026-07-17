import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { transitionBillingDispute } from "@/lib/ndis-gateway/billing/dispute-service";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  resolution: z.string().min(1).max(4000),
  toStatus: z.enum(["resolved", "withdrawn"]).default("resolved"),
});

type Params = { params: Promise<{ id: string }> };

/** POST /api/provider/ndis/disputes/[id]/resolve */
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
    const dispute = await transitionBillingDispute({
      organisationId,
      disputeId: id,
      actorUserId: user.id,
      toStatus: parsed.data.toStatus,
      resolution: parsed.data.resolution,
    });
    return jsonNdisOk({
      dispute: {
        id: dispute.id,
        status: dispute.status,
        resolution: dispute.resolution,
        resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
        paymentHold: dispute.paymentHold,
      },
    });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
