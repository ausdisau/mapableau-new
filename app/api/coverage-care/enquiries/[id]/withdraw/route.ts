import { jsonError, jsonOk } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { withdrawCoverageCareEnquiry } from "@/lib/coverage-care/enquiry-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const participant = await resolveCoverageCareParticipant();
  if (!participant) return jsonError("Unauthorized", 401);

  const { id } = await Promise.resolve(context.params);
  try {
    const enquiry = await withdrawCoverageCareEnquiry({
      enquiryId: id,
      participant,
    });
    return jsonOk({ enquiry });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}
