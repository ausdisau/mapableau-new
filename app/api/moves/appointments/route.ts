import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createTherapyAppointment } from "@/lib/moves/therapy-booking-service";
import { prisma } from "@/lib/prisma";
import { therapyAppointmentSchema } from "@/lib/validation/moves";

export async function GET() {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const appointments = await prisma.therapyAppointment.findMany({
    where: { participantId: user.id },
    include: {
      therapistProfile: true,
      telehealthSession: true,
      progressSummaries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });
  return jsonOk({ appointments });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = therapyAppointmentSchema.parse(await req.json());
    const appointment = await createTherapyAppointment({
      participantId: user.id,
      actorUserId: user.id,
      therapistProfileId: parsed.therapistProfileId,
      therapyType: parsed.therapyType,
      deliveryMode: parsed.deliveryMode,
      startsAt: new Date(parsed.startsAt),
      endsAt: new Date(parsed.endsAt),
      location: parsed.location,
      transportRequired: parsed.transportRequired,
    });
    return jsonOk({ appointment }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "THERAPIST_NOT_VERIFIED") {
      return jsonError("Therapist is not verified", 400);
    }
    return jsonError("Booking failed", 500);
  }
}
