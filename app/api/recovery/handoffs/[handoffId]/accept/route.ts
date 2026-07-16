import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isHandoffsEnabled } from "@/lib/continuity-os/feature-flags";
import { canAcceptHandoff } from "@/lib/continuity-os/permissions";
import { acceptHandoff } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ handoffId: string }> };

const schema = z.object({
  partial: z.boolean().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isHandoffsEnabled(), "HANDOFFS_DISABLED");
    if (disabled) return disabled;
    if (!canAcceptHandoff(user) && user.primaryRole !== "participant") {
      throw new ContinuityOsError("FORBIDDEN", "Not authorised to accept handoff.", 403);
    }

    const { handoffId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid accept payload.", 400);
    }

    const handoff = await acceptHandoff({
      handoffId,
      actorUserId: user.id,
      partial: parsed.data.partial,
    });
    return Response.json({
      handoff,
      note: "Accepted is not proof every task completed.",
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
