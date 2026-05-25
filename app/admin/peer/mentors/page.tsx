import { listPeerMentors } from "@/lib/peer/peer-mentor-service";

export default async function AdminPeerMentorsPage() {
  const mentors = await listPeerMentors();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer mentors</h1>
      <ul>
        {mentors.map((m) => (
          <li key={m.id}>{m.peerProfile.displayName}</li>
        ))}
      </ul>
    </div>
  );
}
