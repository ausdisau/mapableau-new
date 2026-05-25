import Link from "next/link";

import { PeerQuestionCard } from "@/components/peer";
import { resolvePublicDisplayName } from "@/lib/peer/dto";
import { listPeerQuestions } from "@/lib/peer/peer-question-service";

export default async function PeerQuestionsPage() {
  const questions = await listPeerQuestions();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Lived-experience Q&A</h1>
        <Link
          href="/peer/ask"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Ask a question
        </Link>
      </div>
      <ul className="space-y-4">
        {questions.map((q) => (
          <li key={q.id}>
            <PeerQuestionCard
              id={q.id}
              title={q.title}
              authorName={resolvePublicDisplayName(q.author, q.author.user)}
              answerCount={q._count.answers}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
