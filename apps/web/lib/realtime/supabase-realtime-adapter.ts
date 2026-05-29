export type RealtimeEvent =
  | { type: "message:new"; conversationId: string; messageId: string }
  | { type: "message:read"; conversationId: string; messageId: string; userId: string }
  | { type: "typing:start"; conversationId: string; userId: string }
  | { type: "typing:stop"; conversationId: string; userId: string }
  | { type: "presence:update"; userId: string; status: string };

export type RealtimeProvider = "polling" | "supabase" | "socketio";

export function getRealtimeProvider(): RealtimeProvider {
  const v = process.env.REALTIME_PROVIDER ?? "polling";
  if (v === "supabase" || v === "socketio") return v;
  return "polling";
}

/** MVP: polling adapter — upgrade to Supabase channel or Socket.IO when enabled. */
export function subscribeToConversation(
  _conversationId: string,
  onEvent: (event: RealtimeEvent) => void
): () => void {
  const provider = getRealtimeProvider();
  if (provider === "polling") {
    return () => undefined;
  }
  void onEvent;
  return () => undefined;
}
