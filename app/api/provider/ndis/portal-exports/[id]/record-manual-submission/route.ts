import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
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
  externalReference: z.string().min(1).max(200),
  submittedAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/provider/ndis/portal-exports/[id]/record-manual-submission
 * Records that a human uploaded the package in the NDIA portal.
 * Does not call NDIA.
 */
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
    const batch = await prisma.ndisBillingBatch.findFirst({
      where: {
        id,
        organisationId,
        billingRoute: "ndis_ndia_managed",
      },
      include: { documents: true, members: true },
    });
    if (!batch) return jsonNdisError("Portal export not found", 404);

    const submittedAt = parsed.data.submittedAt
      ? new Date(parsed.data.submittedAt)
      : new Date();
    const correlationId = createCorrelationId();

    await prisma.$transaction(async (tx) => {
      await tx.ndisBillingBatch.update({
        where: { id: batch.id },
        data: {
          status: "prepared",
          metadataJson: sanitiseAuditJson({
            ...(typeof batch.metadataJson === "object" &&
            batch.metadataJson !== null
              ? (batch.metadataJson as Record<string, unknown>)
              : {}),
            manualPortalSubmission: {
              externalReference: parsed.data.externalReference,
              submittedAt: submittedAt.toISOString(),
              notes: parsed.data.notes ?? null,
              recordedById: user.id,
            },
          }) as Prisma.InputJsonValue,
        },
      });

      if (batch.documents.length > 0) {
        await tx.ndisBillingDocument.updateMany({
          where: { billingBatchId: batch.id },
          data: {
            dispatchStatus: "manually_submitted",
            manuallySubmittedAt: submittedAt,
            manuallySubmittedById: user.id,
          },
        });
      }

      await tx.ndisBillableServiceItem.updateMany({
        where: {
          id: { in: batch.members.map((m) => m.billableItemId) },
        },
        data: { status: "dispatched" },
      });

      await tx.ndisWorkflowTransition.create({
        data: {
          organisationId,
          entityType: "ndis_billing_batch",
          entityId: batch.id,
          fromStatus: batch.status,
          toStatus: "prepared",
          actorUserId: user.id,
          reason: parsed.data.notes ?? "Manual portal submission recorded",
          correlationId,
          metadataJson: sanitiseAuditJson({
            action: "portal_export.record_manual_submission",
            externalReference: parsed.data.externalReference,
          }) as Prisma.InputJsonValue,
        },
      });
    });

    return jsonNdisOk({
      id: batch.id,
      correlationId,
      message:
        "Manual portal submission recorded. MapAble did not submit to NDIA.",
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

type Params = { params: Promise<{ id: string }> };
