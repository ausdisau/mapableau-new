import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { linkSupportActivityToGoal } from "@/lib/outcomes/support-activity-link-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const link = await linkSupportActivityToGoal({
    goalId: body.goalId,
    activityType: body.activityType,
    activityId: body.activityId,
    actorUserId: user.id,
  });
  return jsonOk({ link }, 201);
}
