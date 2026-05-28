import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { runCareAllocation } from "@/lib/care-allocation/allocation-service";
import { runCareAllocationSchema } from "@/lib/validation/care";

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  try {
    const parsed = runCareAllocationSchema.parse(await req.json());
    const result = await runCareAllocation({
      careBookingId: parsed.careBookingId,
      actorUser: user,
      trigger: parsed.trigger,
    });
    if ("skipped" in result && result.skipped) {
      return jsonOk({ skipped: true, reason: result.reason });
    }
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (e.message.startsWith("CARE_ALLOCATION_CAPABILITY_DENIED")) {
        return jsonError(e.message, 403);
      }
    }
    return jsonError("Allocation run failed", 500);
  }
}
