import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { uploadPlanSummary } from "@/lib/coordinate/plan-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    await params;
    const body = (await req.json()) as {
      participantId?: string;
      planText?: string;
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
    });

    return jsonOk(result, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
