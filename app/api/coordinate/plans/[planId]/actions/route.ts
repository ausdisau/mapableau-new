import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  approveSupportAction,
  createSupportAction,
  listSupportActionsForPlan,
  mapGoalToAction,
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
    const actions = await listSupportActionsForPlan({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
    });
    return jsonOk({ actions });
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
      title?: string;
      goalId?: string;
      steps?: string[];
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.title?.trim()) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    const action = await createSupportAction({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
      title: body.title,
      goalId: body.goalId,
      steps: body.steps,
    });
    return jsonOk({ action }, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    await params;
    const body = (await req.json()) as {
      participantId?: string;
      actionId?: string;
      goalId?: string;
      action?: "approve" | "map_goal";
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.actionId) {
      return Response.json({ error: "actionId is required" }, { status: 400 });
    }

    if (body.action === "map_goal" && body.goalId) {
      const updated = await mapGoalToAction({
        actorId: user.id,
        actorRole: user.primaryRole,
        actionId: body.actionId,
        goalId: body.goalId,
        participantId,
      });
      return jsonOk({ action: updated });
    }

    if (body.action === "approve") {
      const updated = await approveSupportAction({
        actorId: user.id,
        actorRole: user.primaryRole,
        actionId: body.actionId,
        participantId,
      });
      return jsonOk({ action: updated });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
