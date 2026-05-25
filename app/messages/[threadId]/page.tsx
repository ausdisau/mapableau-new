import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConversationThread } from "@/components/messages/ConversationThread";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { userCanAccessConversation } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/auth/roles";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { threadId } = await params;

  const allowed = await userCanAccessConversation(
    user.id,
    threadId,
    isAdminRole(user.primaryRole)
  );
  if (!allowed) notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { id: threadId },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!conversation) notFound();

  return (
    <PageContainer title={conversation.title}>
      <Link href="/messages" className="text-sm text-blue-800 font-medium mb-4 inline-block">
        ← Inbox
      </Link>
      <ConversationThread
        conversationId={threadId}
        messages={conversation.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
      />
    </PageContainer>
  );
}
