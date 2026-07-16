import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isFailureDetectionEnabled } from "@/lib/continuity-os/feature-flags";
import { assessServiceFailure } from "@/lib/continuity-os/failures/failure-service";

type Params = { params: Promise<{ failureId: string }> };

const schema = z.object({
  verify: z.boolean().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isFailureDetectionEnabled(),
      "FAILURE_DETECTION_DISABLED"
    );
    if (disabled) return disabled;

    const { failureId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid assess payload.", 400);
    }

    const result = await assessServiceFailure({
      failureId,
      participantId: user.id,
      actorUserId: user.id,
      verify: parsed.data.verify,
    });
    return Response.json(result);
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
