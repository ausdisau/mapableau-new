import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  getHandoverStatus,
  recordHandover,
  recordSafetyCheck,
} from "@/lib/transport/handover-service";
import { assertCanAccessTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const safetySchema = z.object({
  type: z.literal("safety_check"),
  checkType: z.string().min(1),
  passed: z.boolean(),
  notes: z.string().max(2000).optional(),
});

const handoverSchema = z.object({
  type: z.literal("handover"),
  completed: z.boolean(),
  notes: z.string().max(2000).optional(),
});

const bodySchema = z.discriminatedUnion("type", [safetySchema, handoverSchema]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
    if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    await assertCanAccessTrip(user, trip, "summary");
    return jsonOk({ handoverStatus: await getHandoverStatus(tripId) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = bodySchema.parse(await req.json());
    if (body.type === "safety_check") {
      const handoverStatus = await recordSafetyCheck(user, tripId, {
        checkType: body.checkType,
        passed: body.passed,
        notes: body.notes,
      });
      return jsonOk({ handoverStatus });
    }
    const handoverStatus = await recordHandover(user, tripId, {
      completed: body.completed,
      notes: body.notes,
    });
    return jsonOk({ handoverStatus });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
