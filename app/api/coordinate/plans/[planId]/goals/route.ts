import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  confirmGoal,
  extractGoalsForPlan,
  listGoalsForPlan,
} from "@/lib/coordinate/goal-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { planId } = await params;
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
    );
    const goals = await listGoalsForPlan({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
    });
    return jsonOk({ goals });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { planId } = await params;
    const body = (await req.json()) as {
      participantId?: string;
      action?: "extract" | "confirm";
      goalId?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (body.action === "confirm" && body.goalId) {
      const goal = await confirmGoal({
        actorId: user.id,
        actorRole: user.primaryRole,
        goalId: body.goalId,
        participantId,
      });
      return jsonOk({ goal });
    }

    const result = await extractGoalsForPlan({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
