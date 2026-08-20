import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  activateCreative,
  approveCreative,
  listPendingReviews,
  pauseAdvertiser,
  rejectCreative,
} from "@/lib/ads/services/admin-review-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const creatives = await listPendingReviews();
  return jsonOk({ creatives });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    creativeId: z.string().min(1),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    creativeId: z.string().min(1),
    notes: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("activate"),
    creativeId: z.string().min(1),
  }),
  z.object({
    action: z.literal("pause_advertiser"),
    advertiserId: z.string().min(1),
  }),
]);

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = actionSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    switch (parsed.data.action) {
      case "approve": {
        const creative = await approveCreative(
          user,
          parsed.data.creativeId,
          parsed.data.notes,
        );
        return jsonOk({ creative });
      }
      case "reject": {
        const creative = await rejectCreative(
          user,
          parsed.data.creativeId,
          parsed.data.notes,
        );
        return jsonOk({ creative });
      }
      case "activate": {
        const creative = await activateCreative(user, parsed.data.creativeId);
        return jsonOk({ creative });
      }
      case "pause_advertiser": {
        const advertiser = await pauseAdvertiser(
          user,
          parsed.data.advertiserId,
        );
        return jsonOk({ advertiser });
      }
      default: {
        const _exhaustive: never = parsed.data;
        return jsonError(`Unknown action: ${JSON.stringify(_exhaustive)}`, 400);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "INVALID_STATUS") {
      return jsonError("Invalid status for this action", 400);
    }
    throw e;
  }
}
