import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerApiUser, requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import {
  createPeerQuestion,
  listPeerQuestions,
} from "@/lib/peer/peer-question-service";
import { createPeerQuestionSchema } from "@/lib/validation/peer";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const questions = await listPeerQuestions();
  return jsonOk({
    questions: questions.map((q) => ({
      id: q.id,
      title: q.title,
      topic: q.topic,
      author: toPeerProfileDto(q.author, q.author.user),
      answerCount: q._count.answers,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  try {
    const body = createPeerQuestionSchema.parse(await req.json());
    const question = await createPeerQuestion(
      ctx.profile.id,
      ctx.user.id,
      body
    );
    return jsonOk(
      {
        question: {
          id: question.id,
          title: question.title,
          status: question.status,
        },
      },
      201
    );
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create question", 400);
  }
}
