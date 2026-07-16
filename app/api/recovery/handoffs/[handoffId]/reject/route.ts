import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isHandoffsEnabled } from "@/lib/continuity-os/feature-flags";
import { rejectHandoff } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ handoffId: string }> };

const schema = z.object({
  reason: z.string().min(1),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isHandoffsEnabled(), "HANDOFFS_DISABLED");
    if (disabled) return disabled;

    const { handoffId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Rejection reason required.", 400);
    }

    const handoff = await rejectHandoff({
      handoffId,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });
    return Response.json({ handoff });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
