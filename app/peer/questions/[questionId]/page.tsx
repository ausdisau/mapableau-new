import Link from "next/link";

import { PeerAnswerCard, ReportContentButton } from "@/components/peer";
import { resolvePublicDisplayName } from "@/lib/peer/dto";
import { getPeerQuestion } from "@/lib/peer/peer-question-service";

export default async function PeerQuestionDetailPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = await getPeerQuestion(questionId);
  if (!question) return <p>Question not found.</p>;

  return (
    <article className="space-y-6">
      <Link href="/peer/questions" className="text-sm underline">
        All questions
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{question.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {resolvePublicDisplayName(question.author, question.author.user)}
        </p>
        <div className="mt-2">
          <ReportContentButton contentType="PeerQuestion" contentId={question.id} />
        </div>
      </header>
      <p className="whitespace-pre-wrap">{question.body}</p>
      <section aria-label="Answers">
        <h2 className="text-lg font-semibold">Responses</h2>
        <ul className="mt-4 space-y-4">
          {question.answers.map((a) => (
            <li key={a.id}>
              <PeerAnswerCard
                body={a.body}
                authorName={resolvePublicDisplayName(a.author, a.author.user)}
                highlighted={a.moderatorHighlight}
              />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
