import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { markEnquiryProviderReviewed } from "@/lib/coverage-care/enquiry-service";

const reviewSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  const { id } = await Promise.resolve(context.params);
  try {
    const body = reviewSchema.parse(await request.json().catch(() => ({})));
    const enquiry = markEnquiryProviderReviewed({
      enquiryId: id,
      actor,
      actorTenantId: resolveActorTenantId(
        request.headers.get("x-mapable-tenant-id"),
      ),
      notes: body.notes,
    });
    return jsonOk({ enquiry });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
