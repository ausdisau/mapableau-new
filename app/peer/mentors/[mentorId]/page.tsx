import { PeerMentorProfile } from "@/components/peer";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { getPeerMentor } from "@/lib/peer/peer-mentor-service";

export default async function PeerMentorDetailPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = await params;
  const mentor = await getPeerMentor(mentorId);
  if (!mentor) return <p>Mentor not found.</p>;

  return (
    <PeerMentorProfile
      mentor={{
        id: mentor.id,
        bio: mentor.bio,
        livedExperienceTopics: mentor.livedExperienceTopics,
        boundaries: mentor.boundaries,
        profile: toPeerProfileDto(mentor.peerProfile, mentor.peerProfile.user),
      }}
    />
  );
}
