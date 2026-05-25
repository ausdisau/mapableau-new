import Link from "next/link";

import { PeerMentorRequestForm } from "./PeerMentorRequestForm";

export function PeerMentorProfile({
  mentor,
}: {
  mentor: {
    id: string;
    bio: string;
    livedExperienceTopics: unknown;
    boundaries?: string | null;
    profile: { displayName: string };
  };
}) {
  const topics = Array.isArray(mentor.livedExperienceTopics)
    ? (mentor.livedExperienceTopics as string[])
    : [];

  return (
    <article className="rounded-lg border p-4">
      <h2 className="font-heading text-xl font-semibold">
        <Link href={`/peer/mentors/${mentor.id}`}>{mentor.profile.displayName}</Link>
      </h2>
      <p className="mt-2 text-sm whitespace-pre-wrap">{mentor.bio}</p>
      {topics.length ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Topics: {topics.join(", ")}
        </p>
      ) : null}
      {mentor.boundaries ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">Boundaries: </span>
          {mentor.boundaries}
        </p>
      ) : null}
      <div className="mt-4">
        <PeerMentorRequestForm mentorId={mentor.id} />
      </div>
    </article>
  );
}
