"use client";

import { AccessResultCard } from "@/components/access-chat/AccessResultCard";
import type { AccessSearchResult } from "@/types/access-chat";

export type AccessChatUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: AccessSearchResult[];
};

type Props = {
  messages: AccessChatUiMessage[];
  listId: string;
  onOpenMarker?: (placeId: string) => void;
  onRefine?: (suggestion: string) => void;
  shareAccessProfile?: boolean;
};

export function AccessChatMessageList({
  messages,
  listId,
  onOpenMarker,
  onRefine,
  shareAccessProfile,
}: Props) {
  return (
    <div
      id={listId}
      className="flex max-h-[min(28rem,55vh)] flex-col gap-4 overflow-y-auto rounded-xl border-2 border-slate-200 bg-slate-50 p-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
    >
      {messages.length === 0 ? (
        <p className="text-sm text-slate-600">
          Ask about accessible places near you. Example: “Find a quiet
          wheelchair-accessible café near Chatswood with an accessible toilet.”
        </p>
      ) : null}

      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.role === "user"
              ? "ml-6 rounded-xl border-2 border-[#005B7F] bg-white p-3"
              : "mr-2 rounded-xl border-2 border-slate-300 bg-white p-3"
          }
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {m.role === "user" ? "You" : "MapAble Access"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0C1833]">
            {m.content}
          </p>
          {m.results && m.results.length > 0 ? (
            <ul className="mt-3 space-y-3" aria-label="Access search results">
              {m.results.map((r) => (
                <li key={r.placeId}>
                  <AccessResultCard
                    result={r}
                    onOpenMarker={onOpenMarker}
                    onRefine={onRefine}
                    shareAccessProfile={shareAccessProfile}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
