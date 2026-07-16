import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { buildCreditNote } from "@/lib/ndis-gateway/documents/credit-note-builder";
import { checksumJson } from "@/lib/ndis-gateway/documents/document-checksum";
import {
  allocateDocumentNumber,
  prefixForDocumentKind,
} from "@/lib/ndis-gateway/documents/document-number-service";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { renderDocumentSafeJson } from "@/lib/ndis-gateway/documents/document-renderer";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  reason: z.string().min(1).max(2000),
});

type Params = { params: Promise<{ documentId: string }> };

/** POST /api/provider/ndis/documents/[documentId]/credit */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:correct");
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
    const original = await prisma.ndisBillingDocument.findFirst({
      where: { id: documentId, organisationId },
      include: { lines: true, organisation: true },
    });
    if (!original) return jsonNdisError("Document not found", 404);

    const allocated = await allocateDocumentNumber({
      organisationId,
      documentKind: "credit_note",
      prefix: prefixForDocumentKind("credit_note"),
    });

    const credit = buildCreditNote({
      documentNumber: allocated.documentNumber,
      organisationName: original.organisation.name,
      participantId: original.participantId,
      billingRoute: original.billingRoute,
      originalDocumentNumber: original.documentNumber,
      reason: parsed.data.reason,
      lines: original.lines.map((l) => ({
        supportItemCode: l.supportItemCode,
        description: l.description,
        serviceStartAt: l.serviceStartAt.toISOString(),
        serviceEndAt: l.serviceEndAt.toISOString(),
        quantity: l.quantity.toString(),
        unitType: l.unitType,
        unitPriceCents: l.unitPriceCents,
        totalCents: l.totalCents,
      })),
    });

    const safeJson = renderDocumentSafeJson(credit);
    const contentHash = checksumJson(safeJson);
    const correlationId = createCorrelationId();

    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.ndisBillingDocument.create({
        data: {
          organisationId,
          participantId: original.participantId,
          billingRoute: original.billingRoute,
          documentKind: "credit_note",
          documentNumber: allocated.documentNumber,
          status: "generated",
          issueDate: new Date(),
          currency: "AUD",
          subtotalCents: credit.subtotalCents,
          gstCents: 0,
          totalCents: credit.totalCents,
          contentHash,
          safeDocumentJson: sanitiseAuditJson(
            safeJson
          ) as Prisma.InputJsonValue,
          supersedesDocumentId: original.id,
          dispatchStatus: "ready",
          createdById: user.id,
          lines: {
            create: original.lines.map((l, idx) => ({
              billableItemId: l.billableItemId,
              supportItemCode: l.supportItemCode,
              description: l.description,
              serviceStartAt: l.serviceStartAt,
              serviceEndAt: l.serviceEndAt,
              quantity: l.quantity,
              unitType: l.unitType,
              unitPriceCents: l.unitPriceCents,
              subtotalCents: l.subtotalCents,
              gstCents: l.gstCents,
              totalCents: l.totalCents,
              sortOrder: idx,
            })),
          },
        },
      });

      await tx.ndisBillingDocument.update({
        where: { id: original.id },
        data: { status: "superseded" },
      });

      await tx.ndisWorkflowTransition.create({
        data: {
          organisationId,
          entityType: "ndis_billing_document",
          entityId: doc.id,
          fromStatus: "none",
          toStatus: "generated",
          actorUserId: user.id,
          reason: parsed.data.reason,
          correlationId,
          metadataJson: sanitiseAuditJson({
            action: "document.credit",
            originalDocumentId: original.id,
          }) as Prisma.InputJsonValue,
        },
      });

      return doc;
    });

    return jsonNdisOk(
      {
        document: projectBillingDocumentSafe(created),
        correlationId,
      },
      201
    );
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
