import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isFailureDetectionEnabled } from "@/lib/continuity-os/feature-flags";
import { getServiceFailure } from "@/lib/continuity-os/failures/failure-service";

type Params = { params: Promise<{ failureId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isFailureDetectionEnabled(),
      "FAILURE_DETECTION_DISABLED"
    );
    if (disabled) return disabled;

    const { failureId } = await params;
    const failure = await getServiceFailure(failureId, user.id);
    return Response.json({ failure });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
