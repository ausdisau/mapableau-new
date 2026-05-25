import type { Message } from "@/types/messages";

export interface RealtimeAdapter {
  subscribeToThread(
    threadId: string,
    handlers: {
      onMessage?: (message: Message) => void;
      onRead?: (messageId: string, profileId: string) => void;
      onTypingStart?: (profileId: string) => void;
      onTypingStop?: (profileId: string) => void;
      onPresence?: (profileId: string, state: "online" | "away" | "offline") => void;
    }
  ): Promise<() => void>;
  unsubscribeFromThread(threadId: string): Promise<void>;
  publishMessageCreated(threadId: string, message: Message): Promise<void>;
  publishTypingStarted(threadId: string, profileId: string): Promise<void>;
  publishTypingStopped(threadId: string, profileId: string): Promise<void>;
  publishReadReceipt(threadId: string, messageId: string, profileId: string): Promise<void>;
  publishPresence(
    threadId: string,
    profileId: string,
    state: "online" | "away" | "offline"
  ): Promise<void>;
}

let adapterInstance: RealtimeAdapter | null = null;

export function getRealtimeAdapter(): RealtimeAdapter {
  if (adapterInstance) return adapterInstance;

  const driver = process.env.REALTIME_DRIVER ?? "memory";
  if (driver === "socketio") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSocketIoRealtimeAdapter } = require("./socketio-realtime-adapter") as {
      createSocketIoRealtimeAdapter: () => RealtimeAdapter;
    };
    adapterInstance = createSocketIoRealtimeAdapter();
  } else if (driver === "supabase" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseRealtimeAdapter } = require("./supabase-realtime-adapter") as {
      createSupabaseRealtimeAdapter: () => RealtimeAdapter;
    };
    adapterInstance = createSupabaseRealtimeAdapter();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMemoryRealtimeAdapter } = require("./memory-realtime-adapter") as {
      createMemoryRealtimeAdapter: () => RealtimeAdapter;
    };
    adapterInstance = createMemoryRealtimeAdapter();
  }
  return adapterInstance!;
}

export function setRealtimeAdapterForTests(adapter: RealtimeAdapter | null) {
  adapterInstance = adapter;
}
