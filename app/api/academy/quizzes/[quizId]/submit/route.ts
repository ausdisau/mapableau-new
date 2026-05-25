import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { submitQuiz } from "@/lib/academy/quiz-service";
import { quizSubmitSchema } from "@/lib/validation/academy";

type Params = { params: Promise<{ quizId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("academy:enrol");
  if (user instanceof Response) return user;
  const { quizId } = await params;
  try {
    const parsed = quizSubmitSchema.parse(await req.json());
    const result = await submitQuiz({
      quizId,
      userId: user.id,
      actorUserId: user.id,
      answers: parsed.answers,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "LESSONS_INCOMPLETE") {
      return jsonError("Complete all lessons before the quiz", 400);
    }
    if (e instanceof Error && e.message === "NOT_ENROLLED") {
      return jsonError("Not enrolled", 400);
    }
    return jsonError("Quiz submit failed", 500);
  }
}
