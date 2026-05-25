import Link from "next/link";

import { Card } from "@/components/ui/card";

export function PeerQuestionCard({
  id,
  title,
  authorName,
  answerCount,
}: {
  id: string;
  title: string;
  authorName: string;
  answerCount: number;
}) {
  return (
    <Card className="p-4">
      <h2 className="font-heading text-lg font-semibold">
        <Link href={`/peer/questions/${id}`}>{title}</Link>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {authorName} ?? {answerCount} responses (not ranked by votes)
      </p>
    </Card>
  );
}
