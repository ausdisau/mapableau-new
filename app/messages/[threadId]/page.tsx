import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ChatInfoPanel } from "@/components/messages/ChatInfoPanel";
import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { InboxPanel } from "@/components/messages/InboxPanel";
import { MessageThread } from "@/components/messages/MessageThread";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessMessageThread } from "@/lib/messages/message-access-policy";
import { listConversationsForUser } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await requireAuth("/login");
  const { threadId } = await params;
  const isAdmin = isAdminRole(user.primaryRole);

  const allowed = await canAccessMessageThread(user.id, threadId, { isAdmin });
  if (!allowed) notFound();

  const [conversations, conversation, messages] = await Promise.all([
    listConversationsForUser(user.id, isAdmin),
    prisma.conversation.findUnique({
      where: { id: threadId },
      include: { participants: true },
    }),
    prisma.message.findMany({
      where: { conversationId: threadId },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { sender: { select: { id: true, name: true } } },
    }),
  ]);

  if (!conversation) notFound();
  const latest = messages[messages.length - 1];

  return (
    <PageContainer title="Communication Centre">
      <Link
        href="/messages"
        className="mb-4 inline-block text-sm font-medium text-blue-800"
      >
        ? Inbox
      </Link>
      <CommunicationCentreShell
        sidebar={
          <InboxPanel
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title,
              lastMessageAt: c.lastMessageAt,
            }))}
            activeId={threadId}
          />
        }
        main={
          <MessageThread
            conversationId={threadId}
            currentUserId={user.id}
            latestMessageId={latest?.id ?? null}
            messages={messages.map((m) => ({
              id: m.id,
              body: m.body,
              senderUserId: m.senderUserId,
              senderName: m.sender.name,
              createdAt: m.createdAt,
            }))}
          />
        }
        info={
          <ChatInfoPanel
            title={conversation.title}
            type={conversation.type}
            participantCount={conversation.participants.length}
          />
        }
      />
    </PageContainer>
  );
}
