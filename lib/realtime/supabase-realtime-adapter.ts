import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export type RealtimeEvent =
  | { type: "message:new"; conversationId: string; messageId: string }
  | {
      type: "message:read";
      conversationId: string;
      messageId: string;
      userId: string;
    }
  | { type: "typing:start"; conversationId: string; userId: string }
  | { type: "typing:stop"; conversationId: string; userId: string }
  | { type: "presence:update"; userId: string; status: string };

export type RealtimeProvider = "polling" | "supabase" | "socketio";

export function getRealtimeProvider(): RealtimeProvider {
  const v =
    process.env.NEXT_PUBLIC_REALTIME_PROVIDER ??
    process.env.REALTIME_PROVIDER ??
    "polling";
  if (v === "supabase" || v === "socketio") return v;
  return "polling";
}

function isRealtimeEvent(payload: unknown): payload is RealtimeEvent {
  if (!payload || typeof payload !== "object" || !("type" in payload)) {
    return false;
  }
  const event = payload as { type?: unknown; conversationId?: unknown };
  return (
    typeof event.type === "string" && typeof event.conversationId === "string"
  );
}

export function subscribeToConversation(
  conversationId: string,
  onEvent: (event: RealtimeEvent) => void,
): () => void {
  const provider = getRealtimeProvider();
  if (provider === "polling") {
    return () => undefined;
  }

  if (provider === "supabase") {
    const client = createBrowserSupabaseClient();
    const channel = client
      .channel(`conversation:${conversationId}`)
      .on("broadcast", { event: "*" }, (message) => {
        if (isRealtimeEvent(message.payload)) {
          onEvent(message.payload);
        }
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }

  return () => undefined;
}
