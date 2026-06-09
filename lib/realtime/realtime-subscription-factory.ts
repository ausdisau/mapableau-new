import type { RealtimeEvent } from "./supabase-realtime-adapter";
import { createPollingSubscription } from "./polling-realtime-adapter";

export type RealtimeSubscriptionOptions = {
  conversationId: string;
  fetchLatest: () => Promise<{ messageId: string } | null>;
  onEvent: (event: RealtimeEvent) => void;
  intervalMs?: number;
};

/**
 * Factory for message realtime — uses Supabase channel stub when configured,
 * otherwise falls back to polling.
 */
export function createMessageSubscription(
  options: RealtimeSubscriptionOptions
): () => void {
  const provider = process.env.REALTIME_PROVIDER ?? "polling";
  const supabaseEnabled = process.env.SUPABASE_REALTIME_ENABLED === "true";

  if (provider === "supabase" && supabaseEnabled) {
    return createSupabaseMessageSubscription(options);
  }

  return createPollingSubscription(
    options.conversationId,
    options.fetchLatest,
    options.onEvent,
    options.intervalMs
  );
}

function createSupabaseMessageSubscription(
  options: RealtimeSubscriptionOptions
): () => void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createPollingSubscription(
      options.conversationId,
      options.fetchLatest,
      options.onEvent,
      options.intervalMs
    );
  }

  let cancelled = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const poll = async () => {
    if (cancelled) return;
    try {
      const latest = await options.fetchLatest();
      if (latest) {
        options.onEvent({
          type: "message:new",
          conversationId: options.conversationId,
          messageId: latest.messageId,
        });
      }
    } catch {
      // ignore
    }
  };

  pollTimer = setInterval(poll, options.intervalMs ?? 3000);
  void poll();

  return () => {
    cancelled = true;
    if (pollTimer) clearInterval(pollTimer);
  };
}
