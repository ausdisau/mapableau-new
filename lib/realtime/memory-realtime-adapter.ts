import type { RealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import type { Message } from "@/types/messages";

type HandlerSet = {
  onMessage?: (message: Message) => void;
  onRead?: (messageId: string, profileId: string) => void;
  onTypingStart?: (profileId: string) => void;
  onTypingStop?: (profileId: string) => void;
  onPresence?: (profileId: string, state: "online" | "away" | "offline") => void;
};

const threadHandlers = new Map<string, Set<HandlerSet>>();

function emit(threadId: string, fn: (h: HandlerSet) => void) {
  const set = threadHandlers.get(threadId);
  if (!set) return;
  for (const h of set) fn(h);
}

export function createMemoryRealtimeAdapter(): RealtimeAdapter {
  return {
    async subscribeToThread(threadId, handlers) {
      if (!threadHandlers.has(threadId)) {
        threadHandlers.set(threadId, new Set());
      }
      threadHandlers.get(threadId)!.add(handlers);
      return () => {
        threadHandlers.get(threadId)?.delete(handlers);
      };
    },
    async unsubscribeFromThread(threadId) {
      threadHandlers.delete(threadId);
    },
    async publishMessageCreated(threadId, message) {
      emit(threadId, (h) => h.onMessage?.(message));
    },
    async publishTypingStarted(threadId, profileId) {
      emit(threadId, (h) => h.onTypingStart?.(profileId));
    },
    async publishTypingStopped(threadId, profileId) {
      emit(threadId, (h) => h.onTypingStop?.(profileId));
    },
    async publishReadReceipt(threadId, messageId, profileId) {
      emit(threadId, (h) => h.onRead?.(messageId, profileId));
    },
    async publishPresence(threadId, profileId, state) {
      emit(threadId, (h) => h.onPresence?.(profileId, state));
    },
  };
}
