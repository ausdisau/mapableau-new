import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { listPlans, uploadPlanSummary } from "@/lib/coordinate/plan-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { searchParams } = new URL(req.url);
    const participantId = resolveParticipantIdFromRequest(user, searchParams);
    const plans = await listPlans({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
    });
    return jsonOk({ plans });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function POST(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const body = (await req.json()) as {
      participantId?: string;
      planText?: string;
      planStart?: string;
      planEnd?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.planText?.trim()) {
      return Response.json({ error: "planText is required" }, { status: 400 });
    }

    const result = await uploadPlanSummary({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
      planText: body.planText,
      planStart: body.planStart ? new Date(body.planStart) : undefined,
      planEnd: body.planEnd ? new Date(body.planEnd) : undefined,
    });

    return jsonOk(result, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
