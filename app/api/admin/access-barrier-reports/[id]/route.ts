import type { Prisma } from "@prisma/client";
import { ZodError, z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  canTransitionBarrierStatus,
  providerBarrierStatusSchema,
} from "@/lib/barrier-report/status";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    status: providerBarrierStatusSchema.optional(),
    /** Explicit provider assignment by platform moderator. */
    organisationId: z.string().cuid().nullable().optional(),
    triageNotes: z.string().max(4000).optional(),
  })
  .strict();

/**
 * Platform moderation update — assign organisation and/or change status.
 * Separate from provider inbox authorisation.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.accessBarrierReport.findUnique({
      where: { id },
    });
    if (!existing || existing.isDraft || existing.status === "draft") {
      return jsonError("Report not found", 404);
    }

    if (body.organisationId) {
      const org = await prisma.organisation.findFirst({
        where: { id: body.organisationId, status: "active" },
        select: { id: true },
      });
      if (!org) {
        return jsonError("Organisation not found or inactive", 400);
      }
    }

    if (body.status && !canTransitionBarrierStatus(existing.status, body.status)) {
      return jsonError(
        `Cannot move report from ${existing.status} to ${body.status}.`,
        400,
      );
    }

    const priorHistory = Array.isArray(existing.statusHistory)
      ? (existing.statusHistory as unknown[])
      : [];
    const historyEntry = body.status
      ? {
          from: existing.status,
          to: body.status,
          at: new Date().toISOString(),
          byUserId: user.id,
          via: "admin",
        }
      : null;

    const updated = await prisma.accessBarrierReport.update({
      where: { id: existing.id },
      data: {
        status: body.status ?? undefined,
        organisationId:
          body.organisationId === undefined
            ? undefined
            : body.organisationId,
        triageNotes:
          typeof body.triageNotes === "string"
            ? body.triageNotes
            : undefined,
        statusHistory: historyEntry
          ? ([...priorHistory, historyEntry] as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        organisationId: true,
        updatedAt: true,
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
        organisationId: updated.organisationId,
        status: updated.status,
        via: "admin",
      },
    });

    return jsonOk({ report: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update barrier report", 500);
  }
}
