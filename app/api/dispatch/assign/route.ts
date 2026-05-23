import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { assertNoDoubleBooking } from "@/lib/scheduling/conflict-detector";
import { scheduleAssignSchema } from "@/lib/validation/scheduling";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = scheduleAssignSchema
      .extend({
        bookingId: z.string().optional(),
        organisationId: z.string(),
      })
      .parse(await req.json());

    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: body.organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);

    await assertNoDoubleBooking({
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      startsAt,
      endsAt,
    });

    const assignment = await prisma.scheduledAssignment.create({
      data: {
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        startsAt,
        endsAt,
        bookingId: body.bookingId,
        organisationId: body.organisationId,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      action: "dispatch.assigned",
      entityType: "ScheduledAssignment",
      entityId: assignment.id,
      organisationId: body.organisationId,
    });

    return jsonOk(assignment, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message.includes("CONFLICT")) {
      return jsonError("Resource conflict", 409);
    }
    return jsonError("Assign failed", 500);
  }
}
