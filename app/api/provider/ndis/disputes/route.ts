import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  organisationId: z.string().cuid().optional(),
  status: z
    .enum([
      "open",
      "under_review",
      "payment_held",
      "resolved",
      "withdrawn",
      "escalated",
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/** GET /api/provider/ndis/disputes */
export async function GET(req: Request) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    organisationId: url.searchParams.get("organisationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const disputes = await prisma.ndisBillingDispute.findMany({
    where: {
      organisationId,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
    orderBy: { raisedAt: "desc" },
    take: parsed.data.limit ?? 50,
    select: {
      id: true,
      participantId: true,
      billableItemId: true,
      documentId: true,
      category: true,
      description: true,
      status: true,
      paymentHold: true,
      raisedAt: true,
      resolvedAt: true,
      resolution: true,
    },
  });

  return jsonNdisOk({ disputes });
}
