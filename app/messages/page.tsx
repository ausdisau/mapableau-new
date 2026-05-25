import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export const metadata = { title: "Messages | MapAble" };

export default function MessagesPage() {
  return (
    <CommunicationCentrePage basePath="/messages" showCreateGroup canEscalateSafety />
  );
}
