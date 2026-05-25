import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createCareBookingForRequest,
  listCareBookingsForUser,
} from "@/lib/care/care-booking-service";
import { createCareBookingSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiPermission("care:read:self");
  if (user instanceof Response) return user;
  const bookings = await listCareBookingsForUser(user);
  return jsonOk({ bookings });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const parsed = createCareBookingSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const booking = await createCareBookingForRequest({
      careRequestId: parsed.data.careRequestId,
      actorUserId: user.id,
    });
    return jsonOk({ booking }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create booking", 400);
  }
}
import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertProviderOrgAccess, isCareAccessError } from "@/lib/care/access-control";
import {
  createCareBookingForRequest,
  listCareBookingsForUser,
} from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";
import { createCareBookingSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const bookings = await listCareBookingsForUser(user);
  return jsonOk({ bookings });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;

  try {
    const parsed = createCareBookingSchema.parse(await req.json());
    const request = await prisma.careRequest.findUnique({
      where: { id: parsed.careRequestId },
      select: { assignedOrganisationId: true },
    });
    if (!request) return jsonError("Not found", 404);
    await assertProviderOrgAccess(user, request.assignedOrganisationId);
    const booking = await createCareBookingForRequest(
      parsed.careRequestId,
      user.id
    );
    return jsonOk({ booking }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    return jsonError("Create booking failed", 500);
  }
}
