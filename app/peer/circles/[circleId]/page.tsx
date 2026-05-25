import { PeerCirclePage } from "@/components/peer";
import { resolvePublicDisplayName } from "@/lib/peer/dto";
import { getActivePeerProfileForUser } from "@/lib/peer/access-control";
import { getPeerCircle } from "@/lib/peer/peer-circle-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function PeerCircleDetailPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const user = await requireAuth();
  const { circleId } = await params;
  const circle = await getPeerCircle(circleId);
  const profile = await getActivePeerProfileForUser(user.id);
  const isMember = profile
    ? circle?.members.some((m) => m.peerProfileId === profile.id)
    : false;

  if (!circle) {
    return <p>Circle not found.</p>;
  }

  return (
    <PeerCirclePage
      circle={{
        id: circle.id,
        title: circle.title,
        description: circle.description,
        topic: circle.topic,
        accessibilityNotes: circle.accessibilityNotes,
      }}
      posts={circle.posts.map((p) => ({
        id: p.id,
        body: p.body,
        authorName: resolvePublicDisplayName(p.author, p.author.user),
        contentWarning: p.contentWarning,
      }))}
      isMember={Boolean(isMember)}
    />
  );
}
