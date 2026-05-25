import { CommunicationCentrePage } from "@/components/messages/CommunicationCentrePage";

export const metadata = { title: "Support messages | MapAble" };

export default function SupportMessagesPage() {
  return (
    <CommunicationCentrePage
      basePath="/support/messages"
      canEscalateSafety
    />
  );
}
