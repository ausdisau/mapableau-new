import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  approvePlanSummary,
  getActivePlan,
} from "@/lib/coordinate/plan-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { planId } = await params;
    const { searchParams } = new URL(req.url);
    const participantId = resolveParticipantIdFromRequest(user, searchParams);

    const plan = await getActivePlan({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
    });

    if (!plan || plan.id !== planId) {
      const direct = await prisma.coordinateNdisPlan.findFirst({
        where: { id: planId, participantId },
        include: {
          goals: { orderBy: { priority: "asc" } },
          budgetCategories: true,
          supportNeeds: true,
          supportActions: true,
          shortlistItems: { orderBy: { rank: "asc" } },
          riskFlags: { where: { active: true } },
        },
      });
      if (!direct) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      return jsonOk({ plan: direct });
    }

    return jsonOk({ plan });
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
    const { planId } = await params;
    const body = (await req.json()) as {
      participantId?: string;
      action?: "approve_summary";
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (body.action === "approve_summary") {
      const plan = await approvePlanSummary({
        actorId: user.id,
        actorRole: user.primaryRole,
        planId,
        participantId,
      });
      return jsonOk({ plan });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
