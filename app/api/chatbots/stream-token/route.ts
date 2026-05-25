import { createStreamChatToken } from "@/lib/chatbots/stream";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let username = "";

  try {
    const body = (await request.json()) as { username?: unknown };
    username = typeof body.username === "string" ? body.username : "";
  } catch {
    return Response.json(
      { configured: false, reason: "Request body must include a username." },
      { status: 400 },
    );
  }

  if (!username.trim()) {
    return Response.json(
      { configured: false, reason: "Username is required." },
      { status: 400 },
    );
  }

  const payload = await createStreamChatToken(username);
  return Response.json(payload);
}
