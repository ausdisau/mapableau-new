import { ModerationActionPanel } from "@/components/admin/access/ModerationActionPanel";
import { requireAccessModerator } from "@/lib/auth/guards";
import { listModerationQueue } from "@/lib/access-moderation/review-moderation-service";

export default async function AdminAccessModerationPage() {
  await requireAccessModerator();
  const queue = await listModerationQueue("pending");

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      <p className="text-sm text-muted-foreground">
        Review flagged community content. Describe observed conditions only — not
        legal determinations.
      </p>
      <ul className="space-y-4">
        {queue.map((item) => (
          <li key={item.id}>
            <ModerationActionPanel
              queueId={item.id}
              entityType={item.entityType}
              flagReason={item.flagReason}
              preview={item.review?.reviewBody}
            />
          </li>
        ))}
      </ul>
      {!queue.length ? (
        <p className="text-sm text-muted-foreground">Queue is empty.</p>
      ) : null}
    </div>
  );
}
