import { NextRequest } from "next/server";

import { POST as sendMessage } from "@/app/api/messages/conversations/[conversationId]/messages/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  return sendMessage(req, {
    params: Promise.resolve({ conversationId: threadId }),
  });
}
