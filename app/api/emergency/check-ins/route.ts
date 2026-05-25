import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createEmergencyCheckIn } from "@/lib/emergency/check-in-service";
import { prisma } from "@/lib/prisma";
import { emergencyCheckInSchema } from "@/lib/validation/emergency";

export async function GET() {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const checkIns = await prisma.emergencyCheckIn.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return jsonOk({ checkIns });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = emergencyCheckInSchema.parse(await req.json());
    const checkIn = await createEmergencyCheckIn({
      participantId: user.id,
      actorUserId: user.id,
      status: parsed.status,
      message: parsed.message,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      shareLocation: parsed.shareLocation,
    });
    return jsonOk({ checkIn, call000Guidance: "If anyone is in immediate danger, call 000 (Australia)." }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Check-in failed", 500);
  }
}
