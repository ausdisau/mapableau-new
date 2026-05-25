import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createRehabPlan } from "@/lib/moves/rehab-plan-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const plans = await prisma.rehabPlan.findMany({
    where: { participantId: user.id },
    include: { goals: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ plans });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const body = (await req.json()) as {
      goalsSummary?: string;
      interventions?: string;
      reviewDate?: string;
      participantVisibleSummary: string;
    };
    if (!body.participantVisibleSummary) {
      return jsonError("participantVisibleSummary required", 400);
    }
    const plan = await createRehabPlan({
      participantId: user.id,
      actorUserId: user.id,
      goalsSummary: body.goalsSummary,
      interventions: body.interventions,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      participantVisibleSummary: body.participantVisibleSummary,
    });
    return jsonOk({ plan }, 201);
  } catch {
    return jsonError("Create plan failed", 500);
  }
}
