import type {
  ConferenceAdapter,
  ConferenceRoomResult,
  ConferenceTokenResult,
} from "@/lib/conference/conference-adapter";
import type { ConferenceMode } from "@/types/messages";

const DAILY_API = "https://api.daily.co/v1";

function dailyDomain() {
  return process.env.DAILY_DOMAIN ?? process.env.NEXT_PUBLIC_DAILY_DOMAIN ?? "";
}

export function createDailyConferenceAdapter(): ConferenceAdapter {
  const apiKey = process.env.DAILY_API_KEY!;

  async function dailyFetch(path: string, init?: RequestInit) {
    const res = await fetch(`${DAILY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Daily API error: ${res.status} ${text}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  }

  return {
    async createRoom({ threadId, mode }) {
      const name = `mapable-${threadId.slice(0, 12)}-${Date.now()}`.toLowerCase();
      const body = await dailyFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({
          name,
          privacy: "private",
          properties: {
            enable_chat: true,
            enable_screenshare: mode === "video",
            start_video_off: mode === "audio",
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
          },
        }),
      });
      const externalRoomId = String(body.name ?? name);
      const domain = dailyDomain();
      const roomUrl = domain
        ? `https://${domain}.daily.co/${externalRoomId}`
        : String(body.url ?? `https://daily.co/${externalRoomId}`);
      return { externalRoomId, roomUrl } satisfies ConferenceRoomResult;
    },

    async createMeetingToken({ externalRoomId, profileId, displayName, mode }) {
      const body = await dailyFetch("/meeting-tokens", {
        method: "POST",
        body: JSON.stringify({
          properties: {
            room_name: externalRoomId,
            user_id: profileId,
            user_name: displayName,
            enable_screenshare: mode === "video",
            start_video_off: mode === "audio",
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
          },
        }),
      });
      const token = String(body.token ?? "");
      const domain = dailyDomain();
      const roomUrl = domain
        ? `https://${domain}.daily.co/${externalRoomId}`
        : `https://daily.co/${externalRoomId}`;
      return { token, roomUrl } satisfies ConferenceTokenResult;
    },

    async endRoom(externalRoomId: string) {
      try {
        await dailyFetch(`/rooms/${encodeURIComponent(externalRoomId)}`, {
          method: "DELETE",
        });
      } catch {
        // room may already be gone
      }
    },
  };
}
