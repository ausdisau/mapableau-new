import { requireAuth } from "@/lib/auth/guards";
import { getActivePeerProfileForUser } from "@/lib/peer/access-control";
import { listMentorRequestsForMentor } from "@/lib/peer/peer-mentor-service";
import { resolvePublicDisplayName } from "@/lib/peer/dto";

export default async function PeerMentorRequestsPage() {
  const user = await requireAuth();
  const profile = await getActivePeerProfileForUser(user.id);
  if (!profile) return <p>Create a peer profile first.</p>;

  const requests = await listMentorRequestsForMentor(profile.id);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mentor requests</h1>
      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <p className="font-medium">
              {resolvePublicDisplayName(r.requester, r.requester.user)}
            </p>
            <p className="text-sm text-muted-foreground">Status: {r.status}</p>
            {r.message ? <p className="mt-2 text-sm">{r.message}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
