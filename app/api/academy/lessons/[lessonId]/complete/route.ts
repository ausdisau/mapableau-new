import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { completeLesson } from "@/lib/academy/enrolment-service";

type Params = { params: Promise<{ lessonId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("academy:enrol");
  if (user instanceof Response) return user;
  const { lessonId } = await params;
  try {
    const enrolment = await completeLesson({
      lessonId,
      userId: user.id,
      actorUserId: user.id,
    });
    return jsonOk({ enrolment });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_ENROLLED") {
      return jsonError("Enrol in the course first", 400);
    }
    if (e instanceof Error && e.message === "LESSON_ORDER_REQUIRED") {
      return jsonError("Complete earlier lessons first", 400);
    }
    return jsonError("Could not complete lesson", 500);
  }
}
