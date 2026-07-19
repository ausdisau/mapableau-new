import type { Prisma } from "@prisma/client";
import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  canTransitionBarrierStatus,
  providerBarrierStatusSchema,
} from "@/lib/barrier-report/status";
import { getProviderScopedBarrierReport } from "@/lib/barrier-report/tenancy";
import { isProviderBarrierInboxEnabled } from "@/lib/config/access-independence";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    status: providerBarrierStatusSchema,
    triageNotes: z.string().max(4000).optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;

  if (!isProviderBarrierInboxEnabled()) {
    return jsonError("Provider barrier inbox is unavailable.", 503);
  }

  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await req.json());
    const existing = await getProviderScopedBarrierReport(user, id);

    // Tenant boundary: do not reveal whether another org's report exists.
    if (!existing) {
      return jsonError("Report not found", 404);
    }

    if (!canTransitionBarrierStatus(existing.status, body.status)) {
      return jsonError(
        `Cannot move report from ${existing.status} to ${body.status}.`,
        400,
      );
    }

    const priorHistory = Array.isArray(existing.statusHistory)
      ? (existing.statusHistory as unknown[])
      : [];
    const historyEntry = {
      from: existing.status,
      to: body.status,
      at: new Date().toISOString(),
      byUserId: user.id,
    };

    const updated = await prisma.accessBarrierReport.update({
      where: { id: existing.id },
      data: {
        status: body.status,
        triageNotes:
          typeof body.triageNotes === "string"
            ? body.triageNotes
            : existing.triageNotes,
        statusHistory: [...priorHistory, historyEntry] as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        updatedAt: true,
        organisationId: true,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "accessibility.updated",
      entityType: "AccessBarrierReport",
      entityId: updated.id,
      metadata: {
        referenceNumber: updated.referenceNumber,
        fromStatus: existing.status,
        toStatus: updated.status,
        organisationId: updated.organisationId,
      },
    });

    return jsonOk({ report: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update barrier report", 500);
  }
}
