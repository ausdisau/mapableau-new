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
import { markEnquiryProviderStatus } from "@/lib/coverage-care/enquiry-service";
import { PROVIDER_INBOX_STATUSES } from "@/lib/tenancy/tenant-enquiry-model";

const reviewSchema = z.object({
  providerStatus: z.enum(PROVIDER_INBOX_STATUSES).default("in_review"),
  notes: z.string().optional(),
  reply: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  try {
    const body = reviewSchema.parse(await request.json().catch(() => ({})));
    const enquiry = markEnquiryProviderStatus({
      enquiryId: id,
      actor,
      actorTenantId: resolveActorTenantId(
        request.headers.get("x-mapable-tenant-id"),
      ),
      providerStatus: body.providerStatus,
      notes: body.notes,
      reply: body.reply,
    });
    return jsonOk({ enquiry });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
