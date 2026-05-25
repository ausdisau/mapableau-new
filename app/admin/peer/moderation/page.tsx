import { ModerationQueue } from "@/components/peer";
import { listModerationQueue } from "@/lib/peer/peer-moderation-service";

export default async function AdminPeerModerationPage() {
  const queue = await listModerationQueue();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer moderation</h1>
      <ModerationQueue items={queue} />
    </div>
  );
}
