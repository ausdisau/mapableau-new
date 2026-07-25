import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { careShiftCheckOut } from "@/lib/care/care-shift-service";
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
      const result = await careShiftCheckOut(shiftId, user.id);
      return jsonOk({ shift: result.shift });
    }

    const body = await req.json().catch(() => null);
    const parsed = ShiftTelemetrySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const result = await careShiftCheckOut(shiftId, user.id, parsed.data);
    return jsonOk({
      shift: result.shift,
      geofence: result.geofence,
      pricingPreview: result.pricingPreview,
      warnings: result.warnings,
      checkOutTelemetryHash: result.checkOutTelemetryHash,
      notice:
        "Shift awaiting participant approval. Pricing preview is DRAFT_ONLY scaffold — not a live PACE claim.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Check-out failed";
    if (message === "CHECK_IN_TELEMETRY_REQUIRED") {
      return jsonError(
        "Check-in GPS telemetry is required before check-out in PACE telemetry mode",
        409
      );
    }
    if (message === "NOT_FOUND") {
      return jsonError(message, 404);
    }
    return jsonError(message, 400);
  }
}
