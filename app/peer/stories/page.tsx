import Link from "next/link";

import { StoryLibrary, StorySubmissionForm } from "@/components/peer";
import { listPeerStories } from "@/lib/peer/peer-story-service";

export default async function PeerStoriesPage() {
  const stories = await listPeerStories();
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold">Stories and resources</h1>
      <StoryLibrary stories={stories} />
      <section>
        <h2 className="text-lg font-semibold">Share your story</h2>
        <StorySubmissionForm />
      </section>
      <Link href="/peer" className="text-sm underline">
        Back
      </Link>
    </div>
  );
}
