import Link from "next/link";

import { Card } from "@/components/ui/card";

export function StoryCard({
  id,
  title,
  contentWarning,
}: {
  id: string;
  title: string;
  contentWarning?: string | null;
}) {
  return (
    <Card className="p-4">
      <h2 className="font-heading text-lg font-semibold">
        <Link href={`/peer/stories/${id}`}>{title}</Link>
      </h2>
      {contentWarning ? (
        <p className="mt-1 text-xs text-amber-800">Content note: {contentWarning}</p>
      ) : null}
    </Card>
  );
}
