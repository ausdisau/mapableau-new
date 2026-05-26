import { redirect } from "next/navigation";

import { routes } from "@/lib/routing/canonical-routes";

export default async function DashboardConversationRedirect({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  redirect(routes.messages.thread(conversationId));
}
