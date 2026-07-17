import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { listBillableItemsSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";

const querySchema = z.object({
  organisationId: z.string().cuid().optional(),
  status: z
    .enum([
      "draft",
      "evidence_pending",
      "participant_confirmation_pending",
      "funding_route_pending",
      "pricing_pending",
      "validation_failed",
      "ready",
      "locked",
      "invoiced",
      "claim_packaged",
      "dispatched",
      "partially_paid",
      "paid",
      "rejected",
      "disputed",
      "correction_required",
      "corrected",
      "reversed",
      "voided",
      "archived",
      "migrated_review_required",
    ])
    .optional(),
  participantId: z.string().cuid().optional(),
  billingRoute: z
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
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/** GET /api/provider/ndis/billable-items */
export async function GET(req: Request) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    organisationId: url.searchParams.get("organisationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    participantId: url.searchParams.get("participantId") ?? undefined,
    billingRoute: url.searchParams.get("billingRoute") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const items = await listBillableItemsSafe({
    organisationId,
    status: parsed.data.status,
    participantId: parsed.data.participantId,
    billingRoute: parsed.data.billingRoute,
    limit: parsed.data.limit,
  });

  return jsonNdisOk({ items });
}
