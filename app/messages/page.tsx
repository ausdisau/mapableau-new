import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { InboxPanel } from "@/components/messages/InboxPanel";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";

export const metadata = { title: "Communication Centre | MapAble" };

export default async function MessagesHubPage() {
  const user = await requireAuth("/login?returnTo=/messages");
  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );

  if (conversations.length === 1) {
    redirect(`/messages/${conversations[0].id}`);
  }

  return (
    <PageContainer title="Communication Centre">
      <p className="mb-4 text-sm text-muted-foreground">
        Secure, consent-aware messaging. Select a conversation to continue.
      </p>
      <CommunicationCentreShell
        sidebar={
          <InboxPanel
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title,
              lastMessageAt: c.lastMessageAt,
            }))}
          />
        }
        main={
          conversations.length === 0 ? (
            <p role="status" className="p-8 text-slate-600">
              No conversations yet. Message a provider from their profile.
            </p>
          ) : (
            <p className="p-8 text-muted-foreground">
              Choose a thread from the inbox to view messages.
            </p>
          )
        }
      />
    </PageContainer>
  );
}
