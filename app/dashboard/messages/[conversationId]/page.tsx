import { notFound } from "next/navigation";

import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import {
  listConversationsForUser,
  userCanAccessConversation,
} from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await requireAuth();
  const { conversationId } = await params;
  if (
    !(await userCanAccessConversation(
      user.id,
      conversationId,
      isAdminRole(user.primaryRole)
    ))
  ) {
    notFound();
  }
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!conversation) notFound();

  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        <CommunicationCentreShell
          conversations={conversations.map((c) => ({
            id: c.id,
            title: c.title,
            lastMessageAt: c.lastMessageAt
              ? c.lastMessageAt.toISOString()
              : null,
          }))}
          activeThreadId={conversationId}
          threadTitle={conversation.title}
        />
      </div>
      <div className="hidden md:block space-y-4">
        <h1 className="font-heading text-2xl font-bold">{conversation.title}</h1>
        <ConversationThread
          conversationId={conversationId}
          messages={conversation.messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
