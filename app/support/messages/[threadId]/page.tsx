import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return (
    <CommunicationCentrePage
      basePath="/support/messages"
      threadId={threadId}
      canEscalateSafety
    />
  );
}
