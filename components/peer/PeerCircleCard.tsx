import Link from "next/link";

import { Card } from "@/components/ui/card";

export function PeerCircleCard({
  id,
  title,
  description,
  topic,
  memberCount,
}: {
  id: string;
  title: string;
  description: string;
  topic: string;
  memberCount: number;
}) {
  return (
    <Card variant="interactive" className="p-4">
      <h2 className="font-heading text-lg font-semibold">
        <Link href={`/peer/circles/${id}`} className="hover:underline">
          {title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Topic: {topic} ?? {memberCount} members (no public rankings)
      </p>
    </Card>
  );
}
