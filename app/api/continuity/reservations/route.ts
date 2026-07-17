import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createReservation,
  releaseReservation,
} from "@/lib/continuity/reservations/reservation-service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  action: z.literal("create").default("create"),
  caseId: z.string().optional(),
  organisationId: z.string().optional(),
  resourceKind: z.string().min(1),
  resourceRef: z.string().min(1),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  detailsJson: z.record(z.string(), z.unknown()).optional(),
});

const releaseSchema = z.object({
  action: z.literal("release"),
  reservationId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action === "release") {
    const parsed = releaseSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid release payload", 400);
    try {
      const r = await releaseReservation(parsed.data.reservationId, user.id);
      return jsonOk({ reservation: r });
    } catch (err) {
      return jsonError((err as Error).message ?? "RELEASE_ERROR", 400);
    }
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid create payload", 400);
  try {
    const r = await createReservation({
      caseId: parsed.data.caseId,
      organisationId: parsed.data.organisationId,
      resourceKind: parsed.data.resourceKind,
      resourceRef: parsed.data.resourceRef,
      windowStart: new Date(parsed.data.windowStart),
      windowEnd: new Date(parsed.data.windowEnd),
      createdById: user.id,
      detailsJson: parsed.data.detailsJson,
    });
    return jsonOk({ reservation: r }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "CREATE_ERROR", 400);
  }
}
