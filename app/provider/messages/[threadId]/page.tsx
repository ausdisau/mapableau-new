import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export default async function ProviderThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <CommunicationCentrePage basePath="/provider/messages" threadId={threadId} />;
}
