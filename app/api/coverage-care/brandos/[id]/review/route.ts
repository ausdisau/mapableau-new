import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import { reviewBrandContent } from "@/lib/coverage-care/brandos-service";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";

const reviewSchema = z.object({
  approvalStatus: z.enum(["approved", "rejected"]),
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
    const body = reviewSchema.parse(await request.json());
    const item = reviewBrandContent({
      actor,
      actorTenantId: resolveActorTenantId(
        request.headers.get("x-mapable-tenant-id"),
      ),
      itemId: id,
      approvalStatus: body.approvalStatus,
    });
    return jsonOk({ item });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
