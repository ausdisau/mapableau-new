import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";
import { recordWorkflowTransition } from "@/lib/ndis-gateway/workflows/transition-audit";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  reason: z.string().max(500).optional(),
});

type Params = { params: Promise<{ documentId: string }> };

/** POST /api/provider/ndis/documents/[documentId]/approve */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:approve");
  if (user instanceof Response) return user;

  const { documentId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const doc = await prisma.ndisBillingDocument.findFirst({
      where: { id: documentId, organisationId },
    });
    if (!doc) return jsonNdisError("Document not found", 404);

    const updated = await prisma.ndisBillingDocument.update({
      where: { id: doc.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedById: user.id,
        dispatchStatus: "approved",
      },
    });

    await recordWorkflowTransition({
      organisationId,
      entityKind: "ndis_billing_document",
      entityId: doc.id,
      fromStatus: doc.status,
      toStatus: "approved",
      actorUserId: user.id,
      reason: parsed.data.reason,
      metadata: { action: "document.approve" },
    });

    return jsonNdisOk({ document: projectBillingDocumentSafe(updated) });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
