import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export const metadata = { title: "Worker messages | MapAble" };

export default function WorkerMessagesPage() {
  return <CommunicationCentrePage basePath="/worker/messages" />;
}
