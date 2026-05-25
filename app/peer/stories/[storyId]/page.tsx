import { resolvePublicDisplayName } from "@/lib/peer/dto";
import { getPeerStory } from "@/lib/peer/peer-story-service";
import { ReportContentButton } from "@/components/peer";

export default async function PeerStoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getPeerStory(storyId);
  if (!story) return <p>Story not found.</p>;

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{story.title}</h1>
      {story.author ? (
        <p className="text-sm text-muted-foreground">
          {resolvePublicDisplayName(story.author, story.author.user)}
        </p>
      ) : null}
      <ReportContentButton contentType="PeerStoryItem" contentId={story.id} />
      <p className="whitespace-pre-wrap">{story.body}</p>
    </article>
  );
}
