import Link from "next/link";

import { PeerBoundaryNotice } from "./PeerBoundaryNotice";
import { PeerCirclePostComposer } from "./PeerCirclePostComposer";
import { PeerPostCard } from "./PeerPostCard";

export function PeerCirclePage({
  circle,
  posts,
  isMember,
}: {
  circle: {
    id: string;
    title: string;
    description: string;
    topic: string;
    accessibilityNotes?: string | null;
  };
  posts: {
    id: string;
    body: string;
    authorName: string;
    contentWarning?: string | null;
  }[];
  isMember: boolean;
}) {
  return (
    <div className="space-y-6">
      <Link href="/peer/circles" className="text-sm underline">
        All circles
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{circle.title}</h1>
        <p className="mt-2 text-muted-foreground">{circle.description}</p>
        {circle.accessibilityNotes ? (
          <p className="mt-2 text-sm">
            <span className="font-medium">Accessibility: </span>
            {circle.accessibilityNotes}
          </p>
        ) : null}
      </header>
      <PeerBoundaryNotice />
      {!isMember ? (
        <form action={`/api/peer/circles/${circle.id}/join`} method="post">
          <p className="text-sm">Join this circle to post and reply.</p>
        </form>
      ) : (
        <PeerCirclePostComposer circleId={circle.id} />
      )}
      <div className="space-y-4">
        {posts.map((p) => (
          <PeerPostCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
