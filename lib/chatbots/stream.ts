import { StreamChat } from "stream-chat";

export type StreamTokenResponse =
  | {
      configured: true;
      apiKey: string;
      userId: string;
      token: string;
    }
  | {
      configured: false;
      reason: string;
    };

export function normalizeStreamUserId(username: string) {
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || "guest";
}

export function getStreamConfig() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret };
}

export async function createStreamChatToken(username: string) {
  const config = getStreamConfig();

  if (!config) {
    return {
      configured: false,
      reason:
        "Stream persistence is optional. Add STREAM_API_KEY and STREAM_API_SECRET to .env.local to enable it.",
    } satisfies StreamTokenResponse;
  }

  const userId = normalizeStreamUserId(username);
  const serverClient = StreamChat.getInstance(config.apiKey, config.apiSecret);

  await serverClient.upsertUser({
    id: userId,
    name: username.trim() || userId,
  });

  return {
    configured: true,
    apiKey: config.apiKey,
    userId,
    token: serverClient.createToken(userId),
  } satisfies StreamTokenResponse;
}
