import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { getContinuityOsFlags } from "@/lib/continuity-os/feature-flags";
import { escalateRecoveryCase } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

const schema = z.object({
  destinationRole: z.string().min(1),
  purpose: z.string().min(1),
  fieldsShared: z.array(z.string()).optional(),
  highRisk: z.boolean().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    if (!getContinuityOsFlags().recoveryHumanAssistanceEnabled) {
      return Response.json(
        {
          error: "RECOVERY_OPTIONS_DISABLED",
          message: "Human assistance is disabled.",
        },
        { status: 503 }
      );
    }

    const { recoveryId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid escalation.", 400);
    }

    const escalation = await escalateRecoveryCase({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      ...parsed.data,
    });
    return Response.json({ escalation }, { status: 201 });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
