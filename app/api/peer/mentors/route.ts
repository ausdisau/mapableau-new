import { jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { listPeerMentors } from "@/lib/peer/peer-mentor-service";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const mentors = await listPeerMentors();
  return jsonOk({
    mentors: mentors.map((m) => ({
      id: m.id,
      bio: m.bio,
      livedExperienceTopics: m.livedExperienceTopics,
      boundaries: m.boundaries,
      profile: toPeerProfileDto(m.peerProfile, m.peerProfile.user),
    })),
  });
}
