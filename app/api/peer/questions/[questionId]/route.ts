import { jsonError, jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { getPeerQuestion } from "@/lib/peer/peer-question-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const { questionId } = await params;
  const question = await getPeerQuestion(questionId);
  if (!question) return jsonError("Not found", 404);
  return jsonOk({
    question: {
      id: question.id,
      title: question.title,
      body: question.body,
      author: toPeerProfileDto(question.author, question.author.user),
      answers: question.answers.map((a) => ({
        id: a.id,
        body: a.body,
        moderatorHighlight: a.moderatorHighlight,
        author: toPeerProfileDto(a.author, a.author.user),
      })),
    },
  });
}
