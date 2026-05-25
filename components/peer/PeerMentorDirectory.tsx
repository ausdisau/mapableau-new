import { PeerMentorProfile } from "./PeerMentorProfile";

export function PeerMentorDirectory({
  mentors,
}: {
  mentors: {
    id: string;
    bio: string;
    livedExperienceTopics: unknown;
    boundaries?: string | null;
    profile: { displayName: string; id: string };
  }[];
}) {
  return (
    <ul className="space-y-6">
      {mentors.map((m) => (
        <li key={m.id}>
          <PeerMentorProfile mentor={m} />
        </li>
      ))}
    </ul>
  );
}
