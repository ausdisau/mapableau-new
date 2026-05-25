import { PeerMentorDirectory } from "@/components/peer";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { listPeerMentors } from "@/lib/peer/peer-mentor-service";

export default async function PeerMentorsPage() {
  const mentors = await listPeerMentors();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer mentors</h1>
      <p className="text-sm text-muted-foreground">
        Mentors share lived experience only — not clinical, legal, or financial advice.
      </p>
      <PeerMentorDirectory
        mentors={mentors.map((m) => ({
          id: m.id,
          bio: m.bio,
          livedExperienceTopics: m.livedExperienceTopics,
          boundaries: m.boundaries,
          profile: toPeerProfileDto(m.peerProfile, m.peerProfile.user),
        }))}
      />
    </div>
  );
}
