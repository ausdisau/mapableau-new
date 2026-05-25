import type { RealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import type { Message } from "@/types/messages";

const gatewayUrl =
  process.env.NEXT_PUBLIC_REALTIME_GATEWAY_URL ?? "http://localhost:4010";

export function createSocketIoRealtimeAdapter(): RealtimeAdapter {
  return {
    async subscribeToThread(threadId, handlers) {
      if (typeof window === "undefined") return async () => undefined;

      const { io } = await import("socket.io-client");
      const socket = io(gatewayUrl, {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.emit("thread:join", { threadId });

      socket.on("message:new", (message: Message) => handlers.onMessage?.(message));
      socket.on("message:read", (payload: { messageId: string; profileId: string }) => {
        handlers.onRead?.(payload.messageId, payload.profileId);
      });
      socket.on("typing:start", (payload: { profileId: string }) => {
        handlers.onTypingStart?.(payload.profileId);
      });
      socket.on("typing:stop", (payload: { profileId: string }) => {
        handlers.onTypingStop?.(payload.profileId);
      });
      socket.on("presence:update", (payload: {
        profileId: string;
        state: "online" | "away" | "offline";
      }) => {
        handlers.onPresence?.(payload.profileId, payload.state);
      });

      return async () => {
        socket.emit("thread:leave", { threadId });
        socket.disconnect();
      };
    },
    async unsubscribeFromThread() {
      return undefined;
    },
    async publishMessageCreated(threadId, message) {
      await fetch(`${gatewayUrl}/internal/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, event: "message:new", payload: message }),
      }).catch(() => undefined);
    },
    async publishTypingStarted(threadId, profileId) {
      await fetch(`${gatewayUrl}/internal/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          event: "typing:start",
          payload: { profileId },
        }),
      }).catch(() => undefined);
    },
    async publishTypingStopped(threadId, profileId) {
      await fetch(`${gatewayUrl}/internal/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          event: "typing:stop",
          payload: { profileId },
        }),
      }).catch(() => undefined);
    },
    async publishReadReceipt(threadId, messageId, profileId) {
      await fetch(`${gatewayUrl}/internal/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          event: "message:read",
          payload: { messageId, profileId },
        }),
      }).catch(() => undefined);
    },
    async publishPresence(threadId, profileId, state) {
      await fetch(`${gatewayUrl}/internal/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          event: "presence:update",
          payload: { profileId, state },
        }),
      }).catch(() => undefined);
    },
  };
}
