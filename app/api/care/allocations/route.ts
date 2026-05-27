import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { listAllocationProposals } from "@/lib/care-allocation/allocation-service";
import { listCareAllocationsSchema } from "@/lib/validation/care";

export async function GET(req: Request) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const parsed = listCareAllocationsSchema.parse({
      organisationId: url.searchParams.get("organisationId"),
      status: url.searchParams.get("status") ?? undefined,
      careBookingId: url.searchParams.get("careBookingId") ?? undefined,
    });
    const proposals = await listAllocationProposals({
      organisationId: parsed.organisationId,
      status: parsed.status,
      careBookingId: parsed.careBookingId,
    });
    return jsonOk({ proposals });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Failed to list allocations", 500);
  }
}
