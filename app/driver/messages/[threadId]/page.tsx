import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export default async function DriverThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <CommunicationCentrePage basePath="/driver/messages" threadId={threadId} />;
}
