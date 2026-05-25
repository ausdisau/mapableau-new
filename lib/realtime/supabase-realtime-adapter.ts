import type { RealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import type { Message } from "@/types/messages";

type BroadcastPayload =
  | { event: "message:new"; message: Message }
  | { event: "message:read"; messageId: string; profileId: string }
  | { event: "typing:start"; profileId: string }
  | { event: "typing:stop"; profileId: string }
  | { event: "presence:update"; profileId: string; state: "online" | "away" | "offline" };

function channelName(threadId: string) {
  return `thread:${threadId}`;
}

export function createSupabaseRealtimeAdapter(): RealtimeAdapter {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function broadcast(threadId: string, payload: BroadcastPayload) {
    if (!url || !key) return;
    const endpoint = `${url}/realtime/v1/api/broadcast`;
    await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: channelName(threadId),
            event: payload.event,
            payload,
          },
        ],
      }),
    }).catch(() => undefined);
  }

  return {
    async subscribeToThread(threadId, handlers) {
      if (typeof window === "undefined") {
        return async () => undefined;
      }
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) {
        const { createMemoryRealtimeAdapter } = await import("./memory-realtime-adapter");
        return createMemoryRealtimeAdapter().subscribeToThread(threadId, handlers);
      }

      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, anon);
      const channel = client.channel(channelName(threadId));

      channel
        .on("broadcast", { event: "message:new" }, (msg: { payload: { message: Message } }) => {
          handlers.onMessage?.(msg.payload.message);
        })
        .on("broadcast", { event: "message:read" }, (msg: { payload: { messageId: string; profileId: string } }) => {
          handlers.onRead?.(msg.payload.messageId, msg.payload.profileId);
        })
        .on("broadcast", { event: "typing:start" }, (msg: { payload: { profileId: string } }) => {
          handlers.onTypingStart?.(msg.payload.profileId);
        })
        .on("broadcast", { event: "typing:stop" }, (msg: { payload: { profileId: string } }) => {
          handlers.onTypingStop?.(msg.payload.profileId);
        })
        .on("broadcast", { event: "presence:update" }, (msg: {
          payload: { profileId: string; state: "online" | "away" | "offline" };
        }) => {
          handlers.onPresence?.(msg.payload.profileId, msg.payload.state);
        })
        .subscribe();

      return async () => {
        await client.removeChannel(channel);
      };
    },
    async unsubscribeFromThread() {
      return undefined;
    },
    async publishMessageCreated(threadId, message) {
      await broadcast(threadId, { event: "message:new", message });
    },
    async publishTypingStarted(threadId, profileId) {
      await broadcast(threadId, { event: "typing:start", profileId });
    },
    async publishTypingStopped(threadId, profileId) {
      await broadcast(threadId, { event: "typing:stop", profileId });
    },
    async publishReadReceipt(threadId, messageId, profileId) {
      await broadcast(threadId, { event: "message:read", messageId, profileId });
    },
    async publishPresence(threadId, profileId, state) {
      await broadcast(threadId, { event: "presence:update", profileId, state });
    },
  };
}
