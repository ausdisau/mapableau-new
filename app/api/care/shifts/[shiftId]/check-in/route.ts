import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { careShiftCheckIn } from "@/lib/care/care-shift-service";
import { ShiftTelemetrySchema } from "@/lib/care/shift-telemetry-schemas";
import { isPaceTelemetryClaimingEnabled } from "@/lib/ndis/pace-config";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiPermission("care:shift:work");
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  try {
    if (!isPaceTelemetryClaimingEnabled()) {
      const result = await careShiftCheckIn(shiftId, user.id);
      return jsonOk({ shift: result.shift });
    }

    const body = await req.json().catch(() => null);
    const parsed = ShiftTelemetrySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const result = await careShiftCheckIn(shiftId, user.id, parsed.data);
    return jsonOk({
      shift: result.shift,
      pace: result.pace,
      notice:
        "PACE telemetry check-in recorded. Scaffold mode — not a live NDIA submission.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Check-in failed";
    if (message === "PACE_ENDORSEMENT_REQUIRED") {
      const pace =
        e && typeof e === "object" && "pace" in e
          ? (e as { pace: unknown }).pace
          : undefined;
      return Response.json(
        {
          error: "PACE endorsement missing or invalid — shift start blocked",
          code: message,
          pace,
        },
        { status: 403 }
      );
    }
    if (message === "WORKER_SCREENING_REQUIRED") {
      return jsonError(
        "Worker NDIS screening status must be verified before check-in",
        403
      );
    }
    if (message === "WORKER_REQUIRED" || message === "NOT_FOUND") {
      return jsonError(message, 404);
    }
    return jsonError(message, 400);
  }
}
