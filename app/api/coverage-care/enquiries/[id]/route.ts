import { jsonError, jsonOk } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import {
  deleteCoverageCareEnquiry,
  getCoverageCareEnquiry,
} from "@/lib/coverage-care/enquiry-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  const { id } = await Promise.resolve(context.params);
  try {
    const enquiry = getCoverageCareEnquiry(id);
    if (!enquiry) return jsonError("ENQUIRY_NOT_FOUND", 404);
    if (enquiry.participantUserId !== participant.id) {
      return jsonError("Forbidden", 403);
    }
    return jsonOk({ enquiry });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  const { id } = await Promise.resolve(context.params);
  try {
    const enquiry = await deleteCoverageCareEnquiry({
      enquiryId: id,
      participant,
    });
    return jsonOk({ enquiry });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}
