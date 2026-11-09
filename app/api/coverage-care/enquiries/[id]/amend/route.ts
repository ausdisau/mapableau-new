import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { amendCoverageCareEnquiry } from "@/lib/coverage-care/enquiry-service";
import { COMMUNICATION_CHANNELS } from "@/lib/tenancy/tenant-enquiry-model";

const amendSchema = z.object({
  listingId: z.string().min(1).nullable().optional(),
  sharePreview: z
    .object({
      fieldsShared: z.array(z.string().min(1)).min(1),
      purpose: z.string().min(3),
      providerLabel: z.string().min(1),
      participantNote: z.string().optional(),
      preferredChannel: z.enum(COMMUNICATION_CHANNELS),
      accessRequirements: z.string().optional(),
    })
    .optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  try {
    const body = amendSchema.parse(await request.json());
    const enquiry = amendCoverageCareEnquiry({
      enquiryId: id,
      participant,
      listingId: body.listingId,
      sharePreview: body.sharePreview,
    });
    return jsonOk({ enquiry });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
