"use client";

import type { PersonaHistoryItem } from "@/lib/virtual-persona/types";

export function ConversationPanel({
  history,
  statusMessage,
  liveRegion,
}: {
  history: PersonaHistoryItem[];
  statusMessage: string;
  liveRegion: string;
}) {
  return (
    <section
      aria-labelledby="vp-conversation-heading"
      className="flex min-h-[20rem] flex-col rounded-xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2
          id="vp-conversation-heading"
          className="text-base font-bold text-[#0C1833]"
        >
          Conversation
        </h2>
        <p className="text-sm text-slate-600" id="vp-status">
          {statusMessage}
        </p>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-relevant="additions"
        aria-describedby="vp-status"
      >
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">
            No messages yet. Type at your own pace—including with AAC. There is
            no time limit.
          </p>
        ) : (
          history.map((item) => (
            <article
              key={item.id}
              className={
                item.speaker === "participant"
                  ? "ml-6 rounded-lg bg-[#005B7F] px-3 py-2 text-white"
                  : item.speaker === "system"
                    ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                    : "mr-6 rounded-lg bg-slate-100 px-3 py-2 text-[#0C1833]"
              }
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {item.speaker === "participant"
                  ? "You"
                  : item.speaker === "persona"
                    ? "MapAble Guide"
                    : "System"}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {item.text}
              </p>
              {item.turn?.sourceReferences?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-90">
                  {item.turn.sourceReferences.map((ref) => (
                    <li key={ref.id}>
                      Source: {ref.label} ({ref.evidenceStatus})
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.turn?.uncertainties?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-90">
                  {item.turn.uncertainties.map((u) => (
                    <li key={u}>Uncertainty: {u}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveRegion}
      </div>
    </section>
  );
}
