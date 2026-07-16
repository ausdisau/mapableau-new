import { prisma } from "@/lib/prisma";
import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isHandoffsEnabled } from "@/lib/continuity-os/feature-flags";

type Params = { params: Promise<{ handoffId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isHandoffsEnabled(), "HANDOFFS_DISABLED");
    if (disabled) return disabled;

    const { handoffId } = await params;
    const handoff = await prisma.recoveryHandoff.findUnique({
      where: { id: handoffId },
    });
    if (!handoff) {
      throw new ContinuityOsError("NOT_FOUND", "Handoff not found.", 404);
    }
    return Response.json({
      handoff,
      receiptStates: [
        "sent",
        "delivered",
        "opened",
        "accepted",
        "task_acknowledged",
        "task_completed",
        "externally_verified",
        "participant_confirmed",
      ],
      note: "A sent handoff is not an accepted handoff.",
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
