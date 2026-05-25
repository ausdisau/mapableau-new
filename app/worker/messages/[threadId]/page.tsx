import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export default async function WorkerThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <CommunicationCentrePage basePath="/worker/messages" threadId={threadId} />;
}
