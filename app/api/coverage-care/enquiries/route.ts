import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireCoverageCareEnabledResponse, mapCoverageCareError } from "@/lib/coverage-care/api-helpers";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import {
  createCoverageCareEnquiry,
  listParticipantEnquiries,
} from "@/lib/coverage-care/enquiry-service";

const createSchema = z.object({
  listingId: z.string().min(1).nullable().optional(),
});

export async function GET() {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  return jsonOk({
    enquiries: listParticipantEnquiries(participant.id),
  });
}

export async function POST(request: Request) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  try {
    const body = createSchema.parse(await request.json());
    const enquiry = createCoverageCareEnquiry({
      participant,
      listingId: body.listingId ?? null,
    });
    return jsonOk({ enquiry }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
