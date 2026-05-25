import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export const metadata = { title: "Conversation | MapAble" };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return (
    <CommunicationCentrePage
      basePath="/messages"
      threadId={threadId}
      showCreateGroup
      canEscalateSafety
    />
  );
}
