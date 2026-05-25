import { requireAuth } from "@/lib/auth/guards";
import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { getInbox, getThread } from "@/lib/messages/thread-service";
import {
  getParticipantSummaries,
  getThreadContextLinks,
} from "@/lib/messages/thread-context-service";

export async function CommunicationCentrePage({
  basePath,
  threadId,
  showCreateGroup,
  canEscalateSafety,
}: {
  basePath: string;
  threadId?: string;
  showCreateGroup?: boolean;
  canEscalateSafety?: boolean;
}) {
  const user = await requireAuth();
  const inbox = await getInbox(user.id, user);

  let threadDetail = null;
  if (threadId) {
    const result = await getThread(threadId, user);
    if (result) {
      const [context, participants] = await Promise.all([
        getThreadContextLinks(threadId),
        getParticipantSummaries(threadId),
      ]);
      threadDetail = {
        thread: result.thread,
        messages: result.messages,
        context,
        participants,
      };
    }
  }

  return (
    <div className="space-y-4">
      <header className="hidden lg:block">
        <h1 className="font-heading text-2xl font-bold">Communication Centre</h1>
        <p className="text-muted-foreground">
          Secure messages for bookings, support, invoices, and team coordination.
        </p>
      </header>
      <CommunicationCentreShell
        basePath={basePath}
        inbox={inbox}
        activeThreadId={threadId}
        threadDetail={threadDetail}
        currentProfileId={user.id}
        showCreateGroup={showCreateGroup}
        canEscalateSafety={canEscalateSafety}
      />
    </div>
  );
}
