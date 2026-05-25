import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createOutcomeGoal,
  listOutcomeGoals,
} from "@/lib/outcomes/outcome-goal-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? user.id;
  const goals = await listOutcomeGoals(participantId, user);
  return jsonOk({ goals });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const goal = await createOutcomeGoal({
    participantId: body.participantId ?? user.id,
    goalText: body.goalText,
    goalArea: body.goalArea,
    source: body.source,
    visibility: body.visibility,
    createdById: user.id,
  });
  return jsonOk({ goal }, 201);
}
