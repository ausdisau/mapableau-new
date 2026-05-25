import { MapableChatbotSuite } from "@/components/chatbots/MapableChatbotSuite";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Chatbots | MapAble Core" };

export default async function DashboardChatbotsPage() {
  const user = await requireAuth();

  return <MapableChatbotSuite userName={user.name} />;
}
