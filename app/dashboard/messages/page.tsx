import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";

export const metadata = { title: "Messages | MapAble" };

export default async function MessagesPage() {
  const user = await requireAuth();
  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );
  return (
    <CommunicationCentreShell
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        lastMessageAt: c.lastMessageAt
          ? c.lastMessageAt.toISOString()
          : null,
      }))}
    />
  );
}
