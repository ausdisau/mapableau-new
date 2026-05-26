import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertOrgAccess,
  createClaimLineFromBooking,
} from "@/lib/ndis/claiming/claim-service";

const bodySchema = z.object({
  bookingId: z.string().cuid(),
  providerOrgId: z.string().cuid(),
  supportItemCode: z.string().optional(),
  unitPriceCents: z.number().int().nonnegative().optional(),
  quantity: z.number().positive().optional(),
  evidenceJson: z.record(z.string(), z.unknown()).optional(),
  participantConfirmationException: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const result = await createClaimLineFromBooking({
      ...parsed.data,
      createdById: user.id,
    });
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "BOOKING_NOT_FOUND") return jsonError("Booking not found", 404);
    if (msg === "BOOKING_NOT_COMPLETED") {
      return jsonError("Only completed bookings can be claimed", 400);
    }
    return jsonError(msg, 400);
  }
}
