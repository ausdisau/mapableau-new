import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { canTransitionBarrierStatus, providerBarrierStatusSchema } from "@/lib/barrier-report/status";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    status: providerBarrierStatusSchema,
  })
  .strict();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;

  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.accessBarrierReport.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        referenceNumber: true,
        isDraft: true,
      },
    });

    if (!existing || existing.isDraft || existing.status === "draft") {
      return jsonError("Report not found", 404);
    }

    if (!canTransitionBarrierStatus(existing.status, body.status)) {
      return jsonError(
        `Cannot move report from ${existing.status} to ${body.status}.`,
        400,
      );
    }

    const updated = await prisma.accessBarrierReport.update({
      where: { id },
      data: { status: body.status },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
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
        fromStatus: existing.status,
        toStatus: updated.status,
      },
    });

    return jsonOk({ report: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update barrier report", 500);
  }
}
