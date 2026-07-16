import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isResilienceEnabled } from "@/lib/continuity-os/feature-flags";
import { runPreMortemAssessment } from "@/lib/continuity-os/resilience/pre-mortem";

type Params = { params: Promise<{ missionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isResilienceEnabled(), "RESILIENCE_DISABLED");
    if (disabled) return disabled;

    const { missionId } = await params;
    const result = await runPreMortemAssessment({
      missionId,
      participantId: user.id,
      actorUserId: user.id,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
