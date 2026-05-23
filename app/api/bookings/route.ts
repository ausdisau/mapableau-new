import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createBooking } from "@/lib/bookings/booking-service";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validation/booking";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const bookingType = searchParams.get("booking_type");
  const participantId = searchParams.get("participant_id");
  const providerId = searchParams.get("provider_id");
  const startFrom = searchParams.get("start_from");
  const startTo = searchParams.get("start_to");
  const take = Math.min(Number(searchParams.get("take") ?? 50), 100);
  const skip = Number(searchParams.get("skip") ?? 0);

  const dateFilter =
    startFrom || startTo
      ? {
          requestedStart: {
            ...(startFrom ? { gte: new Date(startFrom) } : {}),
            ...(startTo ? { lte: new Date(startTo) } : {}),
          },
        }
      : {};

  let where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(bookingType ? { bookingType } : {}),
    ...dateFilter,
  };

  if (isAdminRole(user.primaryRole)) {
    if (participantId) where = { ...where, participantId };
    if (providerId) where = { ...where, assignedOrganisationId: providerId };
  } else if (participantId && participantId === user.id) {
    where = { ...where, participantId: user.id };
  } else if (providerId) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: providerId },
    });
    if (!member) return jsonError("Forbidden", 403);
    where = { ...where, assignedOrganisationId: providerId };
  } else {
    const orgs = await prisma.organisationMember.findMany({
      where: { userId: user.id },
      select: { organisationId: true },
    });
    const orgIds = orgs.map((o) => o.organisationId);
    where = {
      ...where,
      OR: [
        { participantId: user.id },
        ...(orgIds.length
          ? [{ assignedOrganisationId: { in: orgIds } }]
          : []),
      ],
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        segments: { orderBy: { sortOrder: "asc" } },
        assignedOrganisation: { select: { id: true, name: true } },
        conversations: { select: { id: true }, take: 1 },
      },
      take,
      skip,
    }),
    prisma.booking.count({ where: where as never }),
  ]);

  const enriched = bookings.map((b) => ({
    ...b,
    conversationId: b.conversations[0]?.id ?? null,
  }));

  return jsonOk({ bookings: enriched, total, take, skip });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createBookingSchema.parse(await req.json());
    const booking = await createBooking({
      ...parsed,
      participantId: user.id,
      createdById: user.id,
    });
    return jsonOk({ booking }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(
        "Consent is required before sharing accessibility details with a provider",
        403
      );
    }
    return jsonError("Create failed", 500);
  }
}
