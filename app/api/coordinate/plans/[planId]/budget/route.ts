import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  getBudgetForPlan,
  upsertBudgetCategory,
} from "@/lib/coordinate/budget-service";

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
    const budget = await getBudgetForPlan({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
    });
    return jsonOk(budget);
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
      supportCategory?: string;
      allocatedCents?: number;
      spentCents?: number;
      committedCents?: number;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.supportCategory || body.allocatedCents == null) {
      return Response.json(
        { error: "supportCategory and allocatedCents are required" },
        { status: 400 },
      );
    }

    const category = await upsertBudgetCategory({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
      supportCategory: body.supportCategory,
      allocatedCents: body.allocatedCents,
      spentCents: body.spentCents,
      committedCents: body.committedCents,
    });
    return jsonOk({ category });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
