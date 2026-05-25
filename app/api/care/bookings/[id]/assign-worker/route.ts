import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignWorkerToCareBooking } from "@/lib/care/care-assignment-service";
import { assignCareWorkerSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const parsed = assignCareWorkerSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const result = await assignWorkerToCareBooking({
      bookingId: id,
      workerProfileId: parsed.data.workerProfileId,
      actorUserId: user.id,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
      notes: parsed.data.notes,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to assign worker", 400);
  }
}
import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertProviderOrgAccess, isCareAccessError } from "@/lib/care/access-control";
import { assignWorkerToCareBooking } from "@/lib/care/care-assignment-service";
import { prisma } from "@/lib/prisma";
import { assignCareWorkerSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const parsed = assignCareWorkerSchema.parse(await req.json());
    const booking = await prisma.careBooking.findUnique({ where: { id } });
    if (!booking) return jsonError("Not found", 404);
    await assertProviderOrgAccess(user, booking.organisationId);
    const result = await assignWorkerToCareBooking({
      bookingId: id,
      workerProfileId: parsed.workerProfileId,
      actorUserId: user.id,
      notes: parsed.notes,
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    if (error instanceof Error) return jsonError(error.message, 400);
    return jsonError("Assign worker failed", 500);
  }
}
