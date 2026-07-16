"use client";

import React, { useCallback, useEffect, useState } from "react";

import type { FacilitatedSession } from "@/lib/access-intelligence/learning/schemas";
import { LEARNING_STAGE_ORDER } from "@/lib/access-intelligence/learning/state-machine";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function FacilitateSessionClient({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<FacilitatedSession | null>(null);
  const [exportText, setExportText] = useState<string | null>(null);
  const [debrief, setDebrief] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(
      `/api/access-intelligence/learn/facilitate?sessionId=${encodeURIComponent(sessionId)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setSession(data.session);
    setDebrief(data.session.debriefNotes ?? "");
  }, [sessionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/access-intelligence/learn/facilitate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    if (data.session) setSession(data.session);
    if (data.accessibleExport) setExportText(data.accessibleExport);
    if (data.completionSummary) setExportText(data.accessibleExport ?? data.completionSummary);
  }

  if (error) return <p role="alert">{error}</p>;
  if (!session) return <p role="status">Loading facilitation session…</p>;

  return (
    <div className="space-y-8">
      <p className="text-slate-700">
        Scenario <strong>{session.scenarioId}</strong> ·{" "}
        {session.anonymousResponses ? "Anonymous responses" : "Named responses"} ·{" "}
        Group/individual facilitation supported.
      </p>

      <section aria-labelledby="pause-heading">
        <h2 id="pause-heading" className="text-xl font-black">
          Pause & reveal
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEARNING_STAGE_ORDER.map((stage) => (
            <button
              key={stage}
              type="button"
              className={`min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
              aria-pressed={session.pausedAtStage === stage}
              onClick={() =>
                void post({
                  action: "pause",
                  sessionId,
                  stage,
                }).then(() =>
                  post({
                    action: "reveal",
                    sessionId,
                    stageId: `st-${stage}`,
                  }),
                )
              }
            >
              {stage.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Paused at: {session.pausedAtStage ?? "n/a"}. Revealed:{" "}
          {session.revealedStageIds.join(", ") || "none"}.
        </p>
      </section>

      <section aria-labelledby="responses-heading">
        <h2 id="responses-heading" className="text-xl font-black">
          Collect responses
        </h2>
        <button
          type="button"
          className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() =>
            void post({
              action: "response",
              sessionId,
              stage: session.pausedAtStage ?? "decision",
              kind: "decision",
              payload: { optionId: "demo-response", note: "Facilitator-collected" },
            })
          }
        >
          Record anonymous sample response
        </button>
        <p className="mt-2 text-slate-600">{session.responses.length} responses</p>
      </section>

      <section aria-labelledby="debrief-heading">
        <h2 id="debrief-heading" className="text-xl font-black">
          Structured debrief
        </h2>
        <label className="mt-3 block">
          <span className="sr-only">Debrief notes</span>
          <textarea
            className={`min-h-28 w-full rounded-xl border border-slate-300 p-3 ${mapableCareFocusRing}`}
            value={debrief}
            onChange={(e) => setDebrief(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`mt-3 min-h-11 rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
          onClick={() =>
            void post({ action: "debrief", sessionId, notes: debrief })
          }
        >
          Save debrief
        </button>
      </section>

      <section aria-labelledby="export-heading">
        <h2 id="export-heading" className="text-xl font-black">
          Accessible export & completion summary
        </h2>
        <button
          type="button"
          className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => void post({ action: "export", sessionId })}
        >
          Generate accessible export
        </button>
        {exportText ? (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-4 text-sm whitespace-pre-wrap">
            {exportText}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
