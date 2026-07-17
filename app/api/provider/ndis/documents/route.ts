import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  organisationId: z.string().cuid().optional(),
  status: z
    .enum([
      "draft",
      "generated",
      "pending_approval",
      "approved",
      "issued",
      "mock_delivered",
      "delivered",
      "acknowledged",
      "voided",
      "superseded",
      "failed",
    ])
    .optional(),
  documentKind: z
    .enum([
      "self_managed_invoice",
      "plan_manager_invoice",
      "private_pay_invoice",
      "ndia_payment_request_package",
      "portal_bulk_upload",
      "credit_note",
      "adjustment_note",
      "service_statement",
      "evidence_summary",
      "remittance_advice",
      "receipt",
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/** GET /api/provider/ndis/documents */
export async function GET(req: Request) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    organisationId: url.searchParams.get("organisationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    documentKind: url.searchParams.get("documentKind") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const docs = await prisma.ndisBillingDocument.findMany({
    where: {
      organisationId,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.documentKind
        ? { documentKind: parsed.data.documentKind }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: parsed.data.limit ?? 50,
  });

  return jsonNdisOk({
    documents: docs.map(projectBillingDocumentSafe),
  });
}
