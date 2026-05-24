import { NextRequest } from "next/server";

import { GET as getConversation } from "@/app/api/messages/conversations/[conversationId]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  return getConversation(req, { params: Promise.resolve({ conversationId: threadId }) });
}
