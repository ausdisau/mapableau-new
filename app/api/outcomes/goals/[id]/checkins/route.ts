import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { addOutcomeCheckin } from "@/lib/outcomes/progress-checkin-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  const checkin = await addOutcomeCheckin({
    goalId: id,
    submittedById: user.id,
    narrativeUpdate: body.narrativeUpdate,
    progressRating: body.progressRating,
    barriers: body.barriers,
    nextSteps: body.nextSteps,
    participantVisible: body.participantVisible,
  });
  return jsonOk({ checkin }, 201);
}
